import { NextRequest, NextResponse } from 'next/server';
import { groqWhisperService } from '@/services/groqWhisperService';
import { groqService } from '@/services/groqService';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { logger, webhookLogger } from '@/lib/logger';
import { webhookRateLimit, getClientIdentifier, checkRateLimit } from '@/lib/rateLimit';
import { handleError, handleNotFoundError, ErrorType } from '@/lib/errorHandler';
import { insertPredictionWithDedup, checkDuplicateWhatsAppMessage } from '@/lib/whatsapp-deduplication-endpoint';
import { construirPreviewMultiple, construirPreviewSimple } from '@/lib/construirPreview';
import { sendWhatsAppMessage } from '@/lib/whatsappCloudApi';
import { parseConfirmation } from '@/lib/parseConfirmation';
import { processConfirmation } from '@/app/api/webhooks/whatsapp/confirm/route';
import type { GroqMultipleResponse } from '@/services/groqService';
import { validateCanCreateTransaction, validateTransactionLimitForMultiple, getPlanLimits } from '@/lib/planLimits';
import type { SubscriptionPlan } from '@/lib/planLimits';

/**
 * GET: Verificación de webhook por Meta
 * Meta envía un GET request para verificar el webhook durante la configuración
 * 
 * Logging mejorado para diagnóstico (2025-11-20)
 * Force deploy: 2025-11-20 07:30 - Logging RAW mejorado
 */
export async function GET(req: NextRequest) {
  // Log RAW de la petición completa ANTES de cualquier procesamiento
  const rawUrl = req.url;
  const rawHeaders: Record<string, string> = {};
  req.headers.forEach((value, key) => {
    rawHeaders[key] = value;
  });

  logger.info('🔍 RAW Webhook GET Request:', {
    rawUrl,
    method: req.method,
    headers: rawHeaders,
    urlPathname: req.nextUrl.pathname,
    urlSearch: req.nextUrl.search,
    urlSearchRaw: req.nextUrl.search,
  });

  const searchParams = req.nextUrl.searchParams;
  
  // Intentar leer parámetros de múltiples formas
  let mode = searchParams.get('hub.mode');
  let token = searchParams.get('hub.verify_token');
  let challenge = searchParams.get('hub.challenge');

  // Si no se encontraron parámetros, intentar parsear manualmente desde la URL
  if (!mode && !token && rawUrl) {
    try {
      // Intentar parsear desde la URL completa
      const urlMatch = rawUrl.match(/\?(.+)$/);
      if (urlMatch) {
        const queryString = urlMatch[1];
        const manualParams = new URLSearchParams(queryString);
        mode = manualParams.get('hub.mode') || mode;
        token = manualParams.get('hub.verify_token') || token;
        challenge = manualParams.get('hub.challenge') || challenge;
        
        logger.info('📝 Parámetros parseados manualmente desde URL:', {
          queryString,
          mode,
          hasToken: !!token,
          hasChallenge: !!challenge,
        });
      }
      
      // También intentar desde el objeto URL
      const urlObj = new URL(rawUrl);
      const urlObjParams = new URLSearchParams(urlObj.search);
      if (!mode) mode = urlObjParams.get('hub.mode') || mode;
      if (!token) token = urlObjParams.get('hub.verify_token') || token;
      if (!challenge) challenge = urlObjParams.get('hub.challenge') || challenge;
    } catch (e) {
      logger.warn('⚠️ Error parsing URL manually:', e);
    }
  }

  const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;

  // Log completo para debugging
  const allParams = Object.fromEntries(searchParams.entries());
  logger.info('🔍 Webhook verification request (parsed):', {
    url: req.url,
    urlPathname: req.nextUrl.pathname,
    urlSearch: req.nextUrl.search,
    searchParamsSize: searchParams.size,
    allParams,
    allParamsKeys: Object.keys(allParams),
    mode,
    hasToken: !!token,
    tokenLength: token?.length || 0,
    tokenPreview: token ? `${token.substring(0, 10)}...` : null,
    hasChallenge: !!challenge,
    challengeLength: challenge?.length || 0,
    hasVerifyToken: !!verifyToken,
    verifyTokenLength: verifyToken?.length || 0,
    verifyTokenPreview: verifyToken ? `${verifyToken.substring(0, 10)}...` : null,
    headers: {
      'user-agent': req.headers.get('user-agent'),
      'x-forwarded-for': req.headers.get('x-forwarded-for'),
    }
  });

  // IMPORTANTE: Según reportes de la comunidad, el botón "Probar" en Meta
  // puede enviar peticiones sin parámetros. Solo "Verificar y guardar" envía los parámetros correctos.
  if (!mode && !token && !challenge) {
    logger.warn('⚠️ Solicitud GET sin parámetros. Esto puede ser una petición de prueba de Meta.');
    logger.warn('💡 SOLUCIÓN: Usa "Verificar y guardar" en Meta, NO "Probar"');
    logger.warn('📋 Verifica en Meta Developer Console:');
    logger.warn('   1. URL del webhook: https://ahorro365-core-api.vercel.app/api/webhooks/whatsapp');
    logger.warn('   2. Verify Token debe coincidir con WHATSAPP_WEBHOOK_VERIFY_TOKEN en Vercel');
    logger.warn('   3. Usa el botón "Verificar y guardar" (NO "Probar")');
    return new NextResponse('Missing verification parameters. Use "Verify and Save" button in Meta, not "Test".', { status: 400 });
  }

  // Verificar que es una solicitud de suscripción
  if (mode === 'subscribe' && token === verifyToken) {
    logger.info('✅ Webhook verified successfully', {
      mode,
      tokenMatch: true,
      challengeLength: challenge?.length || 0,
    });
    return new NextResponse(challenge, { status: 200 });
  }

  // Diagnóstico detallado del fallo
  const tokenMatch = token === verifyToken;
  const tokenComparison = {
    receivedToken: token ? `${token.substring(0, 10)}...${token.substring(token.length - 5)}` : null,
    expectedToken: verifyToken ? `${verifyToken.substring(0, 10)}...${verifyToken.substring(verifyToken.length - 5)}` : null,
    receivedLength: token?.length || 0,
    expectedLength: verifyToken?.length || 0,
    exactMatch: tokenMatch,
  };

  logger.warn('❌ Webhook verification failed:', {
    mode,
    expectedMode: 'subscribe',
    modeMatch: mode === 'subscribe',
    tokenMatch,
    tokenProvided: !!token,
    verifyTokenConfigured: !!verifyToken,
    challengeProvided: !!challenge,
    tokenComparison,
  });

  // Mensaje más específico según el problema
  if (!verifyToken) {
    logger.error('❌ WHATSAPP_WEBHOOK_VERIFY_TOKEN no está configurado en Vercel');
    return new NextResponse('Webhook verify token not configured', { status: 500 });
  }

  if (mode !== 'subscribe') {
    logger.warn(`⚠️ Mode incorrecto: "${mode}" (esperado: "subscribe")`);
  }

  if (!tokenMatch && token) {
    logger.warn('⚠️ Token no coincide. Verifica que el token en Meta sea EXACTAMENTE el mismo que en Vercel');
  }

  return new NextResponse('Forbidden', { status: 403 });
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  
  logger.info('📥 POST webhook recibido - Iniciando procesamiento');
  
  const supabase = getSupabaseAdmin(); // Valida y crea cliente aquí

  try {
    // Validar tamaño de payload antes de procesar (protección contra DoS)
    const contentLength = req.headers.get('content-length');
    const MAX_PAYLOAD_SIZE = 1024 * 1024; // 1MB
    if (contentLength && parseInt(contentLength) > MAX_PAYLOAD_SIZE) {
      logger.warn('⚠️ Payload demasiado grande:', { size: contentLength, max: MAX_PAYLOAD_SIZE });
      return NextResponse.json(
        { error: 'Payload too large' },
        { status: 413 }
      );
    }

    logger.debug('📥 Parseando body del webhook...');
    let body;
    let rawPhoneFromWebhook: string | null = null;
    try {
      // IMPORTANTE: Obtener el body como texto primero para extraer el número sin sanitizar
      const clonedReq = req.clone();
      const rawBodyText = await clonedReq.text();
      
      // Ahora parsear el JSON
      body = JSON.parse(rawBodyText);
      
      // Extraer el número ANTES de cualquier logging o sanitización
      // Buscar el número directamente en el texto crudo usando regex
      // Buscar patrones más flexibles para capturar el número completo
      const phoneMatch = rawBodyText.match(/"from"\s*:\s*"([^"]+)"/);
      const contactMatch = rawBodyText.match(/"wa_id"\s*:\s*"([^"]+)"/);
      
      if (phoneMatch || contactMatch) {
        const phoneFromMatch = phoneMatch?.[1] || '';
        const phoneFromContact = contactMatch?.[1] || '';
        rawPhoneFromWebhook = phoneFromContact.length > phoneFromMatch.length ? phoneFromContact : phoneFromMatch;
        
        process.stdout.write(`🔍 [RAW TEXT] Número extraído del texto crudo: ${rawPhoneFromWebhook}\n`);
        process.stdout.write(`🔍 [RAW TEXT] Longitud: ${rawPhoneFromWebhook.length}\n`);
        
        // Guardar el número real para usar después
        (body as any).__rawPhoneNumber = rawPhoneFromWebhook;
      }
      
      logger.info('📥 Webhook body recibido:', {
        object: body?.object,
        hasEntry: !!body?.entry,
        entryCount: body?.entry?.length || 0,
      });
      logger.debug('✅ Body parseado correctamente');
    } catch (error: any) {
      logger.error('❌ Error parseando body del webhook:', error);
      return NextResponse.json(
        { error: 'Invalid JSON body', message: error?.message },
        { status: 400 }
      );
    }

    webhookLogger.received(body);

    // Validar que es webhook de Meta
    if (body.object !== 'whatsapp_business_account') {
      logger.info('⚠️ Webhook recibido pero object no es whatsapp_business_account:', body.object);
      return NextResponse.json({ status: 'ignored' });
    }

    // Usar el número extraído del texto crudo si está disponible
    if (!rawPhoneFromWebhook) {
      rawPhoneFromWebhook = (body as any).__rawPhoneNumber;
    }
    
    if (rawPhoneFromWebhook) {
      process.stdout.write(`✅ [RAW TEXT] Usando número del texto crudo: ${rawPhoneFromWebhook}\n`);
      process.stdout.write(`✅ [RAW TEXT] Longitud: ${rawPhoneFromWebhook.length}\n`);
    }
    
    const message = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    
    if (!message) {
      logger.info('⚠️ Webhook recibido pero no hay mensaje en el payload');
      return NextResponse.json({ status: 'no_message' });
    }

    // Validación User-Agent: Verificar que el webhook viene de Meta
    const userAgent = req.headers.get('user-agent');
    if (!userAgent || !userAgent.includes('facebookexternalhit') && !userAgent.includes('facebook')) {
      logger.warn('⚠️ Webhook con User-Agent sospechoso:', userAgent);
      // En producción, rechazar webhooks que no vengan de Meta
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
      // En desarrollo, solo advertir
      logger.debug('⚠️ En desarrollo: permitiendo webhook con User-Agent no estándar');
    }

    // Validación Timestamp: Rechazar mensajes muy antiguos (más de 24 horas)
    if (message.timestamp) {
      const messageTimestamp = parseInt(message.timestamp);
      const now = Math.floor(Date.now() / 1000);
      const age = now - messageTimestamp;
      const MAX_AGE_SECONDS = 86400; // 24 horas

      if (age > MAX_AGE_SECONDS) {
        logger.warn('⚠️ Mensaje muy antiguo:', {
          age: `${Math.round(age / 3600)} horas`,
          timestamp: messageTimestamp,
          now
        });
        // Rechazar mensajes muy antiguos (posible ataque o mensaje duplicado)
        return NextResponse.json(
          { error: 'Message too old' },
          { status: 400 }
        );
      }
    }

    // Rate limiting: usar número de teléfono como identificador (no IP)
    // Esto evita que todos los webhooks de Meta compartan el mismo rate limit
    let identifier = getClientIdentifier(req); // Fallback a IP si no hay teléfono
    
    // Intentar obtener número de teléfono del mensaje
    if (message?.from) {
      identifier = `phone:${message.from}`;
      logger.debug('📱 Rate limiting por teléfono:', identifier.substring(0, 15) + '...');
    } else {
      logger.debug('⚠️ No se encontró teléfono en mensaje, usando IP para rate limiting');
    }
    
    const rateLimitResult = await checkRateLimit(webhookRateLimit, identifier);
    
    if (!rateLimitResult || !rateLimitResult.success) {
      logger.warn(`⛔ Rate limit exceeded for webhook from ${identifier.substring(0, 20)}...`);
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

    // Log del tipo de mensaje recibido
    logger.info(`📨 Mensaje recibido de WhatsApp Cloud API - Tipo: ${message.type}, From: ${message.from?.substring(0, 5)}...`);

    // Usar el número extraído ANTES de sanitización
    const phoneNumber = rawPhoneFromWebhook || message?.from;
    const rawPhoneNumber = phoneNumber; // Guardar para enviar mensajes después
    const wa_message_id = message.id; // Obtener wa_message_id para deduplicación

    // Verificar que tenemos el número completo
    console.log('🔍 [RAW] Número después de extraer:', phoneNumber);
    console.log('🔍 [RAW] Longitud del número:', phoneNumber?.length);
    console.log('🔍 [RAW] Tipo del número:', typeof phoneNumber);

    // 1. Buscar usuario por teléfono en tabla usuarios
    // Intentar buscar con ambos formatos (con y sin +)
    // WhatsApp Cloud API envía números sin + (ej: "59176990076")
    // Pero en Supabase pueden estar guardados con + (ej: "+59176990076")
    const phoneWithPlus = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
    const phoneWithoutPlus = phoneNumber.startsWith('+') ? phoneNumber.substring(1) : phoneNumber;
    
    logger.debug('🔍 Buscando usuario con teléfono:', {
      originalLength: phoneNumber?.length || 0,
      withPlusLength: phoneWithPlus.length,
      withoutPlusLength: phoneWithoutPlus.length,
      withPlusPrefix: phoneWithPlus.substring(0, 6) + '...',
      withoutPlusPrefix: phoneWithoutPlus.substring(0, 5) + '...'
    });
    
    // Log adicional para debugging (sin sanitizar)
    console.log('🔍 [RAW] phoneWithPlus completo:', phoneWithPlus);
    console.log('🔍 [RAW] phoneWithoutPlus completo:', phoneWithoutPlus);
    
    // Intentar buscar primero con el formato con +
    let { data: user, error: userError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('telefono', phoneWithPlus)
      .single();
    
    logger.debug('🔍 Resultado búsqueda con +:', {
      found: !!user,
      errorCode: userError?.code,
      errorMessage: userError?.message?.substring(0, 50)
    });

    if (user) {
      logger.debug('✅ Usuario encontrado con formato +:', {
        userId: user.id,
        telefono: user.telefono
      });
    } else if (userError && userError.code !== 'PGRST116') {
      // PGRST116 = no rows returned (esperado si no existe)
      // Otros errores son problemas reales
      logger.warn('⚠️ Error buscando usuario con +:', {
        error: userError.message,
        code: userError.code,
        details: userError
      });
    }

    // Si no se encontró con +, intentar sin +
    if (userError || !user) {
      logger.debug('📱 Usuario no encontrado con formato +, intentando sin +:', {
        phoneLength: phoneWithoutPlus.length,
        phonePrefix: phoneWithoutPlus.substring(0, 5) + '...'
      });
      const result = await supabase
        .from('usuarios')
        .select('*')
        .eq('telefono', phoneWithoutPlus)
        .single();
      
      user = result.data;
      userError = result.error;
      
      logger.debug('🔍 Resultado búsqueda sin +:', {
        found: !!user,
        errorCode: userError?.code,
        errorMessage: userError?.message?.substring(0, 50)
      });
      
      if (user) {
        logger.debug('✅ Usuario encontrado con formato sin +:', {
          userId: user.id,
          telefonoLength: user.telefono?.length,
          telefonoPrefix: user.telefono?.substring(0, 6) + '...'
        });
      } else if (userError && userError.code !== 'PGRST116') {
        logger.warn('⚠️ Error buscando usuario sin +:', {
          error: userError.message,
          code: userError.code
        });
      }
    }
    
    // Si aún no se encontró, intentar búsqueda más flexible (por si hay espacios u otros caracteres)
    // IMPORTANTE: Si el número viene truncado del webhook (solo primeros dígitos),
    // buscar usuarios que empiecen con esos dígitos
    if (userError || !user) {
      logger.debug('📱 Intentando búsqueda flexible (LIKE) para:', {
        withoutPlus: phoneWithoutPlus.substring(0, 5) + '...',
        withPlus: phoneWithPlus.substring(0, 6) + '...',
        phoneLength: phoneWithoutPlus.length
      });
      
      try {
        // Si el número tiene menos de 10 caracteres, probablemente está truncado
        // Buscar usuarios que EMPIECEN con esos dígitos
        let query = supabase
          .from('usuarios')
          .select('id, telefono, nombre, correo');
        
        if (phoneWithoutPlus.length < 10) {
          // Número truncado: buscar que empiece con estos dígitos
          logger.debug('⚠️ Número parece truncado, buscando usuarios que empiecen con estos dígitos');
          process.stdout.write(`🔍 [RAW] Buscando con prefijo: ${phoneWithoutPlus} y ${phoneWithPlus}\n`);
          
          // Intentar múltiples estrategias de búsqueda
          // Estrategia 1: Buscar que empiece con el número sin +
          const { data: users1, error: error1 } = await supabase
            .from('usuarios')
            .select('id, telefono, nombre, correo')
            .ilike('telefono', `${phoneWithoutPlus}%`)
            .limit(5);
          
          process.stdout.write(`🔍 [RAW] Búsqueda 1 (sin +): ${users1?.length || 0} resultados\n`);
          
          // Estrategia 2: Buscar que empiece con el número con +
          const { data: users2, error: error2 } = await supabase
            .from('usuarios')
            .select('id, telefono, nombre, correo')
            .ilike('telefono', `${phoneWithPlus}%`)
            .limit(5);
          
          process.stdout.write(`🔍 [RAW] Búsqueda 2 (con +): ${users2?.length || 0} resultados\n`);
          
          // Combinar resultados únicos
          const allUsers = [...(users1 || []), ...(users2 || [])];
          const uniqueUsers = Array.from(
            new Map(allUsers.map(u => [u.id, u])).values()
          );
          
          process.stdout.write(`🔍 [RAW] Total usuarios únicos: ${uniqueUsers.length}\n`);
          
          var users: any[] = uniqueUsers;
          var likeError = error1 || error2;
        } else {
          // Número completo: buscar que contenga estos dígitos
          query = query.or(`telefono.ilike.%${phoneWithoutPlus}%,telefono.ilike.%${phoneWithPlus}%`);
          
          // Buscar con LIKE, pero limitar a 5 resultados para evitar problemas
          const { data: usersData, error: likeErrorData } = await query.limit(5);
          users = usersData || [];
          likeError = likeErrorData;
        }
        
        process.stdout.write(`🔍 [RAW] Búsqueda flexible - usuarios encontrados: ${users?.length || 0}\n`);
        if (likeError) {
          process.stdout.write(`🔍 [RAW] Error en búsqueda flexible: ${likeError.message}\n`);
        }
      
        if (users && users.length > 0) {
          process.stdout.write(`🔍 [RAW] Usuarios encontrados:\n`);
          users.forEach((u, i) => {
            process.stdout.write(`  ${i + 1}. ID: ${u.id}, Tel: ${u.telefono}\n`);
          });
          
          // Si el número está truncado (< 10 caracteres), usar el primer resultado
          // ya que la búsqueda por prefijo debería ser única
          if (phoneWithoutPlus.length < 10) {
            if (users.length === 1) {
              // Solo un resultado: usarlo directamente
              const { data: fullUser } = await supabase
                .from('usuarios')
                .select('*')
                .eq('id', users[0].id)
                .single();
              
              if (fullUser) {
                user = fullUser;
                userError = null;
                logger.debug('✅ Usuario encontrado con búsqueda flexible (número truncado, único resultado):', {
                  userId: user.id,
                  telefonoPrefix: user.telefono?.substring(0, 6) + '...'
                });
                process.stdout.write(`✅ [RAW] Usuario encontrado: ${user.id}\n`);
              }
            } else if (users.length > 1) {
              // Múltiples resultados: buscar el que mejor coincida
              // Normalizar números y buscar coincidencia más cercana
              const normalizedSearch = phoneWithoutPlus.replace(/\D/g, '');
              const bestMatch = users.find(u => {
                const telNormalized = (u.telefono || '').replace(/\D/g, '');
                return telNormalized.startsWith(normalizedSearch);
              }) || users[0]; // Si no hay mejor coincidencia, usar el primero
              
              const { data: fullUser } = await supabase
                .from('usuarios')
                .select('*')
                .eq('id', bestMatch.id)
                .single();
              
              if (fullUser) {
                user = fullUser;
                userError = null;
                logger.debug('✅ Usuario encontrado con búsqueda flexible (número truncado, múltiples resultados):', {
                  userId: user.id,
                  telefonoPrefix: user.telefono?.substring(0, 6) + '...',
                  totalMatches: users.length
                });
                process.stdout.write(`✅ [RAW] Usuario encontrado (de ${users.length}): ${user.id}\n`);
              }
            }
          } else {
            // Número completo: buscar coincidencia exacta
            const exactMatch = users.find(u => {
              const tel = (u.telefono || '').replace(/\s+/g, '').replace(/[^\d+]/g, '');
              return tel === phoneWithPlus || tel === phoneWithoutPlus;
            });
            
            if (exactMatch) {
              const { data: fullUser } = await supabase
                .from('usuarios')
                .select('*')
                .eq('id', exactMatch.id)
                .single();
              
              if (fullUser) {
                user = fullUser;
                userError = null;
                logger.debug('✅ Usuario encontrado con búsqueda flexible (coincidencia exacta):', {
                  userId: user.id,
                  telefonoPrefix: user.telefono?.substring(0, 6) + '...'
                });
              }
            } else if (users.length === 1) {
              // Solo un resultado: usarlo
              const { data: fullUser } = await supabase
                .from('usuarios')
                .select('*')
                .eq('id', users[0].id)
                .single();
              
              if (fullUser) {
                user = fullUser;
                userError = null;
                logger.debug('✅ Usuario encontrado con búsqueda flexible (único resultado):', {
                  userId: user.id,
                  telefonoPrefix: user.telefono?.substring(0, 6) + '...'
                });
              }
            }
          }
        } else if (likeError) {
          logger.warn('⚠️ Error en búsqueda flexible:', {
            error: likeError.message,
            code: likeError.code
          });
          process.stdout.write(`❌ [RAW] Error en búsqueda: ${likeError.message}\n`);
        }
      } catch (flexError: any) {
        logger.error('❌ Excepción en búsqueda flexible:', flexError);
        process.stdout.write(`❌ [RAW] Excepción: ${flexError.message}\n`);
      }
    }

    if (userError || !user) {
      logger.debug('❌ Usuario no está registrado:', {
        phoneNumber,
        searchedWithPlus: phoneWithPlus,
        searchedWithoutPlus: phoneWithoutPlus,
        error: userError?.message || 'No encontrado'
      });
      logger.debug('💡 Retornando SIN procesar mensaje (ahorro de recursos de Groq)');
      
      // Verificar rate limit para mensajes de invitación (evitar spam)
      // Solo enviar mensaje de invitación si han pasado más de 24 horas desde el último
      logger.debug('🔍 Verificando rate limit para mensaje de invitación:', {
        phoneNumber,
        phoneWithPlus,
        phoneWithoutPlus,
        rawPhoneNumber
      });
      
      // Intentar con ambos formatos (con y sin +) para asegurar que encontramos el registro si existe
      const { data: rateLimitCheck, error: rateLimitError } = await supabase.rpc('debe_enviar_mensaje_invitacion', {
        telefono_param: phoneNumber
      });
      
      logger.debug('📊 Resultado de rate limit check:', {
        rateLimitCheck,
        rateLimitError: rateLimitError?.message,
        phoneNumber,
        typeOfRateLimitCheck: typeof rateLimitCheck
      });

      const debeEnviarMensaje = rateLimitCheck === true;

      if (debeEnviarMensaje) {
        logger.info('✅ Rate limit OK: Puede enviar mensaje de invitación');
        
        // Enviar mensaje de invitación directamente (WhatsApp Cloud API no tiene worker)
        try {
          // Obtener número de soporte de variable de entorno
          const supportNumber = process.env.WHATSAPP_SUPPORT_NUMBER || '+59161600190';
          
          const invitationMessage = `*¡Hola!* 👋
Aún no tienes una cuenta en *Ahorro365* 💜
Este número se usa solo para registrar transacciones ✍️
Para obtener la app, escríbenos aquí:
📲 ${supportNumber}
🎁 Al enviarte la app, recibirás *14 días GRATIS* para probar todas las funciones.`;
          
          logger.debug('📤 Enviando mensaje de invitación:', {
            to: rawPhoneNumber,
            supportNumber,
            messageLength: invitationMessage.length
          });
          
          const sendResult = await sendWhatsAppMessage(rawPhoneNumber, invitationMessage);
          
          if (sendResult.success) {
            logger.info('✅ Mensaje de invitación enviado al usuario:', {
              message_id: sendResult.message_id,
              phone: rawPhoneNumber.substring(0, 5) + '...'
            });
            
            // Registrar que se envió el mensaje
            const { error: registerError } = await supabase.rpc('registrar_mensaje_invitacion', {
              telefono_param: phoneNumber
            });
            
            if (registerError) {
              logger.error('❌ Error registrando mensaje de invitación:', registerError);
            } else {
              logger.debug('✅ Mensaje de invitación registrado en BD');
            }
          } else {
            logger.error('❌ Error enviando mensaje de invitación:', {
              error: sendResult.error,
              errorCode: (sendResult as any).errorCode,
              errorType: (sendResult as any).errorType,
              phone: rawPhoneNumber.substring(0, 5) + '...'
            });
          }
        } catch (error: any) {
          logger.error('❌ Excepción enviando mensaje de invitación:', {
            errorMessage: error?.message,
            errorStack: error?.stack,
            phone: rawPhoneNumber?.substring(0, 5) + '...'
          });
          // No fallar el webhook si falla el envío del mensaje
        }
      } else {
        logger.info('⏸️ Rate limit: Ya se envió mensaje recientemente (últimas 24h)', {
          phoneNumber,
          rateLimitCheck,
          rateLimitError: rateLimitError?.message
        });
        logger.debug('💡 Ignorando mensaje para evitar spam');
      }

      // Retornar error simple sin procesar (ahorro de recursos de Groq)
      return NextResponse.json({
        success: false,
        error: 'user_not_registered',
        message: 'Usuario no está registrado en la plataforma',
        should_send_invitation: debeEnviarMensaje
      }, { status: 200 });
    }

    logger.debug('✅ Usuario encontrado:', user.id);

    // Verificar duplicado ANTES de procesar (para audios Y textos)
    if (wa_message_id) {
      const cached = await checkDuplicateWhatsAppMessage(wa_message_id);
      if (cached) {
        logger.debug('📦 Mensaje duplicado en caché (early return)');
        return NextResponse.json({
          success: true,
          cached: true,
          message: 'Mensaje ya procesado anteriormente'
        });
      }
    }

    // 1.5. Manejar mensajes de TEXTO (confirmaciones O transacciones)
    if (message.type === 'text') {
      const textMessage = message.text?.body || '';
      logger.debug('📝 Mensaje de texto recibido:', textMessage);
      
      // VALIDAR LONGITUD DE TEXTO PRIMERO (antes de procesar confirmación o transacción)
      const currentPlan = (user.suscripcion || 'free') as SubscriptionPlan;
      const textValidation = await validateCanCreateTransaction(
        currentPlan,
        user.id,
        supabase,
        undefined, // audioDurationSeconds
        textMessage // textContent
      );
      
      if (!textValidation.valid) {
        logger.warn(`⚠️ Texto excede límite: ${textMessage.length} caracteres`);
        try {
          await sendWhatsAppMessage(rawPhoneNumber, textValidation.message || '⚠️ Texto demasiado largo');
        } catch (error: any) {
          logger.error('❌ Error enviando mensaje de límite de texto:', error);
        }
        return NextResponse.json({
          success: false,
          error: textValidation.errorCode || 'TEXT_LENGTH_EXCEEDED',
          message: textValidation.message
        }, { status: 200 });
      }
      
      // ⚠️ IMPORTANTE: Verificar si es confirmación PRIMERO (antes de validar contexto de transacción)
      // Esto permite que "sí", "ok", "perfecto" se procesen como confirmaciones
      const { type: confirmationType } = parseConfirmation(textMessage);
      
      if (confirmationType === 'confirm') {
        logger.debug('✅ Confirmación detectada, procesando confirmación...');
        
        // Procesar confirmación directamente
        try {
          const confirmResult = await processConfirmation(phoneNumber, textMessage);
          
          if (confirmResult.success) {
            logger.info('✅ Confirmación procesada exitosamente');
            
            // Enviar mensaje de confirmación al usuario
            const confirmMessage = confirmResult.message || '✅ Perfecto. Transacción guardada.';
            await sendWhatsAppMessage(phoneNumber, confirmMessage);
            
            return NextResponse.json({
              success: true,
              message: 'Confirmación procesada',
              confirmation: true
            });
          } else {
            logger.error('❌ Error procesando confirmación:', confirmResult);
            
            // Enviar mensaje de error al usuario si hay uno
            if (confirmResult.error) {
              try {
                await sendWhatsAppMessage(phoneNumber, confirmResult.error);
              } catch (error: any) {
                logger.error('❌ Error enviando mensaje de error de confirmación:', error);
              }
            }
            
            return NextResponse.json({
              success: false,
              error: confirmResult.error || 'Error procesando confirmación',
              message: confirmResult.suggestion
            }, { status: 200 });
          }
        } catch (error: any) {
          logger.error('❌ Excepción procesando confirmación:', {
            errorMessage: error?.message || 'Unknown error',
            errorStack: error?.stack || 'No stack trace',
            errorName: error?.name || 'Unknown',
            errorType: typeof error,
            errorString: String(error),
            error: error
          });
          
          // Intentar enviar mensaje de error al usuario
          try {
            await sendWhatsAppMessage(phoneNumber, '❌ *Error al procesar confirmación*\nLo sentimos, hubo un problema al guardar tu transacción.\nPor favor, intenta nuevamente. 💜');
          } catch (sendError: any) {
            logger.error('❌ Error enviando mensaje de error de confirmación:', sendError);
          }
          
          return NextResponse.json({
            success: false,
            error: 'Error interno procesando confirmación',
            errorMessage: error?.message || 'Unknown error'
          }, { status: 500 });
        }
      }
      
      // Si NO es confirmación, entonces validar contexto de transacción
      // Esto evita procesar textos sin sentido como transacciones
      const trimmedText = textMessage.trim();
      
      // Palabras clave relacionadas con transacciones
      const transactionKeywords = [
        'gast', 'compr', 'pagu', 'pague', 'recib', 'cobr', 'vend', 'gan', 'gane',
        'debo', 'deuda', 'prest', 'ahorr', 'invers', 'transacc', 'monto', 'cantidad',
        'dinero', 'peso', 'dolar', 'euro', 'boliviano', 'sol', 'bs', 's/', '$',
        'taxi', 'comida', 'ropa', 'transporte', 'farmacia', 'supermercado', 'mercado',
        'restaurante', 'café', 'gasolina', 'combustible', 'servicio', 'factura'
      ];
      
      // Frases comunes que NO son transacciones
      const nonTransactionPhrases = [
        'gracias', 'hola', 'adiós', 'hasta luego', 'buenos días', 'buenas tardes', 'buenas noches',
        'por ver', 'por escuchar', 'por leer', 'saludos', 'que tengas', 'que pases',
        'video', 'audio', 'mensaje', 'llamada', 'texto', 'fundación', 'puede referirse',
        'entidades', 'dedicada'
      ];
      
      // Verificar si tiene números (montos)
      const hasNumbers = /\d/.test(trimmedText);
      
      // Verificar si tiene palabras clave de transacciones
      const lowerText = trimmedText.toLowerCase();
      const hasKeywords = transactionKeywords.some(keyword => lowerText.includes(keyword));
      
      // Verificar si es claramente una frase NO relacionada con transacciones
      const isNonTransaction = nonTransactionPhrases.some(phrase => lowerText.includes(phrase));
      
      // Si es claramente un texto sin contexto de transacción, rechazar
      if (isNonTransaction && !hasNumbers && !hasKeywords) {
        logger.warn('⚠️ Texto sin contexto de transacción (rechazado):', trimmedText);
        const errorMessage = `❌ *Mensaje sin transacción*\nTu mensaje no parece contener una transacción.\nPor favor, envía un mensaje con un monto o una acción (ej: "gasté 50 en taxi"). 💜`;
        
        try {
          await sendWhatsAppMessage(rawPhoneNumber, errorMessage);
        } catch (error: any) {
          logger.error('❌ Error enviando mensaje de texto sin contexto:', error);
        }
        
        return NextResponse.json({
          success: false,
          error: 'TEXT_NO_TRANSACTION_CONTEXT',
          message: 'Texto sin contexto de transacción'
        }, { status: 200 });
      }
      
      // Si no tiene números NI palabras clave, probablemente no es una transacción válida
      if (!hasNumbers && !hasKeywords) {
        logger.warn('⚠️ Texto sin contexto de transacción (sin números ni palabras clave):', trimmedText);
        const errorMessage = `❌ *Mensaje sin transacción*\nTu mensaje no parece contener una transacción.\nPor favor, envía un mensaje con un monto o una acción (ej: "gasté 50 en taxi"). 💜`;
        
        try {
          await sendWhatsAppMessage(rawPhoneNumber, errorMessage);
        } catch (error: any) {
          logger.error('❌ Error enviando mensaje de texto sin contexto:', error);
        }
        
        return NextResponse.json({
          success: false,
          error: 'TEXT_NO_TRANSACTION_CONTEXT',
          message: 'Texto sin contexto de transacción (sin números ni palabras clave)'
        }, { status: 200 });
      }
      
      // Si llegó aquí, es una transacción (no es confirmación y tiene contexto de transacción)
      // La confirmación ya fue procesada arriba si era el caso
      
      // NO es confirmación → Procesar como transacción (como en Baileys)
      logger.debug('📝 Mensaje de texto detectado como transacción, procesando...');
      
      // La validación de longitud ya se hizo arriba, continuar con el procesamiento
      // Usar el texto directamente como transcripción (como en Baileys línea 206)
      const transcription = textMessage;
      logger.debug('✅ Using text as transcription:', transcription);
      
      // Continuar con el procesamiento normal usando la transcripción
      // (saltar descarga de audio y transcripción)
      const messageTimestampForText = message.timestamp ? parseInt(message.timestamp) : undefined;
      return await processTranscription(transcription, phoneNumber, rawPhoneNumber, wa_message_id, user, supabase, startTime, 'text', messageTimestampForText);
    }

    // Solo procesar audios
    if (message.type !== 'audio') {
      logger.info(`ℹ️ Mensaje de tipo '${message.type}' recibido pero no procesado`);
      return NextResponse.json({ status: 'not_supported', message_type: message.type });
    }

    // Ahora sí podemos acceder a audio de forma segura
    const { audio } = message;

    // No loguear número de teléfono completo por seguridad
    logger.debug('📱 WhatsApp audio received from user');
    logger.debug('Audio info:', { id: audio?.id, mime_type: audio?.mime_type, duration: audio?.duration });

    // VALIDAR DURACIÓN DE AUDIO ANTES de descargar de Meta (ahorro de recursos)
    // NOTA: Meta puede no enviar siempre `duration` en el webhook, pero cuando lo hace, lo validamos
    const currentPlan = (user.suscripcion || 'free') as SubscriptionPlan;
    
    // Intentar parsear duration (puede venir como string o número)
    let audioDuration: number | undefined = undefined;
    if (audio?.duration !== undefined && audio?.duration !== null) {
      if (typeof audio.duration === 'string') {
        const parsed = parseInt(audio.duration);
        if (!isNaN(parsed)) {
          audioDuration = parsed;
        }
      } else if (typeof audio.duration === 'number' && !isNaN(audio.duration)) {
        audioDuration = audio.duration;
      }
      
      // Si después de parsear sigue siendo undefined o NaN, loguear warning
      if (audioDuration === undefined) {
        logger.warn('⚠️ audio.duration no es un número válido:', audio.duration);
      }
    }
    
    logger.debug('🔍 Validando duración de audio:', { 
      rawDuration: audio?.duration, 
      parsedDuration: audioDuration 
    });
    
    // Validar duración de audio si está disponible
    if (audioDuration !== undefined && typeof audioDuration === 'number' && !isNaN(audioDuration)) {
      // Ya validado que es un número válido
      const audioValidation = await validateCanCreateTransaction(
        currentPlan,
        user.id,
        supabase,
        audioDuration, // audioDurationSeconds (ya validado que es number y no NaN)
        undefined // textContent
      );
      
      if (!audioValidation.valid) {
        logger.warn(`⚠️ Audio excede límite: ${audioDuration} segundos`);
        try {
          await sendWhatsAppMessage(rawPhoneNumber, audioValidation.message || '⚠️ Audio demasiado largo');
        } catch (error: any) {
          logger.error('❌ Error enviando mensaje de límite de audio:', error);
        }
        return NextResponse.json({
          success: false,
          error: audioValidation.errorCode || 'AUDIO_DURATION_EXCEEDED',
          message: audioValidation.message
        }, { status: 200 });
      }
      
      logger.debug(`✅ Duración de audio OK: ${audioDuration as number} segundos`);
    } else {
      logger.debug('⚠️ audio.duration no disponible en webhook. Validación omitida (se validará después de descargar si es posible)');
    }

    // 2. Descargar audio de Meta
    // Paso 1: Obtener la URL del archivo desde Meta
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN || process.env.META_WHATSAPP_TOKEN; // Fallback para compatibilidad
    const apiVersion = process.env.WHATSAPP_API_VERSION || 'v24.0'; // Actualizado a v24.0 (v22.0 deprecado)
    const mediaUrl = `https://graph.facebook.com/${apiVersion}/${audio.id}`;
    
    if (!accessToken) {
      logger.error('❌ WHATSAPP_ACCESS_TOKEN no está configurado');
      throw new Error('WhatsApp access token not configured');
    }
    
    logger.debug('📥 Obteniendo URL del audio de Meta:', {
      audioId: audio.id,
      mediaUrl,
      apiVersion,
      hasAccessToken: !!accessToken,
      accessTokenLength: accessToken?.length || 0,
    });
    
    // Paso 1: Obtener la URL del archivo
    const mediaResponse = await fetch(mediaUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!mediaResponse.ok) {
      const errorText = await mediaResponse.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { raw: errorText };
      }
      
      logger.error('❌ Failed to get audio URL from Meta', {
        status: mediaResponse.status,
        statusText: mediaResponse.statusText,
        mediaUrl,
        audioId: audio.id,
        errorText,
        errorData,
        headers: Object.fromEntries(mediaResponse.headers.entries()),
      });
      
      // Si es un error 401 (token expirado), dar instrucciones específicas
      if (mediaResponse.status === 401) {
        const isExpired = errorData?.error?.message?.includes('expired') || 
                         errorData?.error?.message?.includes('Session has expired');
        
        if (isExpired) {
          logger.error('💡 SOLUCIÓN: El token de WhatsApp ha expirado');
          logger.error('   El token de acceso temporal expira después de cierto tiempo.');
          logger.error('   Necesitas generar un nuevo token de acceso.');
          logger.error('');
          logger.error('   Opciones:');
          logger.error('   1. Token Temporal (rápido pero expira):');
          logger.error('      • Ve a https://developers.facebook.com/tools/explorer/');
          logger.error('      • Selecciona tu app de WhatsApp');
          logger.error('      • Genera un nuevo token con permisos: whatsapp_business_management, whatsapp_business_messaging');
          logger.error('      • Actualiza WHATSAPP_ACCESS_TOKEN en .env.local y Vercel');
          logger.error('');
          logger.error('   2. Token Permanente (recomendado):');
          logger.error('      • Consulta la guía: docs/GUIA_TOKEN_PERMANENTE_WHATSAPP.md');
          logger.error('      • Crea un System User en Meta Business Suite');
          logger.error('      • Genera un token permanente que no expira');
          logger.error('      • Actualiza WHATSAPP_ACCESS_TOKEN en .env.local y Vercel');
        } else {
          logger.error('💡 SOLUCIÓN: Token inválido o no autorizado');
          logger.error('   Verifica que el WHATSAPP_ACCESS_TOKEN sea correcto');
          logger.error('   Genera un nuevo token en Meta Developer Console');
        }
      }
      
      // Si es un error de permisos, dar instrucciones específicas
      if (mediaResponse.status === 400 && errorData?.error?.code === 100) {
        logger.error('💡 SOLUCIÓN: El token no tiene permisos para acceder a media');
        logger.error('   Verifica que el token tenga estos permisos:');
        logger.error('   • whatsapp_business_management');
        logger.error('   • whatsapp_business_messaging');
        logger.error('   Genera un nuevo token con estos permisos en Meta Developer Console');
      }
      
      throw new Error(`Failed to get audio URL from Meta: ${mediaResponse.status} ${mediaResponse.statusText}`);
    }

    const mediaData = await mediaResponse.json();
    const audioDownloadUrl = mediaData.url;
    
    if (!audioDownloadUrl) {
      logger.error('❌ No se encontró la URL del audio en la respuesta de Meta', {
        mediaData,
      });
      throw new Error('Audio URL not found in Meta response');
    }
    
    logger.debug('✅ URL del audio obtenida:', {
      audioDownloadUrl: audioDownloadUrl.substring(0, 100) + '...',
      mimeType: mediaData.mime_type,
    });
    
    // Paso 2: Descargar el archivo desde la URL obtenida
    logger.debug('📥 Descargando archivo de audio...');
    const audioResponse = await fetch(audioDownloadUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!audioResponse.ok) {
      const errorText = await audioResponse.text();
      logger.error('❌ Failed to download audio file from Meta', {
        status: audioResponse.status,
        statusText: audioResponse.statusText,
        audioDownloadUrl: audioDownloadUrl.substring(0, 100) + '...',
        audioId: audio.id,
        errorText,
      });
      throw new Error(`Failed to download audio file from Meta: ${audioResponse.status} ${audioResponse.statusText}`);
    }

    const audioBlob = await audioResponse.blob();
    logger.debug('✅ Audio downloaded:', audioBlob.size, 'bytes');

    // 3. Validar duración del audio DESPUÉS de descargarlo (si Meta no la envió en el webhook)
    // Solo validar si no se validó antes (cuando Meta SÍ envió duration)
    if (audioDuration === undefined) {
      try {
        const mm = await import('music-metadata');
        const arrayBuffer = await audioBlob.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const metadata = await mm.parseBuffer(buffer, { mimeType: audioBlob.type || 'audio/ogg' });
        
        if (metadata.format.duration) {
          audioDuration = Math.ceil(metadata.format.duration); // Redondear hacia arriba
          logger.debug('✅ Duración obtenida del archivo:', audioDuration, 'segundos');
          
          // Validar duración
          const currentPlan = (user.suscripcion || 'free') as SubscriptionPlan;
          const audioValidation = await validateCanCreateTransaction(
            currentPlan,
            user.id,
            supabase,
            audioDuration,
            undefined // textContent
          );
          
          if (!audioValidation.valid) {
            logger.warn(`⚠️ Audio excede límite (validado después de descargar): ${audioDuration} segundos`);
            try {
              await sendWhatsAppMessage(rawPhoneNumber, audioValidation.message || '⚠️ Audio demasiado largo');
            } catch (error: any) {
              logger.error('❌ Error enviando mensaje de límite de audio:', error);
            }
            return NextResponse.json({
              success: false,
              error: audioValidation.errorCode || 'AUDIO_DURATION_EXCEEDED',
              message: audioValidation.message
            }, { status: 200 });
          }
        } else {
          logger.warn('⚠️ No se pudo obtener duración del archivo de audio');
        }
      } catch (error: any) {
        logger.warn('⚠️ Error obteniendo duración del audio (continuando):', error.message);
        // Continuar con el procesamiento si no se puede obtener la duración
      }
    }

    // 4. Convertir blob a File
    const audioFile = new File([audioBlob], 'audio.wav', { type: 'audio/wav' });

    // 5. Transcribir con Groq Whisper
    let transcription: string;
    try {
      transcription = await groqWhisperService.transcribe(audioFile, 'es');
      logger.debug('✅ Transcription:', transcription);
    } catch (error: any) {
      logger.error('❌ Error transcribiendo audio:', error);
      const errorMessage = `❌ *Error procesando tu audio*\nLo sentimos, hubo un problema al transcribir tu mensaje.\nPor favor, intenta enviarlo nuevamente. 💜`;
      
      try {
        await sendWhatsAppMessage(rawPhoneNumber, errorMessage);
      } catch (sendError: any) {
        logger.error('❌ Error enviando mensaje de error de transcripción:', sendError);
      }
      
      return NextResponse.json({
        success: false,
        error: 'TRANSCRIPTION_ERROR',
        message: 'Error al transcribir el audio'
      }, { status: 200 });
    }

    // Continuar con el procesamiento común
    const messageTimestampForAudio = message.timestamp ? parseInt(message.timestamp) : undefined;
    return await processTranscription(transcription, phoneNumber, rawPhoneNumber, wa_message_id, user, supabase, startTime, 'audio', messageTimestampForAudio);
  } catch (error: any) {
    // Log detallado del error para diagnóstico
    logger.error('❌ Error al procesar webhook de WhatsApp:', {
      errorMessage: error?.message || 'Unknown error',
      errorStack: error?.stack || 'No stack trace',
      errorName: error?.name || 'Unknown',
      errorType: typeof error,
      errorString: String(error),
    });
    
    // Log adicional si es un error de fetch
    if (error?.message?.includes('fetch') || error?.message?.includes('Failed to download')) {
      logger.error('❌ Error al descargar audio de Meta:', {
        audioUrl: error?.audioUrl || 'unknown',
        accessTokenConfigured: !!process.env.WHATSAPP_ACCESS_TOKEN,
        apiVersion: process.env.WHATSAPP_API_VERSION || 'v22.0',
      });
    }
    
    // Log adicional si es un error de Supabase
    if (error?.code || error?.message?.includes('supabase') || error?.message?.includes('database')) {
      logger.error('❌ Error de Supabase:', {
        errorCode: error?.code,
        errorMessage: error?.message,
        errorDetails: error?.details,
        errorHint: error?.hint,
      });
    }
    
    // Usar error handler seguro
    return handleError(error, 'Error al procesar el webhook de WhatsApp');
  }
}

/**
 * Función común para procesar transcripciones (audio o texto)
 * Basado en el sistema Baileys original
 */
async function processTranscription(
  transcription: string,
  phoneNumber: string,
  rawPhoneNumber: string,
  wa_message_id: string,
  user: any,
  supabase: any,
  startTime: number,
  messageType: 'audio' | 'text' = 'audio',
  messageTimestamp?: number // Timestamp del mensaje de WhatsApp
): Promise<NextResponse> {
  try {
    // 4. Validar que la transcripción no esté vacía o sea muy corta
    const trimmedTranscription = transcription?.trim() || '';
    
    if (!trimmedTranscription || trimmedTranscription.length === 0) {
      logger.warn('⚠️ Transcripción vacía o sin contenido');
      const errorMessage = messageType === 'audio'
        ? `❌ *No se pudo entender tu audio*\nLo sentimos, no pudimos transcribir tu mensaje de audio.\nPor favor, intenta enviarlo nuevamente hablando más claro o más cerca del micrófono. 💜`
        : `❌ *Mensaje vacío*\nNo recibimos ningún texto en tu mensaje.\nPor favor, envía tu mensaje nuevamente. 💜`;
      
      try {
        await sendWhatsAppMessage(rawPhoneNumber, errorMessage);
      } catch (error: any) {
        logger.error('❌ Error enviando mensaje de transcripción vacía:', error);
      }
      
      return NextResponse.json({
        success: false,
        error: 'EMPTY_TRANSCRIPTION',
        message: 'Transcripción vacía o sin contenido'
      }, { status: 200 });
    }
    
    // Validar que la transcripción tenga sentido (mínimo 3 caracteres y no solo caracteres especiales)
    if (trimmedTranscription.length < 3) {
      logger.warn('⚠️ Transcripción muy corta:', trimmedTranscription);
      const errorMessage = messageType === 'audio'
        ? `❌ *Audio no se entendió*\nLo sentimos, no pudimos entender tu audio.\nPor favor, intenta enviarlo nuevamente hablando más claro. 💜`
        : `❌ *Mensaje muy corto*\nTu mensaje es muy corto para procesar.\nPor favor, envía un mensaje más completo. 💜`;
      
      try {
        await sendWhatsAppMessage(rawPhoneNumber, errorMessage);
      } catch (error: any) {
        logger.error('❌ Error enviando mensaje de transcripción corta:', error);
      }
      
      return NextResponse.json({
        success: false,
        error: 'TRANSCRIPTION_TOO_SHORT',
        message: 'Transcripción muy corta o sin sentido'
      }, { status: 200 });
    }
    
    // Validar que la transcripción tenga contenido real (no solo signos de puntuación, espacios o caracteres sin sentido)
    // Remover signos de puntuación y espacios, verificar que queden letras o números
    const textWithoutPunctuation = trimmedTranscription.replace(/[.,;:!?¿¡\s\-_()\[\]{}'"]/g, '');
    const hasLettersOrNumbers = /[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]/.test(textWithoutPunctuation);
    
    if (!hasLettersOrNumbers || textWithoutPunctuation.length < 2) {
      logger.warn('⚠️ Transcripción sin contenido real (solo signos de puntuación):', trimmedTranscription);
      const errorMessage = messageType === 'audio'
        ? `❌ *No se pudo entender tu audio*\nLo sentimos, no pudimos entender lo que dijiste en el audio.\nPor favor, intenta enviarlo nuevamente hablando más claro. 💜`
        : `❌ *Mensaje sin contenido*\nTu mensaje no tiene contenido suficiente para procesar.\nPor favor, envía un mensaje con texto real. 💜`;
      
      try {
        await sendWhatsAppMessage(rawPhoneNumber, errorMessage);
      } catch (error: any) {
        logger.error('❌ Error enviando mensaje de transcripción sin contenido:', error);
      }
      
      return NextResponse.json({
        success: false,
        error: 'TRANSCRIPTION_NO_CONTENT',
        message: 'Transcripción sin contenido real (solo signos de puntuación)'
      }, { status: 200 });
    }
    
    // Validar que la transcripción tenga contexto de transacción (números o palabras clave)
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
      const errorMessage = messageType === 'audio'
        ? `❌ *No se pudo entender tu audio*\nLo sentimos, no pudimos identificar una transacción en tu mensaje.\nPor favor, intenta enviarlo nuevamente mencionando un monto o una acción (ej: "gasté 50 en taxi"). 💜`
        : `❌ *Mensaje sin transacción*\nTu mensaje no parece contener una transacción.\nPor favor, envía un mensaje con un monto o una acción (ej: "gasté 50 en taxi"). 💜`;
      
      try {
        await sendWhatsAppMessage(rawPhoneNumber, errorMessage);
      } catch (error: any) {
        logger.error('❌ Error enviando mensaje de transcripción sin contexto:', error);
      }
      
      return NextResponse.json({
        success: false,
        error: 'TRANSCRIPTION_NO_TRANSACTION_CONTEXT',
        message: 'Transcripción es saludo/agradecimiento sin contexto de transacción'
      }, { status: 200 });
    }
    
    // Si no tiene números NI palabras clave, probablemente no es una transacción
    if (!hasNumbers && !hasKeywords) {
      logger.warn('⚠️ Transcripción sin contexto de transacción (sin números ni palabras clave):', trimmedTranscription);
      const errorMessage = messageType === 'audio'
        ? `❌ *No se pudo entender tu audio*\nLo sentimos, no pudimos identificar una transacción en tu mensaje.\nPor favor, intenta enviarlo nuevamente mencionando un monto o una acción (ej: "gasté 50 en taxi"). 💜`
        : `❌ *Mensaje sin transacción*\nTu mensaje no parece contener una transacción.\nPor favor, envía un mensaje con un monto o una acción (ej: "gasté 50 en taxi"). 💜`;
      
      try {
        await sendWhatsAppMessage(rawPhoneNumber, errorMessage);
      } catch (error: any) {
        logger.error('❌ Error enviando mensaje de transcripción sin contexto:', error);
      }
      
      return NextResponse.json({
        success: false,
        error: 'TRANSCRIPTION_NO_TRANSACTION_CONTEXT',
        message: 'Transcripción sin contexto de transacción (sin números ni palabras clave)'
      }, { status: 200 });
    }
    
    // 4.5. Validar límite básico ANTES de procesar con Groq (puede crear al menos 1?)
    const currentPlan = (user.suscripcion || 'free') as SubscriptionPlan;
    const basicValidation = await validateCanCreateTransaction(
      currentPlan,
      user.id,
      supabase
    );
    
    if (!basicValidation.valid) {
      logger.warn(`⚠️ Límite alcanzado antes de procesar: ${basicValidation.message}`);
      try {
        await sendWhatsAppMessage(rawPhoneNumber, basicValidation.message || '⚠️ Límite alcanzado');
      } catch (error: any) {
        logger.error('❌ Error enviando mensaje de límite:', error);
      }
      return NextResponse.json({
        success: false,
        error: basicValidation.errorCode || 'LIMIT_EXCEEDED',
        message: basicValidation.message
      }, { status: 200 });
    }
    
    // 5. Extraer datos con Groq LLM - MÚLTIPLES TRANSACCIONES
    let groqResult: GroqMultipleResponse | null = null;
    let groqError: Error | null = null;
    
    try {
      groqResult = await groqService.processTranscriptionMultiple(
        transcription,
        user.country_code || 'BOL'
      );
    } catch (error: any) {
      groqError = error;
      logger.error('❌ Error procesando con Groq:', {
        error: error?.message,
        stack: error?.stack,
        messageType,
        transcription: transcription.substring(0, 50) + '...'
      });
      
      // Manejar rate limit de Groq específicamente
      if (error?.message?.includes('rate_limit') || error?.message?.includes('Rate limit')) {
        const rateLimitMessage = `⚠️ *Servicio temporalmente ocupado*\nLo sentimos, el servicio está procesando muchas solicitudes en este momento.\nPor favor, intenta nuevamente en unos segundos. 💜`;
        
        try {
          await sendWhatsAppMessage(rawPhoneNumber, rateLimitMessage);
        } catch (sendError: any) {
          logger.error('❌ Error enviando mensaje de rate limit:', sendError);
        }
        
        return NextResponse.json({
          success: false,
          error: 'GROQ_RATE_LIMIT',
          message: 'Rate limit alcanzado en Groq API. Intenta nuevamente en unos segundos.'
        }, { status: 200 });
      }
      
      // Otros errores de Groq
      const errorMessage = messageType === 'audio'
        ? `❌ *Error procesando tu mensaje*\nLo sentimos, hubo un problema al procesar tu audio.\nPor favor, intenta nuevamente en un momento. 💜`
        : `❌ *Error procesando tu mensaje*\nLo sentimos, hubo un problema al procesar tu mensaje de texto.\nPor favor, intenta nuevamente en un momento. 💜`;
      
      try {
        await sendWhatsAppMessage(rawPhoneNumber, errorMessage);
      } catch (sendError: any) {
        logger.error('❌ Error enviando mensaje de error:', sendError);
      }
      
      return NextResponse.json({
        success: false,
        error: 'EXTRACTION_FAILED',
        message: `Error procesando ${messageType} con Groq API`,
        groqError: error?.message,
        messageType
      }, { status: 200 });
    }
    
    logger.debug('✅ Groq multiple result:', groqResult);
    
    if (!groqResult || !groqResult.transacciones || groqResult.transacciones.length === 0) {
      logger.error('❌ No se pudo extraer datos. Resultado vacío de Groq.', {
        messageType,
        transcription: transcription.substring(0, 50) + '...',
        groqResult
      });
      
      const errorMessage = messageType === 'audio'
        ? `❌ *No se pudo procesar tu mensaje*\nLo sentimos, no pudimos entender tu audio.\nPor favor, intenta enviarlo nuevamente de forma más clara. 💜`
        : `❌ *No se pudo procesar tu mensaje*\nLo sentimos, no pudimos entender tu mensaje de texto.\nPor favor, intenta enviarlo nuevamente con un formato más claro (ej: "50 de taxi"). 💜`;
      
      try {
        await sendWhatsAppMessage(rawPhoneNumber, errorMessage);
      } catch (sendError: any) {
        logger.error('❌ Error enviando mensaje de error:', sendError);
      }
      
      return NextResponse.json(
        {
          error: 'EXTRACTION_FAILED',
          message: `No se pudo extraer datos del ${messageType}`,
          transcription: transcription.substring(0, 100),
          messageType
        },
        { status: 200 }
      );
    }

    // 6. Verificar configuración de confirmación por país
    const { data: config } = await supabase
      .from('feedback_confirmation_config')
      .select('require_confirmation')
      .eq('country_code', user.country_code || 'BOL')
      .single();

    const requireConfirmation = config?.require_confirmation ?? true;
    logger.debug(`📋 Configuración país ${user.country_code || 'BOL'}: requireConfirmation = ${requireConfirmation}`);

    // 6.5. Si es múltiple, validar límite ANTES de procesar
    const transactionCount = groqResult.transacciones.length;
    const isMultiple = groqResult?.esMultiple && transactionCount > 1;
    
    if (isMultiple) {
      logger.debug(`🔍 Validando límite para ${transactionCount} transacciones múltiples`);
      const limitValidation = await validateTransactionLimitForMultiple(
        currentPlan,
        user.id,
        transactionCount,
        supabase
      );
      
      if (!limitValidation.canProcessAll) {
        logger.warn(`⚠️ No puede procesar todas las transacciones: ${limitValidation.message}`);
        try {
          await sendWhatsAppMessage(rawPhoneNumber, limitValidation.message || '⚠️ Límite parcial');
        } catch (error: any) {
          logger.error('❌ Error enviando mensaje de límite parcial:', error);
        }
        return NextResponse.json({
          success: false,
          error: 'PARTIAL_LIMIT_EXCEEDED',
          message: limitValidation.message,
          currentCount: limitValidation.currentCount,
          maxAllowed: limitValidation.maxAllowed,
          requestedCount: limitValidation.requestedCount,
          remainingSlots: limitValidation.remainingSlots
        }, { status: 200 });
      }
      
      logger.debug(`✅ Límite OK: Puede procesar todas las ${transactionCount} transacciones`);
    }

    // 6.5. Contar transacciones pendientes previas (antes de crear las nuevas)
    const { count: previousPendingCount } = await supabase
      .from('pending_confirmations')
      .select('*', { count: 'exact', head: true })
      .eq('usuario_id', user.id)
      .is('confirmed', null);
    
    logger.debug(`📊 Transacciones pendientes previas: ${previousPendingCount || 0}`);

    // 7. Procesar según si es múltiple o simple
    // ⚠️ IMPORTANTE: Usar timestamp del mensaje de WhatsApp, no la hora actual
    // Esto permite rastrear cuándo se envió realmente el mensaje
    const messageTimestampValue = messageTimestamp || Math.floor(Date.now() / 1000);
    const now = new Date(messageTimestampValue * 1000).toISOString();
    let cached = false;
    let prediction: any = null;
    let expenseData: any = null;
    let pendingCount = 0;
    
    if (groqResult?.esMultiple && groqResult.transacciones.length > 1) {
      logger.debug(`✅ MÚLTIPLES transacciones detectadas: ${groqResult.transacciones.length}`);
      
      // Crear una predicción por cada transacción
      const predictions: any[] = [];
      for (let i = 0; i < groqResult.transacciones.length; i++) {
        const tx = groqResult.transacciones[i];
        const { cached: isCached, data: pred } = await insertPredictionWithDedup({
          usuario_id: user.id,
          country_code: user.country_code || 'BOL',
          transcripcion: `${transcription} [TX ${i+1}/${groqResult.transacciones.length}]`,
          resultado: tx,
          wa_message_id: `${wa_message_id}_${i}`,
          mensaje_origen: 'whatsapp',
          original_timestamp: now,
          parent_message_id: wa_message_id
        });
        predictions.push(pred);
        if (isCached) cached = true;
      }
      
      prediction = predictions[0]; // Usar primera para compatibilidad
      expenseData = groqResult.transacciones[0]; // Primera transacción
      
      // Crear confirmaciones pendientes para todas
      if (requireConfirmation) {
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 30);
        
        for (let i = 0; i < predictions.length; i++) {
          await supabase.from('pending_confirmations').insert({
            prediction_id: predictions[i].id,
            usuario_id: user.id,
            country_code: user.country_code || 'BOL',
            wa_message_id: `${wa_message_id}_${i}`,
            parent_message_id: wa_message_id, // KEY: Agrupar todas
            expires_at: expiresAt.toISOString()
          });
        }
        
        logger.debug(`⏳ ${predictions.length} confirmaciones pendientes creadas (30 min)`);
        pendingCount = predictions.length;
      }
    } else {
      // Comportamiento SIMPLE (1 transacción)
      logger.debug('📝 Modo SIMPLE: 1 transacción');
      expenseData = groqResult.transacciones[0];
      const { cached: isCached, data: pred } = await insertPredictionWithDedup({
        usuario_id: user.id,
        country_code: user.country_code || 'BOL',
        transcripcion: transcription,
        resultado: expenseData || {},
        wa_message_id: wa_message_id,
        mensaje_origen: 'whatsapp',
        original_timestamp: now
      });
      
      cached = isCached;
      prediction = pred;
      
      if (requireConfirmation && !cached) {
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 30);
        
        await supabase.from('pending_confirmations').insert({
          prediction_id: prediction.id,
          usuario_id: user.id,
          country_code: user.country_code || 'BOL',
          wa_message_id: wa_message_id || null,
          expires_at: expiresAt.toISOString()
        });
        
        logger.debug('⏳ Confirmación pendiente creada (30 min)');
        pendingCount = 1;
      }
    }
    
    // 8. Construir preview según tipo
    const processedType = messageType === 'audio' ? 'AUDIO' : 'TEXTO';
    const countryCode = user.country_code || 'BOL';
    let previewMessage: string;
    
    if (groqResult?.esMultiple && groqResult.transacciones.length > 1) {
      // Preview MÚLTIPLE - pasar count de pendientes previas y country_code
      previewMessage = construirPreviewMultiple(
        groqResult.transacciones, 
        processedType,
        previousPendingCount || 0,
        countryCode
      );
    } else {
      // Preview SIMPLE - pasar country_code
      previewMessage = construirPreviewSimple(expenseData, processedType, countryCode);
    }

    logger.debug('📤 Preview message generado');

    // 9. Enviar mensaje de preview al usuario
    try {
      const sendResult = await sendWhatsAppMessage(rawPhoneNumber, previewMessage);
      
      if (!sendResult.success) {
        logger.error('❌ Error enviando mensaje de preview:', sendResult.error);
        
        // Si el error es de token expirado, intentar informar al usuario (si el token aún funciona momentáneamente)
        if (sendResult.error?.includes('expired') || sendResult.error?.includes('expiró')) {
          logger.error('💡 SOLUCIÓN: El token de WhatsApp ha expirado. Necesitas regenerar el token.');
          // No intentamos enviar otro mensaje porque el token ya expiró
        }
      } else {
        logger.debug('✅ Mensaje de preview enviado al usuario');
      }
    } catch (error: any) {
      logger.error('❌ Error enviando mensaje de preview:', error);
      // No fallar el webhook si falla el envío del mensaje
    }

    return NextResponse.json({
      success: true,
      cached,
      prediction_id: prediction?.id,
      transcription,
      expense_data: expenseData,
      processing_time_ms: Date.now() - startTime,
      preview_message: previewMessage,
      pending_confirmations: pendingCount
    });

  } catch (error: any) {
    logger.error('❌ Error en processTranscription:', error);
    throw error;
  }
}

