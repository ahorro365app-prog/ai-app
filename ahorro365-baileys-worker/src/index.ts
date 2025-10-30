import dotenv from 'dotenv';
import { WhatsAppService } from './services/whatsapp';
import { IWhatsAppMessage } from './types';
import axios from 'axios';
import crypto from 'crypto';
import { webcrypto } from 'crypto';

// Hacer crypto disponible globalmente para Baileys
(global as any).crypto = webcrypto as any;

// Forzar nueva sesión en producción (Fly.io)
if (process.env.NODE_ENV === 'production' || process.env.PORT) {
  process.env.FORCE_NEW_SESSION = 'true';
}

dotenv.config();

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';
const BACKEND_API_KEY = process.env.BACKEND_API_KEY || '';
const WHATSAPP_NUMBER = process.env.WHATSAPP_NUMBER || '';

const whatsapp = new WhatsAppService();

// Iniciar servidor PRIMERO
import './server';

// Procesar mensajes entrantes
whatsapp.onMessage(async (message: IWhatsAppMessage) => {
  console.log('📨 Mensaje recibido:', {
    from: message.from,
    type: message.type,
    timestamp: new Date(message.timestamp)
  });

  // Si es audio, enviar al backend para procesar (SOLO si BACKEND_URL está configurado)
  if (message.type === 'audio' && BACKEND_URL && BACKEND_URL !== 'http://localhost:3000') {
    try {
      console.log(`🔗 Enviando audio a backend: ${BACKEND_URL}`);
      
      const response = await axios.post(
        `${BACKEND_URL}/api/webhooks/whatsapp`,
        {
          audio: message.data,
          from: message.from,
          type: 'audio',
          timestamp: message.timestamp
        },
        {
          headers: {
            'Authorization': `Bearer ${BACKEND_API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 5000 // Timeout de 5 segundos
        }
      );

      console.log('✅ Backend procesó mensaje:', response.data);

      // Enviar confirmación al usuario
      if (response.data.success) {
        await whatsapp.sendMessage(
          message.from,
          `✅ Se agregó: ${response.data.amount} ${response.data.currency} - ${response.data.category}`
        );
      }
    } catch (error) {
      console.error('❌ Error procesando mensaje en backend:', error);
      
      // Enviar mensaje de error al usuario
      await whatsapp.sendMessage(
        message.from,
        '❌ Hubo un error procesando tu mensaje. Por favor intenta más tarde.'
      );
    }
  } else if (message.type === 'audio') {
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
