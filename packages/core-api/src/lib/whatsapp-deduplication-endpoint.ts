/**
 * Servicio de deduplicación para WhatsApp Cloud API
 * Verifica si un mensaje ya fue procesado usando wa_message_id
 */

import { getSupabaseAdmin } from './supabaseAdmin';
import { logger } from './logger';

/**
 * Verifica si un mensaje WhatsApp ya fue procesado
 * @param waMessageId - ID del mensaje de WhatsApp (wamid.*)
 * @returns Datos de la predicción si existe, null si no existe
 */
export async function checkDuplicateWhatsAppMessage(waMessageId: string) {
  if (!waMessageId) {
    logger.debug('⚠️ checkDuplicateWhatsAppMessage: waMessageId vacío');
    return null;
  }

  try {
    const supabase = getSupabaseAdmin();
    
    const { data, error } = await supabase
      .from('predicciones_groq')
      .select('id, resultado, confirmado, created_at')
      .eq('wa_message_id', waMessageId)
      .single();

    // PGRST116 = "No rows returned" - esto es normal si no existe
    if (error && (error as any).code !== 'PGRST116') {
      logger.error('❌ Error verificando duplicado:', {
        error,
        waMessageId: waMessageId.substring(0, 20) + '...'
      });
      return null;
    }

    if (data) {
      logger.debug('📦 Mensaje duplicado encontrado:', {
        predictionId: data.id,
        waMessageId: waMessageId.substring(0, 20) + '...'
      });
    }

    return data || null;
  } catch (error) {
    logger.error('❌ Excepción en checkDuplicateWhatsAppMessage:', error);
    return null;
  }
}

/**
 * Inserta predicción con deduplicación WhatsApp
 * @param payload - datos de predicción (incluir wa_message_id)
 * @returns Objeto con cached (boolean) y data (predicción)
 */
export async function insertPredictionWithDedup(payload: {
  usuario_id: string;
  country_code: string;
  transcripcion: string;
  resultado: Record<string, any>;
  wa_message_id?: string;
  mensaje_origen?: string;
  original_timestamp?: string;
  parent_message_id?: string;
}) {
  const supabase = getSupabaseAdmin();

  // 1. Si tiene wa_message_id, verificar si ya existe
  if (payload.wa_message_id) {
    const existing = await checkDuplicateWhatsAppMessage(payload.wa_message_id);
    if (existing) {
      logger.debug('📦 Mensaje duplicado en caché, devolviendo respuesta previa');
      return {
        cached: true,
        data: existing
      } as const;
    }
  }

  // 2. Insertar nueva predicción
  // Poblar categoria_detectada desde resultado.categoria
  const categoria = (payload.resultado as any)?.categoria || 'desconocida';
  
  const { data, error } = await supabase
    .from('predicciones_groq')
    .insert({
      usuario_id: payload.usuario_id,
      country_code: payload.country_code,
      transcripcion: payload.transcripcion,
      resultado: payload.resultado,
      wa_message_id: payload.wa_message_id || null,
      mensaje_origen: payload.mensaje_origen || 'whatsapp',
      categoria_detectada: categoria,
      original_timestamp: payload.original_timestamp || new Date().toISOString(),
      parent_message_id: payload.parent_message_id || null
    })
    .select()
    .single();

  if (error) {
    logger.error('❌ Error insertando predicción:', {
      error,
      usuario_id: payload.usuario_id,
      wa_message_id: payload.wa_message_id?.substring(0, 20) + '...'
    });
    throw error;
  }

  logger.debug('✅ Predicción insertada correctamente:', {
    predictionId: data?.id,
    wa_message_id: payload.wa_message_id?.substring(0, 20) + '...'
  });

  return {
    cached: false,
    data
  } as const;
}

