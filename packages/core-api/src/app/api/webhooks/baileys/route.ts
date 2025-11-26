import { NextRequest, NextResponse } from 'next/server';
import { groqWhisperService } from '@/services/groqWhisperService';
import { groqService } from '@/services/groqService';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { logger, webhookLogger } from '@/lib/logger';
import { webhookRateLimit, getClientIdentifier, checkRateLimit } from '@/lib/rateLimit';
import { handleError, ErrorType } from '@/lib/errorHandler';
import { getTodayForCountry, validateTransactionDate, buildISODateForCountry, getTimezoneForCountry } from '@/lib/dateUtils';

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const supabase = getSupabaseAdmin(); // Valida y crea cliente aquí

  try {
    // Rate limiting: verificar límites antes de procesar
    const identifier = getClientIdentifier(req);
    const rateLimitResult = await checkRateLimit(webhookRateLimit, identifier);
    
    if (!rateLimitResult || !rateLimitResult.success) {
      logger.warn(`⛔ Rate limit exceeded for Baileys webhook from ${identifier}`);
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

    logger.debug('Webhook Baileys recibido:', {
      from: body.from,
      type: body.type,
      hasAudio: !!body.audioBase64
    });

    // Baileys envía: { audioBase64: string, from: string, type: 'audio', timestamp: number }
    const { audioBase64, from, type, timestamp } = body;

    if (type !== 'audio') {
      logger.debug('Message is not audio');
      return NextResponse.json({ status: 'ignored', message: 'Only audio messages are processed' });
    }

    if (!audioBase64) {
      logger.error('No audio data in message');
      return NextResponse.json({ error: 'No audio data' }, { status: 400 });
    }

    const phoneNumber = from.replace('@s.whatsapp.net', '');
    // No loguear número de teléfono completo por seguridad
    logger.debug('📱 WhatsApp audio received from user');

    // 1. Buscar usuario por teléfono en tabla usuarios
    const { data: user, error: userError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('telefono', phoneNumber)
      .single();

    if (userError || !user) {
      // No exponer número de teléfono en logs
      logger.error('❌ User not found for WhatsApp audio');
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    logger.debug('User found:', user.id);

    // 2. Convertir base64 a Blob
    const audioBuffer = Buffer.from(audioBase64, 'base64');
    const audioBlob = new Blob([audioBuffer], { type: 'audio/ogg; codecs=opus' });
    logger.debug('Audio converted from base64:', audioBlob.size, 'bytes');

    // 3. Convertir blob a File
    const audioFile = new File([audioBlob], 'audio.ogg', { type: 'audio/ogg; codecs=opus' });

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
      amount: expenseData.monto,
      currency: expenseData.moneda || 'BOB',
      category: expenseData.categoria,
      processing_time_ms: Date.now() - startTime,
    });

  } catch (error: any) {
    // Usar error handler seguro
    return handleError(error, 'Error al procesar el webhook de Baileys');
  }
}

