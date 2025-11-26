import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { parseConfirmation } from '@/lib/parseConfirmation';
import { calculateWeightedAccuracy } from '@/lib/calculateWeightedAccuracy';
import { handleError, handleNotFoundError } from '@/lib/errorHandler';
import { logger } from '@/lib/logger';
import { getTodayForCountry, validateTransactionDate, buildISODateForCountry, getTimezoneForCountry, extractDateInUserTimezone } from '@/lib/dateUtils';

/**
 * Procesa confirmaciones de WhatsApp (sí/ok/perfecto/está bien)
 * Actualiza predicciones_groq.confirmado = true
 * Crea transacciones y recalcula accuracy
 * 
 * Basado en el sistema Baileys original
 */
export interface ConfirmRequest {
  prediction_id?: string;
  phone_number: string;
  message: string;
}

export interface ConfirmResponse {
  success: boolean;
  message?: string;
  confirmado?: boolean;
  auto_enabled?: boolean;
  accuracy?: number;
  error?: string;
  suggestion?: string;
}

/**
 * Función reutilizable para procesar confirmaciones
 * Puede ser llamada directamente desde otros endpoints
 */
export async function processConfirmation(
  phone_number: string,
  message: string,
  prediction_id?: string
): Promise<ConfirmResponse> {
  const supabase = getSupabaseAdmin();

  try {

    logger.debug(`📝 Confirmación recibida: "${message}"`);

    // ============================================================
    // OBTENER USUARIO Y PAÍS
    // ============================================================
    // Normalizar número de teléfono (remover @s.whatsapp.net si viene)
    const phoneNumber = phone_number?.replace('@s.whatsapp.net', '') || phone_number;
    
    // Intentar buscar con ambos formatos (con y sin +)
    const phoneWithPlus = phoneNumber?.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
    const phoneWithoutPlus = phoneNumber?.startsWith('+') ? phoneNumber.substring(1) : phoneNumber;
    
    let { data: user } = await supabase
      .from('usuarios')
      .select('id, country_code')
      .eq('telefono', phoneWithPlus)
      .single();

    if (!user) {
      const result = await supabase
        .from('usuarios')
        .select('id, country_code')
        .eq('telefono', phoneWithoutPlus)
        .single();
      
      user = result.data;
    }

    if (!user) {
      return {
        success: false,
        error: 'Usuario no encontrado'
      };
    }

    const usuario_id = user.id;
    const country_code = user.country_code || 'BOL';

    logger.debug(`✅ Usuario: ${usuario_id}, País: ${country_code}`);

    // ============================================================
    // PARSEAR CONFIRMACIÓN
    // ============================================================
    const { type, confidence } = parseConfirmation(message);
    logger.debug(`📊 Tipo: ${type}, Confianza: ${confidence}`);

    // Si no es confirmación positiva, rechazar
    if (type !== 'confirm') {
      logger.warn('⚠️ No es confirmación positiva');
      return {
        success: false,
        error: 'Respuesta no entendida',
        suggestion: 'Responde: sí, ok, perfecto, está bien'
      };
    }

    // ============================================================
    // OBTENER PREDICCIÓN (usar prediction_id si viene, sino la más reciente)
    // ============================================================
    let prediction_id_to_use = prediction_id;
    let parent_message_id: string | null = null;
    
    // Si no viene prediction_id, obtener la transacción pendiente más reciente
    if (!prediction_id_to_use) {
      logger.debug('🔍 No hay prediction_id, buscando transacción pendiente más reciente...');
      
      // REGLA IMPORTANTE: Si hay una transacción confirmada más reciente,
      // las transacciones pendientes anteriores están "bloqueadas" y solo se confirman por timeout
      // Esto evita conflictos cuando el usuario confirma una transacción posterior
      // y luego intenta confirmar transacciones anteriores con otro "sí"
      const { data: mostRecentConfirmed } = await supabase
        .from('pending_confirmations')
        .select('created_at')
        .eq('usuario_id', usuario_id)
        .eq('confirmed', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      let minCreatedAt: string | null = null;
      if (mostRecentConfirmed) {
        minCreatedAt = mostRecentConfirmed.created_at;
        logger.debug(`🔒 Hay confirmación más reciente en ${minCreatedAt}. Solo se pueden confirmar transacciones posteriores.`);
      }
      
      // Buscar la transacción pendiente más reciente
      // Si hay una confirmada más reciente, solo buscar pendientes posteriores a esa fecha
      let query = supabase
        .from('pending_confirmations')
        .select('prediction_id, parent_message_id, created_at')
        .eq('usuario_id', usuario_id)
        .is('confirmed', null)
        .order('created_at', { ascending: false })
        .limit(1);
      
      // Si hay una confirmación más reciente, solo buscar pendientes posteriores
      if (minCreatedAt) {
        query = query.gt('created_at', minCreatedAt);
      }
      
      const { data: pendingConf } = await query.single();

      if (!pendingConf) {
        if (minCreatedAt) {
          logger.debug('⚠️ Hay transacciones pendientes, pero están bloqueadas (hay confirmación más reciente)');
          return {
            success: false,
            error: 'No hay transacciones pendientes de confirmar manualmente. Las transacciones anteriores se guardarán automáticamente después del tiempo de espera.',
            suggestion: 'Las transacciones anteriores solo se pueden confirmar automáticamente después del tiempo de espera (30 minutos).'
          };
        } else {
          return {
            success: false,
            error: 'No hay transacciones pendientes de confirmar'
          };
        }
      }

      prediction_id_to_use = pendingConf.prediction_id;
      parent_message_id = pendingConf.parent_message_id;
      logger.debug(`✅ Transacción pendiente encontrada: ${pendingConf.prediction_id} (created_at: ${pendingConf.created_at})`);
      
      if (parent_message_id) {
        logger.debug(`✅ Parent message ID detectado: ${parent_message_id} (múltiples TX)`);
      }
    }

    const { data: prediction } = await supabase
      .from('predicciones_groq')
      .select('resultado, original_timestamp, id')
      .eq('id', prediction_id_to_use)
      .single();

    if (!prediction) {
      return {
        success: false,
        error: 'Predicción no encontrada'
      };
    }

    // ============================================================
    // CONFIRMAR (SIMPLE o MÚLTIPLE)
    // ============================================================
    let predictionsToConfirm: any[] = [];
    
    if (parent_message_id) {
      // MODO MÚLTIPLE: Confirmar todas las predicciones del mismo parent_message_id
      logger.debug(`📦 MODO MÚLTIPLE: Confirmando grupo ${parent_message_id}`);
      
      const { data: allGroupPendings } = await supabase
        .from('pending_confirmations')
        .select('prediction_id')
        .eq('usuario_id', usuario_id)
        .eq('parent_message_id', parent_message_id)
        .is('confirmed', null);
      
      if (!allGroupPendings || allGroupPendings.length === 0) {
        return {
          success: false,
          error: 'No se encontraron transacciones del grupo para confirmar'
        };
      }
      
      // Obtener todas las predicciones del grupo
      const predictionIds = allGroupPendings.map(p => p.prediction_id);
      const { data: groupPredictions } = await supabase
        .from('predicciones_groq')
        .select('*')
        .in('id', predictionIds);
      
      predictionsToConfirm = groupPredictions || [];
      logger.debug(`✅ Grupo detectado: ${predictionsToConfirm.length} transacciones`);
    } else {
      // MODO SIMPLE: Confirmar solo una
      logger.debug('📝 MODO SIMPLE: Confirmando 1 transacción');
      predictionsToConfirm = [prediction];
    }
    
    // Procesar cada predicción
    for (const pred of predictionsToConfirm) {
      // Actualizar predicción
      await supabase
        .from('predicciones_groq')
        .update({
          confirmado: true,
          confirmado_por: 'whatsapp_reaction',
          updated_at: new Date().toISOString()
        })
        .eq('id', pred.id);
      
      logger.debug(`✅ Predicción ${pred.id} actualizada (MANUAL)`);
      
      // Guardar feedback
      await supabase
        .from('feedback_usuarios')
        .insert({
          prediction_id: pred.id,
          usuario_id,
          era_correcto: true,
          country_code,
          origen: 'whatsapp_reaction',
          confiabilidad: 1.0
        });
      
      // Crear transacción
      if (pred?.resultado) {
        // Helper: Convertir código de país de 3 letras a 2 letras
        const countryCode3To2: Record<string, string> = {
          'BOL': 'BO', 'ARG': 'AR', 'BRA': 'BR', 'CHL': 'CL', 'COL': 'CO',
          'ECU': 'EC', 'PER': 'PE', 'PRY': 'PY', 'URY': 'UY', 'VEN': 'VE',
          'MEX': 'MX', 'USA': 'US', 'ESP': 'ES', 'GBR': 'UK'
        };
        const userCountryCode = countryCode3To2[country_code || 'BOL'] || 'BO';
        
        // Extraer fecha del timestamp original (YYYY-MM-DD)
        let transactionDate: string;
        if (pred.original_timestamp) {
          // Si es un timestamp ISO, extraer solo la fecha
          const dateFromTimestamp = new Date(pred.original_timestamp);
          if (!isNaN(dateFromTimestamp.getTime())) {
            transactionDate = extractDateInUserTimezone(pred.original_timestamp, userCountryCode);
          } else {
            // Si no es válido, usar fecha de hoy
            transactionDate = getTodayForCountry(userCountryCode);
          }
        } else {
          // Si no hay timestamp, usar fecha de hoy
          transactionDate = getTodayForCountry(userCountryCode);
        }
        
        // Validar fecha (solo ayer o hoy)
        const validation = validateTransactionDate(transactionDate, userCountryCode);
        if (!validation.valid) {
          logger.warn(`⚠️ Fecha no válida para transacción ${pred.id}: ${transactionDate} - ${validation.message}`);
          // Si la fecha no es válida, usar fecha de hoy
          transactionDate = getTodayForCountry(userCountryCode);
          logger.debug(`📅 Usando fecha de hoy como fallback: ${transactionDate}`);
        }
        
        // Construir fecha ISO con hora actual
        const now = new Date();
        const [year, month, day] = transactionDate.split('-').map(Number);
        const timeZone = getTimezoneForCountry(userCountryCode);
        const formatter = new Intl.DateTimeFormat('en-US', {
          timeZone,
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        });
        const timeParts = formatter.formatToParts(now);
        const hour = parseInt(timeParts.find(p => p.type === 'hour')?.value || '0', 10);
        const minute = parseInt(timeParts.find(p => p.type === 'minute')?.value || '0', 10);
        const second = parseInt(timeParts.find(p => p.type === 'second')?.value || '0', 10);
        const dateISO = buildISODateForCountry(year, month, day, hour, minute, second, userCountryCode);
        
        await supabase
          .from('transacciones')
          .insert({
            usuario_id,
            tipo: pred.resultado?.tipo || 'gasto',
            monto: pred.resultado?.monto,
            categoria: pred.resultado?.categoria,
            descripcion: pred.resultado?.descripcion,
            fecha: dateISO,
            metodo_pago: pred.resultado?.metodoPago,
            moneda: pred.resultado?.moneda || 'BOB'
          });
        
        logger.debug(`✅ Transacción ${pred.id} creada con fecha validada: ${transactionDate}`);
      }
      
      // Marcar confirmación
      await supabase
        .from('pending_confirmations')
        .update({
          confirmed: true,
          confirmed_at: new Date().toISOString()
        })
        .eq('prediction_id', pred.id);
      
      logger.debug(`✅ Confirmación pendiente ${pred.id} marcada`);
    }
    
    logger.info(`✅ Total confirmadas: ${predictionsToConfirm.length}`);

    // ============================================================
    // RECALCULAR ACCURACY PONDERADA
    // ============================================================
    const { accuracy, verified_count } = await calculateWeightedAccuracy(supabase, country_code);

    await supabase
      .from('feedback_confirmation_config')
      .update({
        total_transactions: verified_count,
        accuracy: accuracy,
        updated_at: new Date().toISOString()
      })
      .eq('country_code', country_code);

    logger.info(`✅ Accuracy actualizada: ${accuracy}%`);

    // ============================================================
    // ¿CAMBIAR A AUTOMÁTICO?
    // ============================================================
    if (accuracy >= 90 && verified_count >= 1000) {
      logger.info(`🚀 ALERTA: ${country_code} alcanzó umbrales para AUTO`);
      
      await supabase
        .from('feedback_confirmation_config')
        .update({
          require_confirmation: false,
          is_auto_enabled: true,
          updated_at: new Date().toISOString()
        })
        .eq('country_code', country_code);

      logger.info(`🚀 ${country_code} CAMBIADO A AUTOMÁTICO`);
      return {
        success: true,
        message: predictionsToConfirm.length > 1 
          ? `✅ Perfecto. ${predictionsToConfirm.length} transacciones guardadas.` 
          : '✅ Perfecto. Transacción guardada.',
        confirmado: true,
        auto_enabled: true,
        accuracy: accuracy
      };
    }

    return {
      success: true,
      message: predictionsToConfirm.length > 1 
        ? `✅ Perfecto. ${predictionsToConfirm.length} transacciones guardadas.` 
        : '✅ Perfecto. Transacción guardada.',
      confirmado: true,
      accuracy: accuracy
    };

  } catch (error: any) {
    logger.error('❌ Error en confirmación:', {
      errorMessage: error?.message || 'Unknown error',
      errorStack: error?.stack || 'No stack trace',
      errorName: error?.name || 'Unknown',
      errorType: typeof error,
      errorString: String(error),
      error: error
    });
    throw error;
  }
}

/**
 * Endpoint HTTP para procesar confirmaciones
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prediction_id, phone_number, message } = body;

    const result = await processConfirmation(phone_number, message, prediction_id);
    
    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }
    
    return NextResponse.json(result);
  } catch (error: any) {
    logger.error('❌ Error en endpoint de confirmación:', error);
    return handleError(error, 'Error al procesar confirmación de WhatsApp');
  }
}


