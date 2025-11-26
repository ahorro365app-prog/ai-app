import dotenv from 'dotenv';
import { WhatsAppService } from './services/whatsapp';
import { IWhatsAppMessage } from './types';
import axios from 'axios';
import { webcrypto } from 'crypto';
import { proto } from '@whiskeysockets/baileys';

dotenv.config();

// Hacer crypto disponible globalmente para Baileys (solo en Node.js < 20)
if (typeof globalThis.crypto === 'undefined') {
  (globalThis as any).crypto = webcrypto as any;
}

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';
const BACKEND_API_KEY = process.env.BACKEND_API_KEY || '';
const WHATSAPP_NUMBER = process.env.WHATSAPP_NUMBER || '';

const whatsapp = new WhatsAppService();

// Iniciar servidor PRIMERO
import './server';

// Función para detectar confirmaciones
function isConfirmation(text: string): boolean {
  if (!text) return false;
  const normalized = text.toLowerCase().trim();
  const confirmations = ['sí', 'si', 'yes', 'ok', 'okay', 'perfecto', 'está bien', 'esta bien', 'correcto', 'confirmado'];
  return confirmations.includes(normalized);
}

// Procesar mensajes entrantes
whatsapp.onMessage(async (message: IWhatsAppMessage) => {
  console.log('📨 Mensaje recibido:', {
    from: message.from,
    type: message.type,
    message: message.message,
    timestamp: new Date(message.timestamp)
  });

  // 1. Verificar si es una confirmación (después de enviar preview)
  if (message.type === 'text' && isConfirmation(message.message)) {
    console.log('✅ Mensaje de confirmación detectado:', message.message);

    try {
      // Llamar al endpoint de confirmación
      // El backend obtendrá la transacción pendiente más reciente desde la BD
      const response = await axios.post(
        `${BACKEND_URL}/api/webhooks/whatsapp/confirm`,
        {
          phone_number: message.from,
          message: message.message
        },
        {
          headers: {
            'Authorization': `Bearer ${BACKEND_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        await whatsapp.sendMessage(message.from, '✅ Transacción confirmada y guardada exitosamente! 🎉');
        console.log('✅ Confirmación registrada exitosamente');
      } else {
        await whatsapp.sendMessage(message.from, response.data.message || '❌ No hay ninguna transacción pendiente para confirmar');
      }
    } catch (error: any) {
      console.error('❌ Error registrando confirmación:', error);
      const errorMessage = error.response?.data?.message || error.message;
      await whatsapp.sendMessage(message.from, errorMessage || '❌ Error al confirmar transacción. Ya está guardada automáticamente.');
    }
    
    return; // No procesar más
  }

  // 2. Si es audio o texto, enviar al backend para procesar (SOLO si BACKEND_URL está configurado)
  if ((message.type === 'audio' || message.type === 'text') && BACKEND_URL && BACKEND_URL !== 'http://localhost:3000') {
    try {
      console.log(`🔗 Enviando ${message.type} a backend: ${BACKEND_URL}`);
      
      // Preparar payload según el tipo de mensaje
      let payload: any = {
          from: message.from,
        type: message.type,
          timestamp: message.timestamp,
          wa_message_id: (message as any).messageId
      };

      if (message.type === 'audio') {
        // Convertir buffer a base64 para audio
        const audioBuffer = (message as any).audioBuffer;
        payload.audioBase64 = audioBuffer ? audioBuffer.toString('base64') : null;
        // Incluir duración del audio si está disponible (para validación en backend)
        payload.audioDurationSeconds = (message as any).audioDurationSeconds || null;
      } else if (message.type === 'text') {
        // Enviar texto directamente
        payload.text = message.message || '';
      }
      
      const response = await axios.post(
        `${BACKEND_URL}/api/webhooks/baileys`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${BACKEND_API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: message.type === 'audio' ? 30000 : 15000 // Timeout más corto para texto (sin transcripción)
        }
      );

      console.log('✅ Backend procesó mensaje:', response.data);

      // Manejar respuesta según el caso
      if (!response.data.success) {
        // Manejar diferentes tipos de errores
        if (response.data.error === 'user_not_registered') {
          // Usuario no registrado - verificar si debe enviar mensaje (rate limiting)
          const shouldSendInvitation = response.data.should_send_invitation !== false; // Default true si no viene el flag
          
          if (shouldSendInvitation) {
            // Enviar mensaje de registro solo si el rate limit lo permite
            console.log('👤 Usuario no registrado, enviando mensaje de invitación...');
            await whatsapp.sendMessage(
              message.from,
              '¡Hola! 👋 Parece que aún no tienes una cuenta en Ahorro365.\n\n¿Quieres que te enviemos la app y poder registrarte? 😊'
            );
            console.log('✅ Mensaje de registro enviado al usuario');
          } else {
            // Rate limit: Ya se envió mensaje recientemente, no enviar de nuevo
            console.log('⏸️ Rate limit activo: Ya se envió mensaje de invitación recientemente (últimas 24h)');
            console.log('💡 Ignorando para evitar spam');
          }
        } else if (response.data.error === 'AUDIO_DURATION_EXCEEDED' || response.data.error === 'TEXT_LENGTH_EXCEEDED') {
          // Error de validación: enviar mensaje de error al usuario
          const errorMessage = response.data.message || 'El mensaje excede los límites permitidos.';
          console.log(`⚠️ Validación fallida (${response.data.error}):`, errorMessage);
          await whatsapp.sendMessage(message.from, `❌ ${errorMessage}`);
          console.log('✅ Mensaje de error enviado al usuario');
        } else {
          // Otro tipo de error: enviar mensaje genérico
          const errorMessage = response.data.message || 'Hubo un error procesando tu mensaje. Por favor intenta más tarde.';
          console.log(`❌ Error del backend (${response.data.error}):`, errorMessage);
          await whatsapp.sendMessage(message.from, `❌ ${errorMessage}`);
          console.log('✅ Mensaje de error enviado al usuario');
        }
      } else if (response.data.success) {
        // Usuario registrado y mensaje procesado correctamente
        // Usar preview_message del backend (ya construido)
        const previewMessage = response.data.preview_message || 'Mensaje procesado correctamente';
        
        await whatsapp.sendMessage(message.from, previewMessage);
        console.log('✅ Preview enviado al usuario');
      }
    } catch (error: any) {
      console.error('❌ Error procesando mensaje en backend:', {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status,
        url: `${BACKEND_URL}/api/webhooks/baileys`,
        type: message.type
      });
      
      // Si el backend no está disponible o hay error de conexión, informar al usuario
      if (error?.code === 'ECONNREFUSED' || error?.code === 'ETIMEDOUT' || error?.response?.status >= 500) {
        console.error('⚠️ Backend no disponible, no se envió mensaje de error al usuario');
        // No enviar mensaje de error si el backend está caído
      } else {
        // Enviar mensaje de error al usuario solo si es un error del backend
      await whatsapp.sendMessage(
        message.from,
        '❌ Hubo un error procesando tu mensaje. Por favor intenta más tarde.'
      );
    }
    }
  } else if (message.type === 'audio' || message.type === 'text') {
    // Sin backend, solo confirmar recepción
    console.log('⚠️ Backend no configurado, solo almacenando mensaje');
    await whatsapp.sendMessage(
      message.from,
      '✅ Mensaje recibido (backend desconectado)'
    );
  }
});

// Conectar a WhatsApp
async function start() {
  try {
    console.log('🚀 Iniciando Baileys Worker...');
    console.log(`📱 Número: ${WHATSAPP_NUMBER}`);
    console.log(`🔗 Backend: ${BACKEND_URL}`);
    console.log(`🌍 Environment: ${process.env.RAILWAY_ENVIRONMENT || 'local'}`);
    console.log(`🔧 PORT: ${process.env.PORT || '3003'}`);
    console.log(`📁 BAILEYS_SESSION_PATH: ${process.env.BAILEYS_SESSION_PATH || '/app/auth_info'}`);
    console.log(`⏳ Esperando 2 segundos para que el servidor se inicialice...`);
    
    // Esperar un poco para que el servidor se inicie
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('🔄 Llamando a whatsapp.connect()...');
    await whatsapp.connect();
    console.log('✅ WhatsApp.connect() completado');
    
    console.log('✅ Baileys Worker iniciado correctamente');
  } catch (error) {
    console.error('❌ Error iniciando Baileys Worker:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    process.exit(1);
  }
}

// Manejo de errores no capturados
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

// Iniciar
start();
