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
      
      // Convertir buffer a base64 para enviar
      const audioBuffer = (message as any).audioBuffer;
      const audioBase64 = audioBuffer ? audioBuffer.toString('base64') : null;
      
      const response = await axios.post(
        `${BACKEND_URL}/api/webhooks/baileys`,
        {
          audioBase64,
          from: message.from,
          type: 'audio',
          timestamp: message.timestamp
        },
        {
          headers: {
            'Authorization': `Bearer ${BACKEND_API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000 // Timeout de 30 segundos (transcripción puede tardar)
        }
      );

      console.log('✅ Backend procesó mensaje:', response.data);

      // Enviar confirmación al usuario
      if (response.data.success) {
        const amount = response.data.amount || response.data.expense_data?.monto;
        const currency = response.data.currency || response.data.expense_data?.moneda || 'BOB';
        const category = response.data.category || response.data.expense_data?.categoria;
        
        let confirmationMessage = '✅ Mensaje procesado correctamente';
        
        if (amount && amount > 0 && category) {
          confirmationMessage = `✅ Se agregó: ${amount} ${currency} - ${category}`;
        } else if (response.data.transcription) {
          confirmationMessage = `✅ Audio recibido: "${response.data.transcription}"`;
        }
        
        await whatsapp.sendMessage(message.from, confirmationMessage);
      }
    } catch (error: any) {
      console.error('❌ Error procesando mensaje en backend:', error?.response?.data || error?.message);
      
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
