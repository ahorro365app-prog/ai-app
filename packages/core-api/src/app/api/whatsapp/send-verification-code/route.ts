import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { generateVerificationCode } from '@/lib/referralUtils';
import { sendWhatsAppMessage } from '@/lib/whatsappCloudApi';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { handleError, handleValidationError, handleNotFoundError, ErrorType } from '@/lib/errorHandler';

const sendCodeSchema = z.object({
  phone: z.string().min(1, 'Teléfono requerido'),
  isPhoneChange: z.boolean().optional(), // Indica si es un cambio de teléfono
  userId: z.string().uuid().optional(), // ID del usuario que está cambiando (para cambio de teléfono)
});

/**
 * POST /api/whatsapp/send-verification-code
 * 
 * Genera y envía un código de verificación de 6 dígitos por WhatsApp.
 * 
 * Body: { phone: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = sendCodeSchema.safeParse(body);

    if (!validation.success) {
      return handleValidationError('Datos inválidos', validation.error.errors);
    }

    const { phone, isPhoneChange, userId } = validation.data;
    const supabase = getSupabaseAdmin();

    // No exponer número de teléfono en logs por seguridad
    logger.debug(`📱 Enviando código de verificación${isPhoneChange ? ' (cambio de teléfono)' : ''}`);

    // 1. Verificar que el usuario existe
    // Si es cambio de teléfono, verificar por userId en lugar de teléfono
    let user;
    let userError;

    if (isPhoneChange && userId) {
      // Para cambio de teléfono: verificar que el usuario existe y tiene telefono_pendiente
      const { data: userData, error: err } = await supabase
        .from('usuarios')
        .select('id, nombre, telefono_pendiente')
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
        .select('id, nombre')
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
          .select('id, nombre')
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
            .select('id, nombre, telefono');
          
          if (phoneWithoutPlus.length < 10) {
            // Número truncado: buscar que empiece con estos dígitos
            logger.debug('⚠️ Número parece truncado, buscando usuarios que empiecen con estos dígitos');
            
            const { data: users1 } = await supabase
              .from('usuarios')
              .select('id, nombre, telefono')
              .ilike('telefono', `${phoneWithoutPlus}%`)
              .limit(5);
            
            const { data: users2 } = await supabase
              .from('usuarios')
              .select('id, nombre, telefono')
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
                .select('id, nombre')
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
                .select('id, nombre')
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
                  .select('id, nombre')
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
                  .select('id, nombre')
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

    // 2. Generar código de 6 dígitos
    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos

    logger.debug('🔐 Código generado (expira en 10 minutos)');

    // 3. Guardar código en base de datos
    const { data: savedCode, error: codeError } = await supabase
      .from('codigos_verificacion')
      .insert({
        telefono: phone,
        codigo: code,
        usado: false,
        expira_en: expiresAt.toISOString(),
        fecha_creacion: new Date().toISOString(),
      })
      .select()
      .single();

    if (codeError || !savedCode) {
      return handleError(
        codeError || new Error('Error al guardar código'),
        'Error al generar código de verificación',
        ErrorType.DATABASE
      );
    }

    // 4. Enviar código por WhatsApp Cloud API
    const message = `🔐 Tu código de verificación de Ahorro365 es: *${code}*\n\nEste código expira en 10 minutos.`;

    let whatsappSent = false;
    let whatsappError: string | undefined = undefined;
    
    try {
      // Normalizar número de teléfono (remover + si existe)
      const phoneNumberNormalized = phone.startsWith('+') ? phone.substring(1) : phone;
      
      logger.debug('📤 Enviando código de verificación por WhatsApp:', {
        phoneOriginal: phone.substring(0, 5) + '...',
        phoneNormalized: phoneNumberNormalized.substring(0, 5) + '...',
        phoneLength: phoneNumberNormalized.length,
        hasToken: !!process.env.WHATSAPP_ACCESS_TOKEN,
        hasPhoneId: !!process.env.WHATSAPP_PHONE_NUMBER_ID
      });
      
      const sendResult = await sendWhatsAppMessage(phoneNumberNormalized, message);
      
      if (sendResult.success) {
        whatsappSent = true;
        logger.debug('✅ Código de verificación enviado por WhatsApp:', {
          message_id: sendResult.message_id,
          phoneLength: phoneNumberNormalized.length
        });
      } else {
        whatsappSent = false;
        // Asegurar que siempre haya un mensaje de error
        if (sendResult.error) {
          whatsappError = sendResult.errorCode 
            ? `Error ${sendResult.errorCode}: ${sendResult.error}`
            : sendResult.error;
        } else if (sendResult.errorCode) {
          whatsappError = `Error ${sendResult.errorCode}: No se pudo enviar el mensaje por WhatsApp`;
        } else {
          whatsappError = 'No se pudo enviar el mensaje por WhatsApp. Verifica la configuración del servidor (token y phone_id).';
        }
        
        logger.error('❌ Error enviando código por WhatsApp:', {
          error: sendResult.error,
          errorCode: sendResult.errorCode,
          errorType: sendResult.errorType,
          whatsappError,
          phoneNormalized: phoneNumberNormalized.substring(0, 5) + '...',
          phoneLength: phoneNumberNormalized.length,
          hasToken: !!process.env.WHATSAPP_ACCESS_TOKEN,
          hasPhoneId: !!process.env.WHATSAPP_PHONE_NUMBER_ID,
          sendResult: JSON.stringify(sendResult)
        });
      }
    } catch (error: any) {
      whatsappSent = false;
      whatsappError = error?.message || error?.toString() || 'Error desconocido al enviar mensaje por WhatsApp';
      logger.error('❌ Excepción enviando código por WhatsApp:', {
        errorMessage: error?.message || 'Unknown error',
        errorStack: error?.stack || 'No stack trace',
        errorName: error?.name || 'Unknown',
        errorString: String(error),
        whatsappError,
        phoneOriginal: phone.substring(0, 5) + '...'
      });
    }

    // Asegurar que whatsappError nunca sea undefined
    const finalWhatsappError = whatsappError || 'Error desconocido al enviar mensaje por WhatsApp';
    
    // No exponer número de teléfono en logs
    logger.debug('✅ Código de verificación generado y guardado', {
      whatsappSent,
      whatsappError: finalWhatsappError.substring(0, 50),
      willReturnError: finalWhatsappError
    });

    return NextResponse.json({
      success: true,
      message: whatsappSent 
        ? 'Código de verificación generado y enviado' 
        : 'Código de verificación generado (pero no se pudo enviar por WhatsApp)',
      whatsappSent,
      whatsappError: finalWhatsappError, // Asegurar que nunca sea undefined
      codeSaved: true, // El código está guardado en la BD
      // No retornamos el código por seguridad
      expiresIn: 600, // 10 minutos en segundos
    });
  } catch (error: any) {
    return handleError(
      error,
      'Error interno del servidor',
      ErrorType.INTERNAL
    );
  }
}

