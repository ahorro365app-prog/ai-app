import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { generateVerificationCode } from '@/lib/referralUtils';
import { z } from 'zod';
import { logger } from '@/lib/logger';

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
      return NextResponse.json(
        {
          success: false,
          message: 'Datos inválidos',
          errors: validation.error.errors,
        },
        { status: 400 }
      );
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
        console.error('❌ Usuario no encontrado para cambio de teléfono:', userId);
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
        .select('id, nombre')
        .eq('telefono', phone)
        .single();

      user = userData;
      userError = err;

      if (userError || !user) {
        console.error('❌ Usuario no encontrado:', phone);
        return NextResponse.json(
          {
            success: false,
            message: 'Usuario no encontrado con ese número de teléfono',
          },
          { status: 404 }
        );
      }
    }

    // 2. Generar código de 6 dígitos
    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos

    console.log(`🔐 Código generado: ${code} (expira en 10 minutos)`);

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
      console.error('❌ Error guardando código:', codeError);
      return NextResponse.json(
        {
          success: false,
          message: 'Error al generar código de verificación',
          error: codeError?.message,
        },
        { status: 500 }
      );
    }

    // 4. Enviar código por WhatsApp
    // TODO: Integrar con servicio de WhatsApp (Baileys Worker o Meta API)
    // Por ahora, solo guardamos el código y retornamos éxito
    // El envío real se hará cuando tengamos la integración con WhatsApp
    
    const message = `🔐 Tu código de verificación de Ahorro365 es: *${code}*\n\nEste código expira en 10 minutos.`;

    // Intentar enviar por Baileys Worker si está configurado
    const BAILEYS_WORKER_URL = process.env.NEXT_PUBLIC_BAILEYS_WORKER_URL || process.env.BAILEYS_WORKER_URL;
    if (BAILEYS_WORKER_URL) {
      try {
        // TODO: Agregar endpoint POST /send en el worker de Baileys
        // Por ahora, solo logueamos que se debería enviar
        // No exponer número de teléfono ni mensaje completo en logs
        logger.debug('📤 Debería enviar mensaje de verificación');
        logger.debug(`⚠️ Worker URL: ${BAILEYS_WORKER_URL ? 'configurado' : 'no configurado'}`);
        logger.debug('⚠️ NOTA: El worker necesita un endpoint POST /send para enviar mensajes');
      } catch (error) {
        console.error('❌ Error intentando enviar por WhatsApp:', error);
        // No fallar si el envío falla, el código ya está guardado
      }
    } else {
      console.warn('⚠️ BAILEYS_WORKER_URL no configurado, código generado pero no enviado');
    }

    // No exponer número de teléfono en logs
    logger.debug('✅ Código de verificación generado y guardado');

    return NextResponse.json({
      success: true,
      message: 'Código de verificación generado',
      // No retornamos el código por seguridad
      expiresIn: 600, // 10 minutos en segundos
    });
  } catch (error: any) {
    console.error('❌ Error en send-verification-code:', error);
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

