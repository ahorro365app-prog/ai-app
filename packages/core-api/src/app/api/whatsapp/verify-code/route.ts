import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { z } from 'zod';
import { generateReferralCode } from '@/lib/referralUtils';
import { logger } from '@/lib/logger';
import { handleError, handleValidationError, handleNotFoundError, ErrorType } from '@/lib/errorHandler';

const verifyCodeSchema = z.object({
  phone: z.string().min(1, 'Teléfono requerido'),
  code: z.string().length(6, 'El código debe tener 6 dígitos'),
  isPhoneChange: z.boolean().optional(), // Indica si es un cambio de teléfono
  userId: z.string().uuid().optional(), // ID del usuario que está cambiando (para cambio de teléfono)
});

/**
 * POST /api/whatsapp/verify-code
 * 
 * Verifica un código de verificación de WhatsApp.
 * 
 * Body: { phone: string, code: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = verifyCodeSchema.safeParse(body);

    if (!validation.success) {
      return handleValidationError('Datos inválidos', validation.error.errors);
    }

    const { phone, code, isPhoneChange, userId } = validation.data;
    const supabase = getSupabaseAdmin();

    // No exponer número de teléfono en logs por seguridad
    logger.debug(`🔐 Verificando código${isPhoneChange ? ' (cambio de teléfono)' : ''}`);

    // 1. Buscar código en codigos_verificacion
    const { data: verificationCode, error: codeError } = await supabase
      .from('codigos_verificacion')
      .select('*')
      .eq('telefono', phone)
      .eq('codigo', code)
      .eq('usado', false)
      .gte('expira_en', new Date().toISOString())
      .order('fecha_creacion', { ascending: false })
      .limit(1)
      .single();

    if (codeError || !verificationCode) {
      return handleValidationError('Código inválido o expirado');
    }

    logger.debug('✅ Código válido encontrado');

    // 2. Marcar código como usado
    const { error: updateCodeError } = await supabase
      .from('codigos_verificacion')
      .update({ usado: true })
      .eq('id', verificationCode.id);

    if (updateCodeError) {
      return handleError(
        updateCodeError,
        'Error al procesar verificación',
        ErrorType.DATABASE
      );
    }

    // 3. Buscar usuario
    // Si es cambio de teléfono, buscar por userId. Si no, buscar por teléfono
    let user;
    let userError;

    if (isPhoneChange && userId) {
      // Para cambio de teléfono: verificar que el usuario existe y tiene telefono_pendiente
      const { data: userData, error: err } = await supabase
        .from('usuarios')
        .select('id, whatsapp_verificado, telefono_pendiente, codigo_referido')
        .eq('id', userId)
        .single();

      user = userData;
      userError = err;

      if (userError || !user) {
        return handleNotFoundError('Usuario');
      }

      // Verificar que el teléfono pendiente coincida
      if (user.telefono_pendiente !== phone) {
        return handleValidationError('El teléfono no coincide con el cambio pendiente');
      }
    } else {
      // Para verificación normal: verificar por teléfono
      // Usar la misma lógica que el webhook de transacciones (búsqueda con/sin + y flexible)
      const phoneWithPlus = phone.startsWith('+') ? phone : `+${phone}`;
      const phoneWithoutPlus = phone.startsWith('+') ? phone.substring(1) : phone;
      
      logger.debug('🔍 Buscando usuario con teléfono:', {
        originalLength: phone?.length || 0,
        withPlusLength: phoneWithPlus.length,
        withoutPlusLength: phoneWithoutPlus.length,
        withPlusPrefix: phoneWithPlus.substring(0, 6) + '...',
        withoutPlusPrefix: phoneWithoutPlus.substring(0, 5) + '...'
      });
      
      // Intentar buscar primero con el formato con +
      let { data: userData, error: err } = await supabase
        .from('usuarios')
        .select('id, whatsapp_verificado, codigo_referido')
        .eq('telefono', phoneWithPlus)
        .single();

      user = userData;
      userError = err;

      logger.debug('🔍 Resultado búsqueda con +:', {
        found: !!user,
        errorCode: userError?.code,
        errorMessage: userError?.message?.substring(0, 50)
      });

      // Si no se encontró con +, intentar sin +
      if (userError || !user) {
        logger.debug('📱 Usuario no encontrado con formato +, intentando sin +');
        const result = await supabase
          .from('usuarios')
          .select('id, whatsapp_verificado, codigo_referido')
          .eq('telefono', phoneWithoutPlus)
          .single();
        
        user = result.data;
        userError = result.error;
        
        logger.debug('🔍 Resultado búsqueda sin +:', {
          found: !!user,
          errorCode: userError?.code,
          errorMessage: userError?.message?.substring(0, 50)
        });
      }
      
      // Si aún no se encontró, intentar búsqueda más flexible (por si hay espacios u otros caracteres)
      if (userError || !user) {
        logger.debug('📱 Intentando búsqueda flexible (LIKE)');
        
        try {
          let query = supabase
            .from('usuarios')
            .select('id, whatsapp_verificado, codigo_referido, telefono');
          
          if (phoneWithoutPlus.length < 10) {
            // Número truncado: buscar que empiece con estos dígitos
            logger.debug('⚠️ Número parece truncado, buscando usuarios que empiecen con estos dígitos');
            
            const { data: users1 } = await supabase
              .from('usuarios')
              .select('id, whatsapp_verificado, codigo_referido, telefono')
              .ilike('telefono', `${phoneWithoutPlus}%`)
              .limit(5);
            
            const { data: users2 } = await supabase
              .from('usuarios')
              .select('id, whatsapp_verificado, codigo_referido, telefono')
              .ilike('telefono', `${phoneWithPlus}%`)
              .limit(5);
            
            const allUsers = [...(users1 || []), ...(users2 || [])];
            const uniqueUsers = Array.from(
              new Map(allUsers.map(u => [u.id, u])).values()
            );
            
            if (uniqueUsers.length === 1) {
              // Solo un resultado: usarlo directamente
              const { data: fullUser } = await supabase
                .from('usuarios')
                .select('id, whatsapp_verificado, codigo_referido')
                .eq('id', uniqueUsers[0].id)
                .single();
              
              if (fullUser) {
                user = fullUser;
                userError = null;
                logger.debug('✅ Usuario encontrado con búsqueda flexible (número truncado, único resultado)');
              }
            } else if (uniqueUsers.length > 1) {
              // Múltiples resultados: buscar el que mejor coincida
              const normalizedSearch = phoneWithoutPlus.replace(/\D/g, '');
              const bestMatch = uniqueUsers.find(u => {
                const telNormalized = (u.telefono || '').replace(/\D/g, '');
                return telNormalized.startsWith(normalizedSearch);
              }) || uniqueUsers[0];
              
              const { data: fullUser } = await supabase
                .from('usuarios')
                .select('id, whatsapp_verificado, codigo_referido')
                .eq('id', bestMatch.id)
                .single();
              
              if (fullUser) {
                user = fullUser;
                userError = null;
                logger.debug('✅ Usuario encontrado con búsqueda flexible (número truncado, múltiples resultados)');
              }
            }
          } else {
            // Número completo: buscar que contenga estos dígitos
            query = query.or(`telefono.ilike.%${phoneWithoutPlus}%,telefono.ilike.%${phoneWithPlus}%`);
            const { data: users } = await query.limit(5);
            
            if (users && users.length > 0) {
              // Buscar coincidencia exacta
              const exactMatch = users.find(u => {
                const tel = (u.telefono || '').replace(/\s+/g, '').replace(/[^\d+]/g, '');
                return tel === phoneWithPlus || tel === phoneWithoutPlus;
              });
              
              if (exactMatch) {
                const { data: fullUser } = await supabase
                  .from('usuarios')
                  .select('id, whatsapp_verificado, codigo_referido')
                  .eq('id', exactMatch.id)
                  .single();
                
                if (fullUser) {
                  user = fullUser;
                  userError = null;
                  logger.debug('✅ Usuario encontrado con búsqueda flexible (coincidencia exacta)');
                }
              } else if (users.length === 1) {
                // Solo un resultado: usarlo
                const { data: fullUser } = await supabase
                  .from('usuarios')
                  .select('id, whatsapp_verificado, codigo_referido')
                  .eq('id', users[0].id)
                  .single();
                
                if (fullUser) {
                  user = fullUser;
                  userError = null;
                  logger.debug('✅ Usuario encontrado con búsqueda flexible (único resultado)');
                }
              }
            }
          }
        } catch (flexError: any) {
          logger.error('❌ Excepción en búsqueda flexible:', flexError);
        }
      }

      if (userError || !user) {
        return handleNotFoundError('Usuario');
      }
    }

    // 4. Verificar si es la primera vez que se verifica WhatsApp
    const esPrimeraVerificacion = !user.whatsapp_verificado;
    const necesitaCodigoReferido = esPrimeraVerificacion && !user.codigo_referido;

    // 5. Generar código de referido si es la primera verificación y no tiene código
    if (necesitaCodigoReferido) {
      try {
        const codigoReferido = generateReferralCode().toUpperCase(); // Asegurar mayúsculas
        logger.debug('🎁 Generando código de referido para primera verificación');
        
        const { error: codigoError } = await supabase
          .from('usuarios')
          .update({ codigo_referido: codigoReferido })
          .eq('id', user.id);

        if (codigoError) {
          logger.warn('⚠️ Error generando código de referido (no crítico)');
          // No fallar la verificación si esto falla
        } else {
          logger.debug('✅ Código de referido generado exitosamente');
        }
      } catch (refError: any) {
        logger.warn('⚠️ Error en generación de código de referido (no crítico)');
        // No fallar la verificación si esto falla
      }
    }

    // 6. Actualizar whatsapp_verificado en usuarios
    const { error: updateUserError } = await supabase
      .from('usuarios')
      .update({ whatsapp_verificado: true })
      .eq('id', user.id);

    if (updateUserError) {
      return handleError(
        updateUserError,
        'Error al actualizar verificación',
        ErrorType.DATABASE
      );
    }

    // 7. Si el usuario es un referido, actualizar referidos.verifico_whatsapp
    // Buscar si existe un registro en referidos donde referido_id = user.id
    const { data: referral, error: referralError } = await supabase
      .from('referidos')
      .select('id, verifico_whatsapp')
      .eq('referido_id', user.id)
      .eq('verifico_whatsapp', false)
      .limit(1)
      .maybeSingle();

    if (referral && !referralError) {
      logger.debug('📋 Usuario es referido, actualizando referidos.verifico_whatsapp');
      
      const { error: updateReferralError } = await supabase
        .from('referidos')
        .update({
          verifico_whatsapp: true,
          fecha_verificacion: new Date().toISOString(),
        })
        .eq('id', referral.id);

      if (updateReferralError) {
        logger.warn('⚠️ Error actualizando referidos (no crítico)');
        // No fallar si esto falla, ya que la verificación principal ya se completó
      } else {
        logger.debug('✅ Referido actualizado correctamente');
        
        // 8. Invocar trigger de notificación para referido verificado
        try {
          logger.debug('🔔 Invocando trigger referral-verified');
          const triggerResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/notifications/triggers/referral-verified`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ referralId: referral.id }),
          });

          if (triggerResponse.ok) {
            const triggerData = await triggerResponse.json();
            logger.debug('✅ Trigger referral-verified ejecutado');
          } else {
            logger.warn('⚠️ Error invocando trigger referral-verified (no crítico)');
          }
        } catch (triggerError: any) {
          logger.warn('⚠️ Error invocando trigger referral-verified (no crítico)');
          // No fallar si el trigger falla, ya que la verificación principal ya se completó
        }
      }
    }

    logger.debug('✅ WhatsApp verificado exitosamente');

    return NextResponse.json({
      success: true,
      message: 'WhatsApp verificado exitosamente',
    });
  } catch (error: any) {
    return handleError(
      error,
      'Error interno del servidor',
      ErrorType.INTERNAL
    );
  }
}

