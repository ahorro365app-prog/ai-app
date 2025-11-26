/**
 * Servicio para enviar mensajes por WhatsApp Cloud API
 * Usa Graph API de Meta
 * 
 * Requiere:
 * - WHATSAPP_ACCESS_TOKEN
 * - WHATSAPP_PHONE_NUMBER_ID
 */

import { logger } from './logger';

const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || process.env.META_WHATSAPP_TOKEN;
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const WHATSAPP_API_VERSION = process.env.WHATSAPP_API_VERSION || 'v24.0';

/**
 * Envía un mensaje de texto por WhatsApp Cloud API
 * @param to - Número de teléfono del destinatario (formato: 59176990076, sin +)
 * @param message - Texto del mensaje a enviar
 */
export async function sendWhatsAppMessage(
  to: string,
  message: string
): Promise<{ success: boolean; message_id?: string; error?: string; errorCode?: number; errorType?: string }> {
  if (!WHATSAPP_ACCESS_TOKEN) {
    logger.error('❌ WHATSAPP_ACCESS_TOKEN no está configurado');
    return { success: false, error: 'WhatsApp access token not configured' };
  }

  if (!WHATSAPP_PHONE_NUMBER_ID) {
    logger.error('❌ WHATSAPP_PHONE_NUMBER_ID no está configurado');
    return { success: false, error: 'WhatsApp phone number ID not configured' };
  }

  // Normalizar número de teléfono (remover + si existe)
  const phoneNumber = to.startsWith('+') ? to.substring(1) : to;

  const url = `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${WHATSAPP_PHONE_NUMBER_ID}/messages`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 segundos timeout

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: phoneNumber,
        type: 'text',
        text: {
          body: message
        }
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const data = await response.json();
    
    // Logging detallado de la respuesta
    logger.debug('📥 Respuesta de WhatsApp API:', {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      hasMessages: !!data.messages,
      messageId: data.messages?.[0]?.id,
      fullResponse: JSON.stringify(data).substring(0, 200)
    });

    if (!response.ok) {
      const errorMessage = data.error?.message || `HTTP ${response.status}`;
      const errorCode = data.error?.code;
      const errorType = data.error?.type;
      const errorSubcode = data.error?.error_subcode;
      
      logger.error('❌ Error enviando mensaje WhatsApp:', {
        status: response.status,
        statusText: response.statusText,
        errorCode,
        errorType,
        errorSubcode,
        errorMessage,
        errorFull: data.error,
        phoneNumber: phoneNumber.substring(0, 5) + '...',
        phoneLength: phoneNumber.length
      });
      
      // Si es un error 401 (token expirado), dar instrucciones específicas
      if (response.status === 401) {
        const isExpired = errorMessage.includes('expired') || errorMessage.includes('expiró') || 
                         errorMessage.includes('Session has expired') ||
                         errorCode === 190;
        
        if (isExpired) {
          logger.error('💡 SOLUCIÓN: El token de WhatsApp ha expirado.');
          logger.error('   Necesitas regenerar el token en Meta Developer Console o usar un token permanente.');
        }
      }
      
      // Si es un error de número inválido
      if (errorCode === 131047 || errorMessage.includes('invalid') || errorMessage.includes('Invalid')) {
        logger.error('💡 El número de teléfono puede ser inválido o no estar registrado en WhatsApp Business.');
        logger.error(`   Número intentado: ${phoneNumber.substring(0, 5)}... (longitud: ${phoneNumber.length})`);
      }
      
      return { 
        success: false, 
        error: errorMessage,
        errorCode,
        errorType
      };
    }

    // Verificar que realmente hay un message_id
    const messageId = data.messages?.[0]?.id;
    if (!messageId) {
      logger.warn('⚠️ WhatsApp API retornó OK pero sin message_id:', {
        data: JSON.stringify(data).substring(0, 200),
        phoneNumber: phoneNumber.substring(0, 5) + '...'
      });
      return {
        success: false,
        error: 'WhatsApp API retornó éxito pero sin message_id. El mensaje puede no haberse enviado.',
        errorCode: 'NO_MESSAGE_ID'
      };
    }

    logger.debug('✅ Mensaje WhatsApp enviado:', {
      to: phoneNumber.substring(0, 5) + '...',
      phoneLength: phoneNumber.length,
      message_id: messageId
    });

    return {
      success: true,
      message_id: messageId
    };

  } catch (error: any) {
    if (error.name === 'AbortError') {
      logger.error(`❌ Request timeout (8s): ${url.substring(0, 50)}...`);
      return {
        success: false,
        error: 'Request timeout después de 8s'
      };
    }
    
    logger.error('❌ Error en sendWhatsAppMessage:', error);
    return {
      success: false,
      error: error.message || 'Unknown error'
    };
  }
}

