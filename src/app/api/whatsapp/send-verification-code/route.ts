import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { generateVerificationCode } from '@/lib/referralUtils';
import { sendWhatsAppMessage } from '@/lib/whatsappCloudApi';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { handleError, handleValidationError, handleNotFoundError, ErrorType } from '@/lib/errorHandler';

// Verificar configuración de WhatsApp
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || process.env.META_WHATSAPP_TOKEN;
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

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
  logger.info('🚀 [ENDPOINT] POST /api/whatsapp/send-verification-code - INICIANDO');
  try {
    const body = await request.json();
    logger.debug('📥 [ENDPOINT] Body recibido:', {
      hasPhone: !!body.phone,
      phoneLength: body.phone?.length,
      isPhoneChange: body.isPhoneChange,
      hasUserId: !!body.userId
    });
    const validation = sendCodeSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Datos inválidos',
          errors: validation.error.issues,
        },
        { status: 400 }
      );
    }

    const { phone, isPhoneChange, userId } = validation.data;
    const supabase = getSupabaseAdmin();

    // No exponer número de teléfono en logs por seguridad
    logger.info(`📱 [ENDPOINT] Enviando código de verificación${isPhoneChange ? ' (cambio de teléfono)' : ''} - Teléfono: ${phone.substring(0, 5)}...`);

    // 1. Verificar que el usuario existe
    // Si es cambio de teléfono, verificar por userId en lugar de teléfono
    let user;
    let userError;

    if (isPhoneChange && userId) {
      // Para cambio de teléfono: verificar que el usuario existe
      // Nota: telefono_pendiente puede ser null o diferente si se acaba de guardar
      // Por eso solo verificamos que el usuario existe, no que telefono_pendiente coincida
      const { data: userData, error: err } = await supabase
        .from('usuarios')
        .select('id, nombre, telefono_pendiente')
        .eq('id', userId)
        .single();

      user = userData;
      userError = err;

      if (userError || !user) {
        logger.error('❌ Usuario no encontrado para cambio de teléfono:', userId);
        return NextResponse.json(
          {
            success: false,
            message: 'Usuario no encontrado',
          },
          { status: 404 }
        );
      }

      // Para cambio de teléfono, no verificamos que telefono_pendiente coincida
      // porque puede haber un pequeño delay en la actualización de la BD
      // o puede ser que se esté guardando en paralelo
      // El teléfono a verificar es el nuevo teléfono (phone), no el actual del usuario
    } else {
      // Para verificación normal: verificar por teléfono
      const { data: userData, error: err } = await supabase
        .from('usuarios')
        .select('id, nombre')
        .eq('telefono', phone)
        .single();

      user = userData;
      userError = err;

      if (userError || !user) {
        logger.error('❌ Usuario no encontrado');
        return NextResponse.json(
          {
            success: false,
            message: 'Usuario no encontrado con ese número de teléfono',
          },
          { status: 404 }
        );
      }
    }

    // 2. Verificar si ya existe un código activo (no usado y no expirado) para este teléfono
    const now = new Date().toISOString();
    const { data: existingCode, error: checkError } = await supabase
      .from('codigos_verificacion')
      .select('id, codigo, expira_en, fecha_creacion')
      .eq('telefono', phone)
      .eq('usado', false)
      .gt('expira_en', now) // Solo códigos que aún no han expirado
      .order('fecha_creacion', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (checkError) {
      logger.error('❌ Error verificando código existente:', checkError);
      // Continuar con la generación de nuevo código si hay error en la verificación
    }

    // Si hay un código activo, retornar información sin generar uno nuevo
    if (existingCode) {
      const expiresAtDate = new Date(existingCode.expira_en);
      const nowDate = new Date();
      const secondsRemaining = Math.max(0, Math.floor((expiresAtDate.getTime() - nowDate.getTime()) / 1000));
      
      logger.info('✅ Código activo encontrado, no se generará uno nuevo', {
        codeId: existingCode.id,
        expiresIn: secondsRemaining,
        phone: phone.substring(0, 5) + '...'
      });

      return NextResponse.json({
        success: true,
        message: 'Ya existe un código de verificación activo',
        hasActiveCode: true,
        expiresIn: secondsRemaining,
        expiresAt: existingCode.expira_en,
        // No retornamos el código por seguridad
        codeSaved: true,
      });
    }

    // 3. Generar código de 6 dígitos (solo si no hay código activo)
    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos

    logger.debug('🔐 Código de verificación generado (expira en 10 minutos)');

    // 4. Guardar código en base de datos
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
      logger.error('❌ Error guardando código:', codeError);
      return NextResponse.json(
        {
          success: false,
          message: 'Error al generar código de verificación',
          error: codeError?.message,
        },
        { status: 500 }
      );
    }

    // 4. Enviar código por WhatsApp Cloud API
    const message = `🔐 Tu código de verificación de Ahorro365 es: \n*${code}*\n\n⏱️Este código expira en 10 minutos.`;

    let whatsappSent = false;
    let whatsappError: string | undefined;

    try {
      // Normalizar número de teléfono (remover + si existe)
      const phoneNumberNormalized = phone.startsWith('+') ? phone.substring(1) : phone;
      
      logger.debug('📤 Intentando enviar código por WhatsApp Cloud API...', {
        phone: phoneNumberNormalized.substring(0, 5) + '...',
        hasToken: !!WHATSAPP_ACCESS_TOKEN,
        hasPhoneId: !!WHATSAPP_PHONE_NUMBER_ID
      });
      
      const sendResult = await sendWhatsAppMessage(phoneNumberNormalized, message);
      
      // Logging detallado del resultado
      logger.debug('📤 Resultado de sendWhatsAppMessage:', {
        success: sendResult.success,
        message_id: sendResult.message_id,
        error: sendResult.error,
        errorCode: sendResult.errorCode,
        errorType: sendResult.errorType,
        phoneLength: phoneNumberNormalized.length,
        phonePrefix: phoneNumberNormalized.substring(0, 5)
      });
      
      if (sendResult.success) {
        // Verificar que realmente hay un message_id
        if (!sendResult.message_id) {
          logger.warn('⚠️ WhatsApp retornó success pero sin message_id - puede no haberse enviado');
          whatsappSent = false;
          whatsappError = 'WhatsApp API retornó éxito pero sin message_id. El mensaje puede no haberse enviado.';
        } else {
          whatsappSent = true;
          logger.debug('✅ Código de verificación enviado por WhatsApp', {
            message_id: sendResult.message_id,
            phoneLength: phoneNumberNormalized.length
          });
        }
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
          phone: phoneNumberNormalized.substring(0, 5) + '...',
          hasToken: !!WHATSAPP_ACCESS_TOKEN,
          hasPhoneId: !!WHATSAPP_PHONE_NUMBER_ID
        });
      }
    } catch (error: any) {
      whatsappSent = false;
      whatsappError = error?.message || error?.toString() || 'Error desconocido al enviar mensaje por WhatsApp';
      logger.error('❌ Excepción al enviar código por WhatsApp:', {
        errorMessage: error?.message || 'Unknown error',
        errorStack: error?.stack || 'No stack trace',
        errorName: error?.name || 'Unknown',
        errorString: String(error),
        whatsappError
      });
    }

    // No exponer número de teléfono en logs
    logger.debug('✅ Código de verificación generado y guardado', {
      whatsappSent,
      whatsappError: whatsappError ? whatsappError.substring(0, 50) : undefined
    });

    // Si el envío por WhatsApp falló, retornar error pero el código está guardado
    if (!whatsappSent) {
      logger.error('❌ Código guardado pero WhatsApp falló:', {
        error: whatsappError,
        phone: phone.substring(0, 5) + '...',
        codeId: savedCode?.id
      });
      
      // Detectar si es un error de token expirado
      const isTokenExpired = whatsappError?.includes('expired') || 
                            whatsappError?.includes('Session has expired') ||
                            whatsappError?.includes('expiró');
      
      const userFriendlyMessage = isTokenExpired
        ? 'El token de WhatsApp ha expirado. Por favor, contacta al soporte técnico para regenerar el token.'
        : 'No se pudo enviar el código por WhatsApp. El código está guardado, puedes intentar de nuevo.';
      
      return NextResponse.json({
        success: false,
        message: userFriendlyMessage,
        error: whatsappError || 'Error desconocido al enviar mensaje',
        codeSaved: true, // El código está guardado, el usuario puede intentar de nuevo
        expiresIn: 600, // 10 minutos en segundos
        isTokenExpired, // Indicar si es un problema de token
        // Información de debugging (solo en desarrollo)
        ...(process.env.NODE_ENV !== 'production' ? {
          debug: {
            hasToken: !!WHATSAPP_ACCESS_TOKEN,
            hasPhoneId: !!WHATSAPP_PHONE_NUMBER_ID,
            tokenLength: WHATSAPP_ACCESS_TOKEN?.length || 0,
            phoneId: WHATSAPP_PHONE_NUMBER_ID,
            errorDetails: whatsappError
          }
        } : {})
      }, { status: 500 });
    }

    // Asegurar que whatsappError nunca sea undefined
    const finalWhatsappError = whatsappError || 'Error desconocido al enviar mensaje por WhatsApp';
    
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
    logger.error('❌ Error en send-verification-code:', error);
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

