export interface IQRData {
  qr: string | null; // Base64 QR code
  timestamp: number;
}

export interface IConnectionStatus {
  connected: boolean;
  lastSync: string | null;
  uptime: number;
}

export interface IWhatsAppMessage {
  from: string;
  message: string;
  timestamp: number;
  type: 'text' | 'audio' | 'image';
  data?: any;
  messageId?: string;
}

export interface IUserMessage {
  phone: string;
  message: string;
  timestamp: number;
}

export interface IProcessingResult {
  success: boolean;
  message?: string;
  error?: string;
  data?: any;
}

