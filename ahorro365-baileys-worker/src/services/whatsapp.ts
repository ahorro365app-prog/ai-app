import makeWASocket, { DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import QRCode from 'qrcode';
import pino from 'pino';
import { QRManager } from './qr-manager';
import { IConnectionStatus, IWhatsAppMessage } from '../types';

export class WhatsAppService {
  private socket: ReturnType<typeof makeWASocket> | null = null;
  private qrManager = QRManager.getInstance();
  private onMessageCallback?: (message: IWhatsAppMessage) => void;
  private connectionStatus: IConnectionStatus = {
    connected: false,
    lastSync: null,
    uptime: 0
  };

  constructor() {
    // Start watcher to update lastSync every minute
    setInterval(() => {
      if (this.connectionStatus.connected) {
        this.connectionStatus.lastSync = new Date().toISOString();
        this.connectionStatus.uptime = 99.8; // Simulated uptime
      }
    }, 60000);
  }

  // Conectar a WhatsApp
  public async connect(): Promise<void> {
    try {
      const { state, saveCreds } = await useMultiFileAuthState('auth_info');
      const { version, isLatest } = await fetchLatestBaileysVersion();

      console.log(`Using WhatsApp version: ${version.join('.')} - Latest: ${isLatest}`);

      this.socket = makeWASocket({
        version,
        printQRInTerminal: true,
        logger: pino({ level: 'silent' }),
        auth: state,
        generateHighQualityLinkPreview: true,
        markOnlineOnConnect: true,
      });

      // Manejar evento de credenciales
      this.socket.ev.on('creds.update', saveCreds);

      // Manejar eventos de conexión
      this.socket.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          console.log('QR Code generado, esperando escaneo...');
          const qrImage = await QRCode.toDataURL(qr);
          const qrData = {
            qr: qrImage,
            timestamp: Date.now()
          };
          this.qrManager.saveQR(qrData);
        }

        if (connection === 'close') {
          const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;

          if (shouldReconnect) {
            console.log('Reconectando...');
            await this.connect();
          } else {
            console.log('Sesión cerrada, necesitas escanear QR nuevamente');
            this.connectionStatus.connected = false;
            this.qrManager.clearQR();
          }
        } else if (connection === 'open') {
          console.log('✅ Conectado a WhatsApp!');
          this.connectionStatus.connected = true;
          this.connectionStatus.lastSync = new Date().toISOString();
          this.connectionStatus.uptime = 99.8;
          this.qrManager.clearQR();
        }
      });

      // Manejar mensajes entrantes
      this.socket.ev.on('messages.upsert', async ({ messages, type }) => {
        for (const msg of messages) {
          if (msg.key.fromMe) continue;

          const messageData: IWhatsAppMessage = {
            from: msg.key.remoteJid || '',
            message: msg.message?.conversation || '',
            timestamp: msg.messageTimestamp ? msg.messageTimestamp * 1000 : Date.now(),
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

