import makeWASocket, { DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import QRCode from 'qrcode';
import pino from 'pino';
import axios from 'axios';
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
  private backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
  private whatsappNumber = process.env.WHATSAPP_NUMBER || '';
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor() {
    // Start watcher to update lastSync every minute
    setInterval(() => {
      if (this.connectionStatus.connected) {
        this.connectionStatus.lastSync = new Date().toISOString();
        this.connectionStatus.uptime = 99.8; // Simulated uptime
        this.updateSessionInDatabase();
      }
    }, 60000);
  }

  // Actualizar sesión en Supabase
  private async updateSessionInDatabase() {
    try {
      const adminDashboardUrl = process.env.QR_POLLING_URL || 'http://localhost:3001';
      
      console.log('🔄 Actualizando sesión en Supabase...');
      console.log('📱 Número:', this.whatsappNumber);
      console.log('🔗 URL:', `${adminDashboardUrl}/api/whatsapp/update-session`);
      
      const response = await axios.post(`${adminDashboardUrl}/api/whatsapp/update-session`, {
        number: this.whatsappNumber,
        status: this.connectionStatus.connected ? 'connected' : 'disconnected',
        lastSync: this.connectionStatus.lastSync,
        uptime: this.connectionStatus.uptime
      });
      
      console.log('✅ Sesión actualizada:', response.data);
    } catch (error: any) {
      console.error('❌ Error updating session in database:', error.message);
      console.error('📋 URL intentada:', `${process.env.QR_POLLING_URL || 'http://localhost:3001'}/api/whatsapp/update-session`);
    }
  }

  // Conectar a WhatsApp
  public async connect(): Promise<void> {
    try {
      // Si la variable FORCE_NEW_SESSION existe, eliminar auth_info
      if (process.env.FORCE_NEW_SESSION === 'true') {
        const authInfoPath = path.join(process.cwd(), 'auth_info');
        if (fs.existsSync(authInfoPath)) {
          fs.rmSync(authInfoPath, { recursive: true, force: true });
          console.log('🗑️  auth_info eliminado (FORCE_NEW_SESSION=true)');
        }
      }
      
      const { state, saveCreds } = await useMultiFileAuthState('auth_info');
      const { version, isLatest } = await fetchLatestBaileysVersion();

      console.log(`Using WhatsApp version: ${version.join('.')} - Latest: ${isLatest}`);

      // Configuración para Railway (headless browser)
      const isRailway = process.env.RAILWAY_ENVIRONMENT === 'production' || process.env.PORT;
      
      this.socket = makeWASocket({
        version,
        printQRInTerminal: true,
        logger: pino({ level: 'silent' }),
        auth: state,
        generateHighQualityLinkPreview: true,
        markOnlineOnConnect: true,
        browser: ['Ahorro365 Baileys Worker', 'Chrome', '1.0.0'],
        shouldSyncHistoryMessage: () => true,
        // Headless para Railway
        ...(isRailway && {
          browser: ['Ahorro365', 'Chrome', '108.0.5359.71'],
          connectTimeoutMs: 60000,
        }),
      });

      // Manejar evento de credenciales
      this.socket.ev.on('creds.update', saveCreds);

      // Evento QR dedicado
      this.socket.ev.on('qr', (qr) => {
        console.log('🔴 QR EMITIDO POR BAILEYS:', qr);
      });

      // Manejar eventos de conexión
      this.socket.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr, isNewLogin } = update;
        
        console.log('📡 Evento de conexión:', {
          connection,
          isNewLogin,
          qr: qr ? 'Generando...' : null
        });

        if (update.qr) {
          console.log('🟢 QR EN CONNECTION.UPDATE:', update.qr);
        }

        if (qr) {
          console.log('🟡 QR Code generado en connection.update, esperando escaneo...');
          const qrImage = await QRCode.toDataURL(qr);
          const qrData = {
            qr: qrImage,
            timestamp: Date.now()
          };
          this.qrManager.saveQR(qrData);
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
            this.updateSessionInDatabase();
            
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
            console.error('❌ Máximo de intentos de reconexión alcanzado. Reinicia el worker manualmente.');
            this.connectionStatus.connected = false;
            setConnectionStatus(false);
            this.updateSessionInDatabase();
          } else {
            console.log('❌ Sesión inválida o cerrada manualmente');
            console.log('🔄 Limpiando sesión y generando nuevo QR...');
            this.connectionStatus.connected = false;
            this.qrManager.clearQR();
            setConnectionStatus(false);
            this.updateSessionInDatabase();
            
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
          this.updateSessionInDatabase();
          this.reconnectAttempts = 0; // Resetear contador de reconexiones
        }
      });

      // Manejar mensajes entrantes
      this.socket.ev.on('messages.upsert', async ({ messages, type }) => {
        for (const msg of messages) {
          if (msg.key.fromMe) continue;

          const messageData: IWhatsAppMessage = {
            from: msg.key.remoteJid || '',
            message: msg.message?.conversation || '',
            timestamp: msg.messageTimestamp ? Number(msg.messageTimestamp) * 1000 : Date.now(),
            type: msg.message?.audioMessage ? 'audio' : 
                  msg.message?.imageMessage ? 'image' : 'text',
            data: msg.message
          };

          if (this.onMessageCallback) {
            this.onMessageCallback(messageData);
          }
        }
      });

      console.log('WhatsApp socket inicializado');
    } catch (error) {
      console.error('Error connecting to WhatsApp:', error);
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
      console.error('Error sending message:', error);
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

