import makeWASocket, { DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion, Browsers, downloadMediaMessage } from '@whiskeysockets/baileys';
import { proto } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import QRCode from 'qrcode';
import pino from 'pino';
import fs from 'fs';
import path from 'path';
import { QRManager } from './qr-manager';
import { IConnectionStatus, IWhatsAppMessage } from '../types';
import { setConnectionStatus } from '../server';

export class WhatsAppService {
  private socket: ReturnType<typeof makeWASocket> | null = null;
  private qrManager = QRManager.getInstance();
  private onMessageCallback?: (message: IWhatsAppMessage) => void;
  private connectionStatus: IConnectionStatus = {
    connected: false,
    lastSync: null,
    uptime: 0
  };
  private whatsappNumber = process.env.WHATSAPP_NUMBER || '';
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor() {
    // Actualizar timestamp cada minuto (sin intentar conectar a backend)
    setInterval(() => {
      if (this.connectionStatus.connected) {
        this.connectionStatus.lastSync = new Date().toISOString();
        this.connectionStatus.uptime = 99.8;
      }
    }, 60000);
  }

  // Conectar a WhatsApp
  public async connect(): Promise<void> {
    try {
      // Usar path según BAILEYS_SESSION_PATH o default local
      const sessionPath = process.env.BAILEYS_SESSION_PATH || path.join(process.cwd(), 'auth_info');
      
      console.log(`📁 Session path: ${sessionPath}`);
      
      // Si la variable FORCE_NEW_SESSION existe, eliminar auth_info
      if (process.env.FORCE_NEW_SESSION === 'true') {
        if (fs.existsSync(sessionPath)) {
          fs.rmSync(sessionPath, { recursive: true, force: true });
          console.log('🗑️  auth_info eliminado (FORCE_NEW_SESSION=true)');
        }
      }
      
      const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
      const { version, isLatest } = await fetchLatestBaileysVersion();

      console.log(`Using WhatsApp version: ${version.join('.')} - Latest: ${isLatest}`);

      this.socket = makeWASocket({
        version,
        printQRInTerminal: false,
        logger: pino({ level: 'silent' }), // Sin logs de Baileys
        auth: state,
        generateHighQualityLinkPreview: true,
        markOnlineOnConnect: false,
        browser: ['Ahorro365', 'Chrome', '121'],
        shouldSyncHistoryMessage: () => false,
        shouldIgnoreJid: () => false,
        retryRequestDelayMs: 10_000,
        qrTimeout: 60000,
        connectTimeoutMs: 60000,
        defaultQueryTimeoutMs: 60000,
      });

      // Manejar evento de credenciales
      this.socket.ev.on('creds.update', saveCreds);

      // Manejar eventos de conexión
      this.socket.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr, isNewLogin } = update;

        console.log('📡 Evento de conexión:', {
          connection,
          isNewLogin: isNewLogin || false,
          qr: qr ? 'QR Generado' : 'Sin QR'
        });

        // Manejo EXPLÍCITO del QR
        if (qr) {
          console.log('🎯 QR RECIBIDO - Generando imagen...');
          try {
          const qrImage = await QRCode.toDataURL(qr);
          const qrData = {
            qr: qrImage,
            timestamp: Date.now()
          };
          this.qrManager.saveQR(qrData);
            console.log('✅ QR guardado exitosamente');
          } catch (error) {
            console.error('❌ Error generando imagen QR:', error);
          }
        }

        if (connection === 'close') {
          const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
          const shouldReconnect = statusCode !== DisconnectReason.loggedOut 
                                  && statusCode !== DisconnectReason.badSession;
          
          console.log('⚠️  Conexión cerrada:', {
            statusCode,
            reason: DisconnectReason[statusCode] || 'unknown',
            shouldReconnect
          });

          if (shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`🔄 Intentando reconectar (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
            this.connectionStatus.connected = false;
            setConnectionStatus(false);
            
            // Esperar antes de reconectar
            setTimeout(async () => {
              try {
                console.log('🔄 Reconectando...');
            await this.connect();
              } catch (error) {
                console.error('❌ Error al reconectar:', error);
              }
            }, 5000);
          } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('❌ Máximo de intentos de reconexión alcanzado.');
            this.connectionStatus.connected = false;
            setConnectionStatus(false);
          } else {
            console.log('❌ Sesión inválida o cerrada manualmente');
            this.connectionStatus.connected = false;
            this.qrManager.clearQR();
            setConnectionStatus(false);
            
            // Intentar reconectar después de limpiar
            setTimeout(async () => {
              try {
                console.log('🔄 Reiniciando conexión...');
                await this.connect();
              } catch (error) {
                console.error('❌ Error al reiniciar:', error);
              }
            }, 3000);
          }
        } else if (connection === 'open') {
          console.log('✅ Conectado a WhatsApp!');
          this.connectionStatus.connected = true;
          this.connectionStatus.lastSync = new Date().toISOString();
          this.connectionStatus.uptime = 99.8;
          this.qrManager.clearQR();
          setConnectionStatus(true);
          this.reconnectAttempts = 0; // Resetear contador
        }
      });

      // Manejar mensajes entrantes
      this.socket.ev.on('messages.upsert', async ({ messages, type }) => {
        for (const msg of messages) {
          if (msg.key.fromMe) continue;

          const messageText = (
            msg.message?.conversation ||
            (msg.message as any)?.extendedTextMessage?.text ||
            ''
          );

          const messageData: IWhatsAppMessage = {
            from: msg.key.remoteJid || '',
            message: messageText,
            timestamp: msg.messageTimestamp ? Number(msg.messageTimestamp) * 1000 : Date.now(),
            type: msg.message?.audioMessage ? 'audio' : 
                  msg.message?.imageMessage ? 'image' : 'text',
          data: msg.message,
          messageId: msg.key.id || undefined
          };

          // Si es audio, descargar el buffer
          if (msg.message?.audioMessage && this.socket) {
            try {
              console.log('🎵 Descargando audio...');
              const buffer = await downloadMediaMessage(
                msg,
                'buffer',
                {},
                { reuploadRequest: this.socket.updateMediaMessage, logger: pino({ level: 'silent' }) }
              );
              
              // Agregar buffer a messageData
              (messageData as any).audioBuffer = buffer;
              console.log('✅ Audio descargado:', buffer.length, 'bytes');
            } catch (error) {
              console.error('❌ Error descargando audio:', error);
            }
          }

          if (this.onMessageCallback) {
            this.onMessageCallback(messageData);
          }
        }
      });

      console.log('✅ WhatsApp socket inicializado');
    } catch (error) {
      console.error('❌ Error connecting to WhatsApp:', error);
      throw error;
    }
  }

  // Enviar mensaje
  public async sendMessage(to: string, text: string): Promise<boolean> {
    if (!this.socket) {
      throw new Error('No conectado a WhatsApp');
    }

    try {
      await this.socket.sendMessage(to, { text });
      return true;
    } catch (error) {
      console.error('❌ Error sending message:', error);
      return false;
    }
  }

  // Obtener estado de conexión
  public getConnectionStatus(): IConnectionStatus {
    return { ...this.connectionStatus };
  }

  // Registrar callback para mensajes
  public onMessage(callback: (message: IWhatsAppMessage) => void): void {
    this.onMessageCallback = callback;
  }
}
