import { NextRequest, NextResponse } from 'next/server';
import { groqWhisperService } from '@/services/groqWhisperService';
import { groqService } from '@/services/groqService';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { logger, webhookLogger } from '@/lib/logger';
import { webhookRateLimit, getClientIdentifier, checkRateLimit } from '@/lib/rateLimit';
import { handleError, handleNotFoundError, ErrorType } from '@/lib/errorHandler';

/**
 * GET: Verificación de webhook por Meta
 * Meta envía un GET request para verificar el webhook durante la configuración
 */
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;

  // Log completo para debugging (usar info para que se vea en producción)
  logger.info('🔍 Webhook verification request:', {
    url: req.url,
    mode,
    hasToken: !!token,
    tokenLength: token?.length || 0,
    hasChallenge: !!challenge,
    challengeLength: challenge?.length || 0,
    hasVerifyToken: !!verifyToken,
    verifyTokenLength: verifyToken?.length || 0,
    allParams: Object.fromEntries(searchParams.entries())
  });

  // Verificar que es una solicitud de suscripción
  if (mode === 'subscribe' && token === verifyToken) {
    logger.info('✅ Webhook verified successfully');
    return new NextResponse(challenge, { status: 200 });
  }

  logger.warn('❌ Webhook verification failed:', {
    mode,
    expectedMode: 'subscribe',
    tokenMatch: token === verifyToken,
    tokenProvided: !!token,
    verifyTokenConfigured: !!verifyToken
  });

  return new NextResponse('Forbidden', { status: 403 });
}

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
      logger.info('⚠️ Webhook recibido pero object no es whatsapp_business_account:', body.object);
      return NextResponse.json({ status: 'ignored' });
    }

    const message = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    
    if (!message) {
      logger.info('⚠️ Webhook recibido pero no hay mensaje en el payload');
      return NextResponse.json({ status: 'no_message' });
    }

    // Log del tipo de mensaje recibido
    logger.info(`📨 Mensaje recibido de WhatsApp Cloud API - Tipo: ${message.type}, From: ${message.from?.substring(0, 5)}...`);

    // Solo procesar audios
    if (message.type !== 'audio') {
      logger.info(`ℹ️ Mensaje de tipo '${message.type}' recibido pero no procesado (solo se procesan audios)`);
      return NextResponse.json({ status: 'not_audio', message_type: message.type });
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
      
      const transactionsToInsert = expenseData.transacciones.map((t: any) => ({
        usuario_id: user.id,
        tipo: t.tipo || 'gasto',
        monto: t.monto || 0,
        categoria: t.categoria || 'otros',
        descripcion: t.descripcion || transcription,
        fecha: t.fecha || new Date().toISOString(),
      }));

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
      const { data: transaction, error: transactionError } = await supabase
        .from('transacciones')
        .insert({
          usuario_id: user.id,
          tipo: expenseData.tipo || 'gasto',
          monto: expenseData.monto || 0,
          categoria: expenseData.categoria || 'otros',
          descripcion: expenseData.descripcion || transcription,
          fecha: new Date().toISOString(),
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

