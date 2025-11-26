import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { handleError } from '@/lib/errorHandler';
import { logger } from '@/lib/logger';
import { sendWhatsAppMessage } from '@/lib/whatsappCloudApi';
import { getCountrySymbol } from '@/lib/countryRules';

// Force dynamic rendering - Vercel cache buster
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Cron job para auto-guardar transacciones después de 30 minutos
 * Si el usuario no confirma, se guardan automáticamente con confirmado_por='timeout'
 * 
 * Basado en el sistema Baileys original
 */
export async function GET(req: NextRequest) {
  const supabase = getSupabaseAdmin();

  try {
    // Verificar CRON_SECRET (opcional en desarrollo local)
    const isDevelopment = process.env.NODE_ENV === 'development';
    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
    const expectedAuth = process.env.CRON_SECRET ? `Bearer ${process.env.CRON_SECRET}` : null;
    
    // Debug: Log para diagnóstico (solo en desarrollo)
    if (isDevelopment) {
      logger.debug('🔍 CRON_SECRET Debug:', {
        authHeader: authHeader ? authHeader.substring(0, 20) + '...' : 'null',
        expectedAuth: expectedAuth ? expectedAuth.substring(0, 20) + '...' : 'null',
        hasCronSecret: !!process.env.CRON_SECRET,
        cronSecretLength: process.env.CRON_SECRET?.length || 0,
        isDevelopment
      });
    }
    
    // En desarrollo local, permitir acceso sin autenticación si no viene header
    if (isDevelopment && !authHeader) {
      logger.warn('⚠️ DESARROLLO: Sin header de autorización, permitiendo acceso sin autenticación');
    } else if (isDevelopment && !process.env.CRON_SECRET) {
      logger.warn('⚠️ DESARROLLO: CRON_SECRET no configurado, permitiendo acceso sin autenticación');
    } else if (expectedAuth && authHeader !== expectedAuth) {
      logger.warn('❌ CRON_SECRET inválido', {
        received: authHeader ? authHeader.substring(0, 30) + '...' : 'null',
        expected: expectedAuth.substring(0, 30) + '...',
        match: authHeader === expectedAuth
      });
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    } else if (!isDevelopment && !expectedAuth) {
      // En producción, CRON_SECRET es obligatorio
      logger.error('❌ CRON_SECRET no configurado en producción');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    } else if (!isDevelopment && !authHeader) {
      // En producción, el header es obligatorio
      logger.error('❌ Header de autorización requerido en producción');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    logger.debug('🕐 Iniciando cron: confirm-expired');

    // ============================================================
    // OBTENER CONFIRMACIONES EXPIRADAS
    // ============================================================
    // ⚠️ IMPORTANTE: Procesar en lotes pequeños para no exceder límites de tiempo
    // Procesamos máximo 10 transacciones por ejecución para mantener el tiempo bajo
    const { data: expired, error: selectError } = await supabase
      .from('pending_confirmations')
      .select('*')
      .lt('expires_at', new Date().toISOString())
      .is('confirmed', null)
      .order('expires_at', { ascending: true }) // Procesar las más antiguas primero
      .limit(5); // ← Procesar máximo 5 por ejecución (suficiente para escenario actual, sin límite cuando migremos a Vercel Pro)

    if (selectError) {
      logger.error('❌ Error obteniendo expiradas:', selectError);
      return handleError(selectError, 'Error al obtener confirmaciones expiradas');
    }

    if (!expired || expired.length === 0) {
      logger.debug('ℹ️ Sin confirmaciones expiradas');
      return NextResponse.json({
        success: true,
        processed: 0,
        message: 'Sin confirmaciones expiradas'
      });
    }

    logger.debug(`⏰ Encontradas ${expired.length} confirmaciones expiradas`);

    // ============================================================
    // PROCESAR CADA EXPIRADA
    // ============================================================
    let processed = 0;
    let errors = 0;

    // Agrupar por usuario para enviar un solo mensaje por usuario
    const userMessages = new Map<string, { count: number; transactions: any[]; country_code: string }>();

    for (const exp of expired) {
      try {
        // Obtener predicción completa con información del usuario
        const { data: prediction } = await supabase
          .from('predicciones_groq')
          .select('resultado, usuario_id, original_timestamp')
          .eq('id', exp.prediction_id)
          .single();

        if (!prediction) {
          logger.warn(`⚠️ Predicción no encontrada: ${exp.prediction_id}`);
          errors++;
          continue;
        }

        // Obtener teléfono y country_code del usuario para enviar mensaje
        const { data: user } = await supabase
          .from('usuarios')
          .select('telefono, country_code')
          .eq('id', prediction.usuario_id)
          .single();

        // Actualizar predicción (confirmado_por='timeout')
        await supabase
          .from('predicciones_groq')
          .update({
            confirmado: true,
            confirmado_por: 'timeout',
            updated_at: new Date().toISOString()
          })
          .eq('id', exp.prediction_id);

        // Crear transacción con timestamp original
        if (prediction?.resultado) {
          await supabase
            .from('transacciones')
            .insert({
              usuario_id: prediction.usuario_id,
              tipo: prediction.resultado?.tipo || 'gasto',
              monto: prediction.resultado?.monto,
              categoria: prediction.resultado?.categoria,
              descripcion: prediction.resultado?.descripcion,
              fecha: prediction.original_timestamp, // ← TIMESTAMP ORIGINAL
              metodo_pago: prediction.resultado?.metodoPago,
              moneda: prediction.resultado?.moneda || 'BOB'
            });
          
          logger.debug(`✅ Transacción creada (timeout): ${prediction.original_timestamp}`);
          
          // Agrupar para mensaje
          if (user?.telefono) {
            const phone = user.telefono.startsWith('+') ? user.telefono.substring(1) : user.telefono;
            if (!userMessages.has(phone)) {
              userMessages.set(phone, { count: 0, transactions: [], country_code: user.country_code || 'BOL' });
            }
            const userData = userMessages.get(phone)!;
            userData.count++;
            userData.transactions.push(prediction.resultado);
          }
        }

        // Marcar confirmación como completada
        await supabase
          .from('pending_confirmations')
          .update({
            confirmed: true,
            confirmed_at: new Date().toISOString()
          })
          .eq('id', exp.id);

        logger.debug(`✅ Auto-guardada (TIMEOUT 30min): ${exp.prediction_id}`);
        processed++;

      } catch (err) {
        logger.error(`❌ Error procesando ${exp.prediction_id}:`, err);
        errors++;
      }
    }

    // Enviar mensajes de notificación a los usuarios
    let messagesSent = 0;
    for (const [phone, data] of userMessages.entries()) {
      try {
        const countryCode = data.country_code || 'BOL';
        const currencySymbol = getCountrySymbol(countryCode);
        let message: string;
        if (data.count === 1) {
          const tx = data.transactions[0];
          message = `✅ Transacción guardada automáticamente\n\n*Monto:* ${tx.monto} ${currencySymbol}\n*Categoría:* ${tx.categoria}\n*Descripción:* ${tx.descripcion}\n\n📱 Puedes editarla o eliminarla en la app en las próximas 48h`;
        } else {
          message = `✅ ${data.count} transacciones guardadas automáticamente\n\n📱 Puedes editarlas o eliminarlas en la app en las próximas 48h`;
        }
        
        await sendWhatsAppMessage(phone, message);
        messagesSent++;
        logger.debug(`✅ Mensaje de timeout enviado a ${phone.substring(0, 5)}...`);
      } catch (error: any) {
        logger.error(`❌ Error enviando mensaje a ${phone.substring(0, 5)}...:`, error);
        // No fallar el cron si falla el envío del mensaje
      }
    }

    logger.info(`🎉 CRON COMPLETADO: Procesadas: ${processed}, Errores: ${errors}, Mensajes enviados: ${messagesSent}`);

    return NextResponse.json({
      success: true,
      processed,
      errors,
      messages_sent: messagesSent,
      message: `Procesadas ${processed} confirmaciones expiradas`
    });

  } catch (error: any) {
    logger.error('❌ Error crítico en cron:', error);
    return handleError(error, 'Error crítico al procesar cron de confirmaciones expiradas');
  }
}






