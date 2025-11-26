import { NextRequest, NextResponse } from 'next/server';
import { groqWhisperService } from '@/services/groqWhisperService';
import { groqService } from '@/services/groqService';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { logger, webhookLogger } from '@/lib/logger';
import { webhookRateLimit, getClientIdentifier, checkRateLimit } from '@/lib/rateLimit';
import { handleError, handleNotFoundError, ErrorType } from '@/lib/errorHandler';
import { getTodayForCountry, validateTransactionDate, buildISODateForCountry, getTimezoneForCountry } from '@/lib/dateUtils';

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const supabase = getSupabaseAdmin(); // Valida y crea cliente aquí

  try {
    // Rate limiting: verificar límites antes de procesar
    const identifier = getClientIdentifier(req);
    const rateLimitResult = await checkRateLimit(webhookRateLimit, identifier);
    
    if (!rateLimitResult || !rateLimitResult.success) {
      logger.warn(`⛔ Rate limit exceeded for webhook from ${identifier}`);
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        {
          status: 429,
          headers: {
            'Retry-After': rateLimitResult ? Math.ceil((rateLimitResult.reset - Date.now()) / 1000).toString() : '900',
          },
        }
      );
    }

    const body = await req.json();

    webhookLogger.received(body);

    // Validar que es webhook de Meta
    if (body.object !== 'whatsapp_business_account') {
      logger.debug('Not a WhatsApp webhook');
      return NextResponse.json({ status: 'ignored' });
    }

    const message = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    
    if (!message) {
      logger.debug('No message in webhook');
      return NextResponse.json({ status: 'no_message' });
    }

    // Solo procesar audios
    if (message.type !== 'audio') {
      logger.debug('Message is not audio');
      return NextResponse.json({ status: 'not_audio' });
    }

    const { from: phoneNumber, audio } = message;

    // No loguear número de teléfono completo por seguridad
    logger.debug('📱 WhatsApp audio received from user');
    logger.debug('Audio info:', { id: audio?.id, mime_type: audio?.mime_type, duration: audio?.duration });

    // 1. Buscar usuario por teléfono en tabla usuarios
    const { data: user, error: userError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('telefono', phoneNumber)
      .single();

    if (userError || !user) {
      // No exponer número de teléfono en logs
      logger.error('❌ User not found for WhatsApp audio');
      return handleNotFoundError('Usuario');
    }

    logger.debug('User found:', user.id);

    // 1.5. Validar duración del audio (máximo 15 segundos para todos los planes)
    const audioDurationSeconds = audio.duration || null;
    if (audioDurationSeconds !== null && audioDurationSeconds > 15) {
      logger.error(`Audio too long: ${audioDurationSeconds}s (max 15s)`);
      return NextResponse.json(
        { 
          error: 'AUDIO_DURATION_EXCEEDED',
          message: `El audio no puede exceder 15 segundos. Duración recibida: ${audioDurationSeconds} segundos. Por favor, envía un audio más corto.`,
          duration: audioDurationSeconds,
          maxDuration: 15
        },
        { status: 400 }
      );
    }

    // 2. Descargar audio de Meta
    const audioUrl = `https://graph.facebook.com/v18.0/${audio.id}`;
    
    const audioResponse = await fetch(audioUrl, {
      headers: {
        Authorization: `Bearer ${process.env.META_WHATSAPP_TOKEN}`,
      },
    });

    if (!audioResponse.ok) {
      throw new Error('Failed to download audio from Meta');
    }

    const audioBlob = await audioResponse.blob();
    logger.debug('Audio downloaded:', audioBlob.size, 'bytes');

    // 3. Convertir blob a File
    const audioFile = new File([audioBlob], 'audio.wav', { type: 'audio/wav' });

    // 4. Transcribir con Groq Whisper
    const transcription = await groqWhisperService.transcribe(audioFile, 'es');
    logger.debug('Transcription:', transcription);

    // 5. Extraer datos con Groq LLM con contexto por país
    const expenseData = await groqService.extractExpenseWithCountryContext(
      transcription,
      user.country_code || 'BOL'
    );
    logger.debug('Expense extracted:', expenseData);
    
    // Helper: Convertir código de país de 3 letras a 2 letras
    const countryCode3To2: Record<string, string> = {
      'BOL': 'BO', 'ARG': 'AR', 'BRA': 'BR', 'CHL': 'CL', 'COL': 'CO',
      'ECU': 'EC', 'PER': 'PE', 'PRY': 'PY', 'URY': 'UY', 'VEN': 'VE',
      'MEX': 'MX', 'USA': 'US', 'ESP': 'ES', 'GBR': 'UK'
    };
    const userCountryCode = countryCode3To2[user.country_code || 'BOL'] || 'BO';

    // 6. Guardar predicción en predicciones_groq
    const { data: prediction } = await supabase
      .from('predicciones_groq')
      .insert({
        usuario_id: user.id,
        country_code: user.country_code || 'BOL',
        transcripcion: transcription,
        resultado: expenseData,
      })
      .select()
      .single();

    logger.debug('Prediction saved:', prediction?.id);

    // 7. Crear transacción(es) en tabla transacciones
    let transactions;
    
    // Si hay múltiples transacciones, guardar todas
    if (expenseData.esMultiple && expenseData.transacciones && expenseData.transacciones.length > 0) {
      logger.debug(`Guardando ${expenseData.transacciones.length} transacciones múltiples`);
      
      const transactionsToInsert = expenseData.transacciones.map((t: any) => {
        // Obtener fecha: usar la de Groq o fecha de hoy
        const transactionDate = t.fecha || getTodayForCountry(userCountryCode);
        
        // Validar fecha (solo ayer o hoy)
        const validation = validateTransactionDate(transactionDate, userCountryCode);
        if (!validation.valid) {
          logger.warn(`⚠️ Fecha no válida para transacción: ${transactionDate} - ${validation.message}`);
          // Si la fecha no es válida, usar fecha de hoy
          const todayDate = getTodayForCountry(userCountryCode);
          logger.debug(`📅 Usando fecha de hoy como fallback: ${todayDate}`);
          
          // Construir fecha ISO con hora actual
          const now = new Date();
          const [year, month, day] = todayDate.split('-').map(Number);
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
          
          return {
            usuario_id: user.id,
            tipo: t.tipo || 'gasto',
            monto: t.monto || 0,
            categoria: t.categoria || 'otros',
            descripcion: t.descripcion || transcription,
            fecha: dateISO,
          };
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
        
        return {
          usuario_id: user.id,
          tipo: t.tipo || 'gasto',
          monto: t.monto || 0,
          categoria: t.categoria || 'otros',
          descripcion: t.descripcion || transcription,
          fecha: dateISO,
        };
      });

      const { data: insertedTransactions, error: insertError } = await supabase
        .from('transacciones')
        .insert(transactionsToInsert)
        .select();

      if (insertError) {
        logger.error('Error creando transacciones múltiples:', insertError);
        throw insertError;
      }

      transactions = insertedTransactions;
      logger.debug(`${transactions.length} transacciones creadas`);
    } else {
      // Comportamiento original: una sola transacción
      // Obtener fecha: usar la de Groq o fecha de hoy
      const transactionDate = expenseData.fecha || getTodayForCountry(userCountryCode);
      
      // Validar fecha (solo ayer o hoy)
      const validation = validateTransactionDate(transactionDate, userCountryCode);
      let finalDate = transactionDate;
      if (!validation.valid) {
        logger.warn(`⚠️ Fecha no válida: ${transactionDate} - ${validation.message}`);
        // Si la fecha no es válida, usar fecha de hoy
        finalDate = getTodayForCountry(userCountryCode);
        logger.debug(`📅 Usando fecha de hoy como fallback: ${finalDate}`);
      }
      
      // Construir fecha ISO con hora actual
      const now = new Date();
      const [year, month, day] = finalDate.split('-').map(Number);
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
      
      const { data: transaction, error: transactionError } = await supabase
        .from('transacciones')
        .insert({
          usuario_id: user.id,
          tipo: expenseData.tipo || 'gasto',
          monto: expenseData.monto || 0,
          categoria: expenseData.categoria || 'otros',
          descripcion: expenseData.descripcion || transcription,
          fecha: dateISO,
        })
        .select()
        .single();

      if (transactionError) {
        logger.error('Error creando transacción:', transactionError);
        throw transactionError;
      }

      transactions = [transaction];
      logger.debug('Transaction created:', transaction?.id);
    }

    return NextResponse.json({
      success: true,
      transaction_id: transactions[0]?.id,
      transaction_ids: transactions.map((t: any) => t.id),
      transactions_count: transactions.length,
      transcription,
      expense_data: expenseData,
      processing_time_ms: Date.now() - startTime,
    });

  } catch (error: any) {
    // Usar error handler seguro
    return handleError(error, 'Error al procesar el webhook de WhatsApp');
  }
}

// GET para verificación de webhook Meta
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  logger.debug('Verifying webhook:', { mode, token: token ? '***' : null, challenge });

  if (mode === 'subscribe' && token === process.env.WEBHOOK_VERIFY_TOKEN) {
    logger.debug('Webhook verified');
    return new NextResponse(challenge);
  }

  logger.warn('Webhook verification failed');
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}


