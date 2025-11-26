import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { logger } from '@/lib/logger';

/**
 * Endpoint de debug para rastrear una transacción
 * 
 * Permite buscar una transacción por:
 * - wa_message_id (ID del mensaje de WhatsApp)
 * - prediction_id (ID de la predicción)
 * - transaction_id (ID de la transacción final)
 * 
 * Devuelve información completa del flujo:
 * - Cuándo se recibió el mensaje original (timestamp de WhatsApp)
 * - Cuándo se procesó (created_at de predicciones_groq)
 * - Si hay confirmación pendiente
 * - Si se creó la transacción final
 * - Todos los datos relacionados
 */

export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    const searchParams = req.nextUrl.searchParams;
    
    const waMessageId = searchParams.get('wa_message_id');
    const predictionId = searchParams.get('prediction_id');
    const transactionId = searchParams.get('transaction_id');
    
    if (!waMessageId && !predictionId && !transactionId) {
      return NextResponse.json({
        error: 'Se requiere al menos uno de: wa_message_id, prediction_id, o transaction_id'
      }, { status: 400 });
    }
    
    const result: any = {
      search: {
        wa_message_id: waMessageId,
        prediction_id: predictionId,
        transaction_id: transactionId
      },
      found: false,
      data: null
    };
    
    // 1. Buscar en predicciones_groq
    let predictionQuery = supabase
      .from('predicciones_groq')
      .select('*');
    
    if (waMessageId) {
      predictionQuery = predictionQuery.eq('wa_message_id', waMessageId);
    } else if (predictionId) {
      predictionQuery = predictionQuery.eq('id', predictionId);
    } else {
      // Si solo tenemos transaction_id, necesitamos buscar primero la transacción
      const { data: transaction } = await supabase
        .from('transacciones')
        .select('*')
        .eq('id', transactionId!)
        .single();
      
      if (transaction) {
        // Buscar predicción relacionada por usuario y datos similares
        predictionQuery = predictionQuery
          .eq('usuario_id', transaction.usuario_id)
          .eq('resultado->>monto', transaction.monto.toString())
          .eq('resultado->>categoria', transaction.categoria)
          .order('created_at', { ascending: false })
          .limit(1);
      }
    }
    
    const { data: prediction, error: predictionError } = await predictionQuery.single();
    
    if (predictionError && predictionError.code !== 'PGRST116') {
      logger.error('Error buscando predicción:', predictionError);
      return NextResponse.json({
        error: 'Error buscando predicción',
        details: predictionError
      }, { status: 500 });
    }
    
    if (!prediction) {
      return NextResponse.json({
        ...result,
        message: 'No se encontró la predicción'
      });
    }
    
    result.found = true;
    result.data = {
      prediction: {
        id: prediction.id,
        usuario_id: prediction.usuario_id,
        wa_message_id: prediction.wa_message_id,
        mensaje_origen: prediction.mensaje_origen,
        transcripcion: prediction.transcripcion,
        resultado: prediction.resultado,
        confirmado: prediction.confirmado,
        confirmado_por: prediction.confirmado_por,
        created_at: prediction.created_at,
        updated_at: prediction.updated_at,
        original_timestamp: prediction.original_timestamp,
        categoria_detectada: prediction.categoria_detectada
      }
    };
    
    // 2. Convertir timestamp de WhatsApp a fecha legible
    if (prediction.original_timestamp) {
      const timestamp = parseInt(prediction.original_timestamp);
      if (!isNaN(timestamp)) {
        const date = new Date(timestamp * 1000);
        result.data.prediction.original_timestamp_readable = {
          unix: timestamp,
          iso: date.toISOString(),
          local: date.toLocaleString('es-BO', { timeZone: 'America/La_Paz' }),
          utc: date.toUTCString()
        };
      }
    }
    
    // 3. Buscar confirmación pendiente
    const { data: pendingConfirmation } = await supabase
      .from('pending_confirmations')
      .select('*')
      .eq('prediction_id', prediction.id)
      .is('confirmed', null)
      .single();
    
    if (pendingConfirmation) {
      result.data.pending_confirmation = {
        id: pendingConfirmation.id,
        prediction_id: pendingConfirmation.prediction_id,
        expires_at: pendingConfirmation.expires_at,
        created_at: pendingConfirmation.created_at,
        expires_at_readable: new Date(pendingConfirmation.expires_at).toLocaleString('es-BO', { timeZone: 'America/La_Paz' }),
        created_at_readable: new Date(pendingConfirmation.created_at).toLocaleString('es-BO', { timeZone: 'America/La_Paz' })
      };
    }
    
    // 4. Buscar transacción final (si se creó)
    const { data: transaction } = await supabase
      .from('transacciones')
      .select('*')
      .eq('usuario_id', prediction.usuario_id)
      .eq('monto', (prediction.resultado as any)?.monto || (prediction.resultado as any)?.transacciones?.[0]?.monto)
      .eq('categoria', (prediction.resultado as any)?.categoria || (prediction.resultado as any)?.transacciones?.[0]?.categoria)
      .eq('descripcion', (prediction.resultado as any)?.descripcion || (prediction.resultado as any)?.transacciones?.[0]?.descripcion)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (transaction) {
      result.data.transaction = {
        id: transaction.id,
        usuario_id: transaction.usuario_id,
        tipo: transaction.tipo,
        monto: transaction.monto,
        categoria: transaction.categoria,
        descripcion: transaction.descripcion,
        fecha: transaction.fecha,
        created_at: transaction.created_at,
        fecha_readable: transaction.fecha ? new Date(transaction.fecha).toLocaleString('es-BO', { timeZone: 'America/La_Paz' }) : null,
        created_at_readable: new Date(transaction.created_at).toLocaleString('es-BO', { timeZone: 'America/La_Paz' })
      };
    }
    
    // 5. Obtener información del usuario
    const { data: user } = await supabase
      .from('usuarios')
      .select('id, nombre, telefono, correo, suscripcion, country_code')
      .eq('id', prediction.usuario_id)
      .single();
    
    if (user) {
      result.data.user = {
        id: user.id,
        nombre: user.nombre,
        telefono: user.telefono ? user.telefono.substring(0, 5) + '...' : null,
        correo: user.correo,
        suscripcion: user.suscripcion,
        country_code: user.country_code
      };
    }
    
    // 6. Análisis temporal
    if (prediction.original_timestamp && prediction.created_at) {
      const originalTimestamp = parseInt(prediction.original_timestamp) * 1000;
      const processedAt = new Date(prediction.created_at).getTime();
      const delay = processedAt - originalTimestamp;
      
      result.data.timing_analysis = {
        original_message_time: new Date(originalTimestamp).toLocaleString('es-BO', { timeZone: 'America/La_Paz' }),
        processed_at: new Date(processedAt).toLocaleString('es-BO', { timeZone: 'America/La_Paz' }),
        delay_seconds: Math.round(delay / 1000),
        delay_minutes: Math.round(delay / 60000),
        delay_hours: Math.round(delay / 3600000),
        delay_readable: formatDelay(delay)
      };
    }
    
    return NextResponse.json(result);
    
  } catch (error: any) {
    logger.error('Error en trace-transaction:', error);
    return NextResponse.json({
      error: 'Error interno',
      details: error.message
    }, { status: 500 });
  }
}

function formatDelay(ms: number): string {
  const seconds = Math.round(ms / 1000);
  const minutes = Math.round(ms / 60000);
  const hours = Math.round(ms / 3600000);
  const days = Math.round(ms / 86400000);
  
  if (days > 0) return `${days} día(s)`;
  if (hours > 0) return `${hours} hora(s)`;
  if (minutes > 0) return `${minutes} minuto(s)`;
  return `${seconds} segundo(s)`;
}

