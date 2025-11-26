import { NextRequest, NextResponse } from 'next/server';
import { groqService } from '@/services/groqService';
import { groqWhisperService } from '@/services/groqWhisperService';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { getAuthenticatedUserId } from '@/lib/authHelpers';
import { getPlanLimits } from '@/lib/planLimits';
import { processAudioSchema, validateWithZod } from '@/lib/validations';
import { requireCSRF } from '@/lib/csrf';
import { audioRateLimit, getClientIdentifier, checkRateLimit } from '@/lib/rateLimit';
import { handleError, handleValidationError, ErrorType } from '@/lib/errorHandler';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  const supabase = getSupabaseAdmin();

  try {
    // 1. Rate limiting
    const identifier = getClientIdentifier(request);
    const rateLimitResult = await checkRateLimit(audioRateLimit, identifier);
    if (!rateLimitResult?.success) {
      logger.warn(`⛔ Rate limit exceeded for audio processing from ${identifier}`);
      return NextResponse.json(
        { 
          status: 'error', 
          message: 'Demasiadas solicitudes. Por favor, intenta más tarde.',
          errorCode: 'RATE_LIMIT_EXCEEDED'
        },
        { 
          status: 429,
          headers: {
            'Retry-After': rateLimitResult ? Math.ceil((rateLimitResult.reset - Date.now()) / 1000).toString() : '3600',
          },
        }
      );
    }

    // 2. Leer formData
    const formData = await request.formData();
    const csrfToken = formData.get('csrfToken') as string;
    const audioFile = formData.get('audio') as File;
    const userId = formData.get('user_id') as string;
    const transcription = formData.get('transcription') as string;
    const audioDurationSecondsStr = formData.get('audioDurationSeconds') as string | null;

    // 3. Validar CSRF token
    const csrfError = await requireCSRF(request, csrfToken);
    if (csrfError) {
      return csrfError;
    }

    // 4. Validar con Zod
    const validation = validateWithZod(processAudioSchema, {
      user_id: userId,
      transcription: transcription || undefined,
      audioDurationSeconds: audioDurationSecondsStr ? parseFloat(audioDurationSecondsStr) : undefined,
    });

    if (!validation.success) {
      return handleValidationError(validation.error, validation.details);
    }

    // 5. Validar que el usuario está autenticado y coincide con el user_id
    const authenticatedUserId = await getAuthenticatedUserId(request);
    if (!authenticatedUserId) {
      return handleError(
        new Error('Usuario no autenticado'),
        'Usuario no autenticado. Por favor, inicia sesión nuevamente.',
        ErrorType.AUTHENTICATION
      );
    }

    if (authenticatedUserId !== validation.data.user_id) {
      return handleError(
        new Error('User ID mismatch'),
        'No tienes permisos para procesar este audio',
        ErrorType.AUTHORIZATION
      );
    }

    // 6. Obtener usuario y plan para validaciones
    const { data: usuario, error: userError } = await supabase
      .from('usuarios')
      .select('country_code, suscripcion')
      .eq('id', validation.data.user_id)
      .single();

    if (userError || !usuario) {
      return handleError(
        userError || new Error('Usuario no encontrado'),
        'Usuario no encontrado',
        ErrorType.NOT_FOUND
      );
    }

    // 7. Validar duración de audio si se proporciona (15 segundos máximo)
    if (validation.data.audioDurationSeconds && audioFile) {
      const audioDurationSeconds = validation.data.audioDurationSeconds;
      if (!isNaN(audioDurationSeconds)) {
        const currentPlan = (usuario.suscripcion || 'free') as 'free' | 'smart' | 'pro' | 'caducado';
        const limits = getPlanLimits(currentPlan);
        
        if (limits.maxAudioDurationSeconds !== null && audioDurationSeconds > limits.maxAudioDurationSeconds) {
          return handleError(
            new Error('Audio duration exceeded'),
            `El audio no puede exceder ${limits.maxAudioDurationSeconds} segundos. Por favor, envía un audio más corto. (Duración: ${audioDurationSeconds}s)`,
            ErrorType.VALIDATION
          );
        }
      }
    }

    // 8. Validar longitud de transcripción si se proporciona (100 caracteres máximo)
    if (validation.data.transcription) {
      const currentPlan = (usuario.suscripcion || 'free') as 'free' | 'smart' | 'pro' | 'caducado';
      const limits = getPlanLimits(currentPlan);
      
      if (validation.data.transcription.length > limits.maxTextLength) {
        return handleError(
          new Error('Text length exceeded'),
          `El texto no puede exceder ${limits.maxTextLength} caracteres. Por favor, envía un mensaje más corto. (${validation.data.transcription.length}/${limits.maxTextLength} caracteres)`,
          ErrorType.VALIDATION
        );
      }
    }

    // 9. Si no hay transcripción, obtenerla de Groq Whisper
    let finalTranscription = validation.data.transcription;
    
    if (!finalTranscription && audioFile) {
      logger.debug('🎤 Transcribiendo audio con Groq Whisper...');
      
      finalTranscription = await groqWhisperService.transcribe(audioFile, 'es');
      logger.debug('✅ Transcripción:', finalTranscription);
    }
    
    // 9.5. Validar que la transcripción tenga contexto de transacción (números o palabras clave)
    if (finalTranscription) {
      const trimmedTranscription = finalTranscription.trim();
      
      // Validar longitud mínima
      if (trimmedTranscription.length < 3) {
        return handleError(
          new Error('Transcription too short'),
          'La transcripción es muy corta. Por favor, intenta nuevamente hablando más claro.',
          ErrorType.VALIDATION
        );
      }
      
      // Validar contenido real (no solo signos de puntuación)
      const textWithoutPunctuation = trimmedTranscription.replace(/[.,;:!?¿¡\s\-_()\[\]{}'"]/g, '');
      const hasLettersOrNumbers = /[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]/.test(textWithoutPunctuation);
      
      if (!hasLettersOrNumbers || textWithoutPunctuation.length < 2) {
        return handleError(
          new Error('Transcription no content'),
          'No se pudo entender el audio. Por favor, intenta nuevamente hablando más claro.',
          ErrorType.VALIDATION
        );
      }
      
      // Palabras clave relacionadas con transacciones (más específicas)
      const transactionKeywords = [
        'gast', 'compr', 'pagu', 'pague', 'recib', 'cobr', 'vend', 'gan', 'gane',
        'debo', 'deuda', 'prest', 'ahorr', 'invers', 'transacc', 'monto', 'cantidad',
        'dinero', 'peso', 'dolar', 'euro', 'boliviano', 'sol', 'bs', 's/', '$',
        'taxi', 'comida', 'ropa', 'transporte', 'farmacia', 'supermercado', 'mercado',
        'restaurante', 'café', 'gasolina', 'combustible', 'servicio', 'factura'
      ];
      
      // Frases comunes que NO son transacciones (saludos, agradecimientos, etc.)
      const nonTransactionPhrases = [
        'gracias', 'hola', 'adiós', 'hasta luego', 'buenos días', 'buenas tardes', 'buenas noches',
        'por ver', 'por escuchar', 'por leer', 'saludos', 'que tengas', 'que pases',
        'video', 'audio', 'mensaje', 'llamada', 'texto'
      ];
      
      // Verificar si tiene números (montos)
      const hasNumbers = /\d/.test(trimmedTranscription);
      
      // Verificar si tiene palabras clave de transacciones
      const lowerTranscription = trimmedTranscription.toLowerCase();
      const hasKeywords = transactionKeywords.some(keyword => lowerTranscription.includes(keyword));
      
      // Verificar si es claramente una frase NO relacionada con transacciones
      const isNonTransaction = nonTransactionPhrases.some(phrase => lowerTranscription.includes(phrase));
      
      // Si es claramente un saludo/agradecimiento sin números ni palabras clave de transacciones, rechazar
      if (isNonTransaction && !hasNumbers && !hasKeywords) {
        logger.warn('⚠️ Transcripción es saludo/agradecimiento sin contexto de transacción:', trimmedTranscription);
        return handleError(
          new Error('Transcription no transaction context'),
          'No se pudo identificar una transacción en tu mensaje. Por favor, intenta nuevamente mencionando un monto o una acción (ej: "gasté 50 en taxi").',
          ErrorType.VALIDATION
        );
      }
      
      // Si no tiene números NI palabras clave, probablemente no es una transacción
      if (!hasNumbers && !hasKeywords) {
        logger.warn('⚠️ Transcripción sin contexto de transacción (sin números ni palabras clave):', trimmedTranscription);
        return handleError(
          new Error('Transcription no transaction context'),
          'No se pudo identificar una transacción en tu mensaje. Por favor, intenta nuevamente mencionando un monto o una acción (ej: "gasté 50 en taxi").',
          ErrorType.VALIDATION
        );
      }
    }

    // 10. Convertir country_code (BOL, ARG, etc) a código de 2 letras (BO, AR, etc)
    const countryCode2 = usuario.country_code || 'BOL';
    const countryCodeMap: Record<string, string> = {
      'BOL': 'BO',
      'ARG': 'AR',
      'MEX': 'MX',
      'PER': 'PE',
      'COL': 'CO',
      'CHL': 'CL'
    };
    const userCountryCode = countryCodeMap[countryCode2] || 'BO';

    // 11. Procesar con Groq usando contexto por país
    const resultado = await groqService.extractExpenseWithCountryContext(
      finalTranscription,
      countryCode2
    );

    // 12. Guardar predicción en predicciones_groq
    if (resultado) {
      await supabase
        .from('predicciones_groq')
        .insert({
          usuario_id: validation.data.user_id,
          country_code: countryCode2,
          transcripcion: finalTranscription,
          resultado: resultado,
          confirmado: null
        });
    }

    return NextResponse.json({
      status: 'success',
      transcripcion: finalTranscription,
      resultado,
      country_code: countryCode2
    });

  } catch (error: any) {
    return handleError(error, 'Error al procesar audio');
  }
}

