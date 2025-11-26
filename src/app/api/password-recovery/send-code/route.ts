import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { generateVerificationCode } from '@/lib/referralUtils';
import { sendWhatsAppMessage } from '@/lib/whatsappCloudApi';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const sendRecoveryCodeSchema = z.object({
  phone: z.string().min(1, 'Teléfono requerido'),
});

// Verificar configuración de WhatsApp
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || process.env.META_WHATSAPP_TOKEN;
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

/**
 * POST /api/password-recovery/send-code
 * 
 * Genera, guarda y envía un código de recuperación de contraseña de 6 dígitos por WhatsApp.
 * El código expira en 10 minutos.
 * 
 * Body: { phone: string }
 * 
 * FASE 3: Genera, guarda y envía el código por WhatsApp
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = sendRecoveryCodeSchema.safeParse(body);

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

    const { phone } = validation.data;
    const supabase = getSupabaseAdmin();

    logger.info('🔐 [ENDPOINT] Generando código de recuperación de contraseña - Teléfono: ' + phone.substring(0, 5) + '...');

    // Normalizar teléfono para búsqueda
    const phoneWithPlus = phone.startsWith('+') ? phone : `+${phone}`;
    const phoneWithoutPlus = phone.startsWith('+') ? phone.substring(1) : phone;
    
    // 1. Verificar que el usuario existe
    // Intentar buscar primero con el formato con +
    let { data: user, error: userError } = await supabase
      .from('usuarios')
      .select('id, nombre, telefono')
      .eq('telefono', phoneWithPlus)
      .single();

    // Si no se encontró con +, intentar sin +
    if (userError || !user) {
      const result = await supabase
        .from('usuarios')
        .select('id, nombre, telefono')
        .eq('telefono', phoneWithoutPlus)
        .single();
      
      user = result.data;
      userError = result.error;
    }

    if (userError || !user) {
      logger.error('❌ Usuario no encontrado para recuperación de contraseña');
      return NextResponse.json(
        {
          success: false,
          message: 'No se encontró una cuenta con ese número de teléfono.',
        },
        { status: 404 }
      );
    }

    // 2. Verificar si ya existe un código activo (no usado y no expirado) para este teléfono
    const now = new Date().toISOString();
    const { data: existingCode, error: checkError } = await supabase
      .from('codigos_verificacion')
      .select('id, codigo, expira_en, fecha_creacion')
      .eq('telefono', phoneWithPlus)
      .eq('usado', false)
      .gt('expira_en', now) // Solo códigos que aún no han expirado
      .order('fecha_creacion', { ascending: false })
      .limit(1)
      .maybeSingle();

    // También verificar sin +
    let existingCodeWithoutPlus = null;
    if (phoneWithPlus !== phoneWithoutPlus) {
      const { data: codeWithoutPlus } = await supabase
        .from('codigos_verificacion')
        .select('id, codigo, expira_en, fecha_creacion')
        .eq('telefono', phoneWithoutPlus)
        .eq('usado', false)
        .gt('expira_en', now)
        .order('fecha_creacion', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      existingCodeWithoutPlus = codeWithoutPlus;
    }

    const activeCode = existingCode || existingCodeWithoutPlus;

    if (checkError) {
      logger.error('❌ Error verificando código existente:', checkError);
      // Continuar con la generación de nuevo código si hay error en la verificación
    }

    // Si hay un código activo, retornar información sin generar uno nuevo
    if (activeCode) {
      const expiresAtDate = new Date(activeCode.expira_en);
      const nowDate = new Date();
      const secondsRemaining = Math.max(0, Math.floor((expiresAtDate.getTime() - nowDate.getTime()) / 1000));
      
      logger.info('✅ Código activo encontrado para recuperación, no se generará uno nuevo', {
        codeId: activeCode.id,
        expiresIn: secondsRemaining,
        phone: phoneWithPlus.substring(0, 5) + '...'
      });

      return NextResponse.json({
        success: true,
        message: 'Ya existe un código de recuperación activo',
        hasActiveCode: true,
        expiresIn: secondsRemaining,
        expiresAt: activeCode.expira_en,
        codeSaved: true,
      });
    }

    // 3. Generar código de 6 dígitos (solo si no hay código activo)
    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos

    logger.debug('🔐 Código de recuperación generado (expira en 10 minutos)');

    // 4. Guardar código en base de datos
    const { data: savedCode, error: codeError } = await supabase
      .from('codigos_verificacion')
      .insert({
        telefono: phoneWithPlus, // Guardar con formato estándar
        codigo: code,
        usado: false,
        expira_en: expiresAt.toISOString(),
        fecha_creacion: new Date().toISOString(),
      })
      .select()
      .single();

    if (codeError || !savedCode) {
      logger.error('❌ Error guardando código de recuperación:', codeError);
      return NextResponse.json(
        {
          success: false,
          message: 'Error al generar el código de recuperación. Intenta nuevamente.',
        },
        { status: 500 }
      );
    }

    logger.debug('✅ Código de recuperación guardado en base de datos');

    // 5. Enviar código por WhatsApp Cloud API
    const message = `🔐 Tu código de recuperación de contraseña de *Ahorro365* es:\n*${code}*\n\n⏱️ Este código expira en *10 minutos.*\n🚫 Si no solicitaste este código, ignora este mensaje.`;

    let whatsappSent = false;
    let whatsappError: string | undefined = undefined;
    
    try {
      // Normalizar número de teléfono (remover + si existe)
      const phoneNumberNormalized = phoneWithPlus.startsWith('+') ? phoneWithPlus.substring(1) : phoneWithPlus;
      
      logger.debug('📤 Intentando enviar código de recuperación por WhatsApp Cloud API...', {
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
          logger.debug('✅ Código de recuperación enviado por WhatsApp', {
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
        
        logger.error('❌ Error enviando código de recuperación por WhatsApp:', {
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
      
      logger.error('❌ Excepción al enviar código de recuperación por WhatsApp:', {
        errorMessage: error?.message || 'Unknown error',
        errorStack: error?.stack || 'No stack trace',
        errorName: error?.name || 'Unknown',
        errorString: String(error),
        whatsappError
      });
    }

    // No exponer número de teléfono en logs
    logger.debug('✅ Código de recuperación generado y guardado', {
      whatsappSent,
      whatsappError: whatsappError ? whatsappError.substring(0, 50) : undefined
    });

    // Si el envío por WhatsApp falló, retornar error pero el código está guardado
    if (!whatsappSent) {
      logger.error('❌ Código guardado pero WhatsApp falló:', {
        error: whatsappError,
        phone: phoneWithPlus.substring(0, 5) + '...',
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
        ? 'Código de recuperación generado y enviado' 
        : 'Código de recuperación generado (pero no se pudo enviar por WhatsApp)',
      whatsappSent,
      whatsappError: finalWhatsappError, // Asegurar que nunca sea undefined
      codeSaved: true, // El código está guardado en la BD
      // No retornamos el código por seguridad
      expiresIn: 600, // 10 minutos en segundos
    });

  } catch (error: any) {
    logger.error('❌ Error en send-recovery-code:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Error inesperado al generar código de recuperación. Intenta nuevamente.',
      },
      { status: 500 }
    );
  }
}

