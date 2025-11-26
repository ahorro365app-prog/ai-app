import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { z } from 'zod';
import { generateReferralCode } from '@/lib/referralUtils';
import { logger } from '@/lib/logger';

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
      return NextResponse.json(
        {
          success: false,
          message: 'Datos inválidos',
          errors: validation.error.errors,
        },
        { status: 400 }
      );
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
      logger.error('❌ Código no encontrado o inválido:', codeError);
      return NextResponse.json(
        {
          success: false,
          message: 'Código inválido o expirado',
        },
        { status: 400 }
      );
    }

    logger.debug(`✅ Código válido encontrado, ID: ${verificationCode.id}`);

    // 2. Marcar código como usado
    const { error: updateCodeError } = await supabase
      .from('codigos_verificacion')
      .update({ usado: true })
      .eq('id', verificationCode.id);

    if (updateCodeError) {
      logger.error('❌ Error marcando código como usado:', updateCodeError);
      return NextResponse.json(
        {
          success: false,
          message: 'Error al procesar verificación',
          error: updateCodeError.message,
        },
        { status: 500 }
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
        logger.error('❌ Usuario no encontrado para cambio de teléfono:', userError);
        return NextResponse.json(
          {
            success: false,
            message: 'Usuario no encontrado',
          },
          { status: 404 }
        );
      }

      // Verificar que el teléfono pendiente coincida
      if (user.telefono_pendiente !== phone) {
        // No exponer números de teléfono en logs
        logger.error('❌ El teléfono no coincide con el pendiente');
        return NextResponse.json(
          {
            success: false,
            message: 'El teléfono no coincide con el cambio pendiente',
          },
          { status: 400 }
        );
      }
    } else {
      // Para verificación normal: verificar por teléfono
      const { data: userData, error: err } = await supabase
        .from('usuarios')
        .select('id, whatsapp_verificado, codigo_referido')
        .eq('telefono', phone)
        .single();

      user = userData;
      userError = err;

      if (userError || !user) {
        logger.error('❌ Usuario no encontrado:', userError);
        return NextResponse.json(
          {
            success: false,
            message: 'Usuario no encontrado',
          },
          { status: 404 }
        );
      }
    }

    // 4. Verificar si es la primera vez que se verifica WhatsApp
    const esPrimeraVerificacion = !user.whatsapp_verificado;
    const necesitaCodigoReferido = esPrimeraVerificacion && !user.codigo_referido;

    // 5. Generar código de referido si es la primera verificación y no tiene código
    if (necesitaCodigoReferido) {
      try {
        const codigoReferido = generateReferralCode().toUpperCase(); // Asegurar mayúsculas
        logger.debug('🎁 Generando código de referido para primera verificación:', codigoReferido);
        
        const { error: codigoError } = await supabase
          .from('usuarios')
          .update({ codigo_referido: codigoReferido })
          .eq('id', user.id);

        if (codigoError) {
          logger.warn('⚠️ Error generando código de referido (no crítico):', codigoError);
          // No fallar la verificación si esto falla
        } else {
          logger.debug('✅ Código de referido generado exitosamente');
        }
      } catch (refError: any) {
        logger.warn('⚠️ Error en generación de código de referido (no crítico):', refError);
        // No fallar la verificación si esto falla
      }
    }

    // 6. Actualizar whatsapp_verificado en usuarios
    const { error: updateUserError } = await supabase
      .from('usuarios')
      .update({ whatsapp_verificado: true })
      .eq('id', user.id);

    if (updateUserError) {
      logger.error('❌ Error actualizando whatsapp_verificado:', updateUserError);
      return NextResponse.json(
        {
          success: false,
          message: 'Error al actualizar verificación',
          error: updateUserError.message,
        },
        { status: 500 }
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
      logger.debug(`📋 Usuario es referido, actualizando referidos.verifico_whatsapp`);
      
      const { error: updateReferralError } = await supabase
        .from('referidos')
        .update({
          verifico_whatsapp: true,
          fecha_verificacion: new Date().toISOString(),
        })
        .eq('id', referral.id);

      if (updateReferralError) {
        logger.warn('⚠️ Error actualizando referidos (no crítico):', updateReferralError);
        // No fallar si esto falla, ya que la verificación principal ya se completó
      } else {
        logger.debug('✅ Referido actualizado correctamente');
        
        // 8. Invocar trigger de notificación para referido verificado
        try {
          logger.debug(`🔔 Invocando trigger referral-verified para referido: ${referral.id}`);
          // ⚠️ SEGURIDAD: No usar localhost en producción
          const appUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://ahorro365.vercel.app');
          const triggerResponse = await fetch(`${appUrl}/api/notifications/triggers/referral-verified`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ referralId: referral.id }),
          });

          if (triggerResponse.ok) {
            const triggerData = await triggerResponse.json();
            logger.debug('✅ Trigger referral-verified ejecutado:', triggerData);
          } else {
            logger.warn('⚠️ Error invocando trigger referral-verified (no crítico):', await triggerResponse.text());
          }
        } catch (triggerError: any) {
          logger.warn('⚠️ Error invocando trigger referral-verified (no crítico):', triggerError?.message);
          // No fallar si el trigger falla, ya que la verificación principal ya se completó
        }
      }
    }

    logger.debug(`✅ WhatsApp verificado exitosamente para usuario: ${user.id}`);

    return NextResponse.json({
      success: true,
      message: 'WhatsApp verificado exitosamente',
    });
  } catch (error: any) {
    logger.error('❌ Error en verify-code:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Error interno del servidor',
        error: error?.message || 'Error desconocido',
      },
      { status: 500 }
    );
  }
}

