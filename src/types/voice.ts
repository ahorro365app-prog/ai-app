// Tipos para la funcionalidad de grabación de voz

export interface VoiceRecordingState {
  isRecording: boolean;
  isProcessing: boolean;
  duration: number;
  audioBlob: Blob | null;
  error: string | null;
}

export interface VoiceTranscription {
  text: string;
  confidence: number;
  language: string;
  duration: number;
}

export interface VoiceProcessedData {
  tipo: 'gasto' | 'ingreso';
  monto: number;
  detalle: string;
  categoria: string;
  tipo_pago: 'efectivo' | 'tarjeta' | 'qr';
  confianza: number;
  texto_original: string;
  timestamp: string;
}

export interface VoiceConfirmationData {
  hora: string;
  categoria: string;
  tipo_pago: 'efectivo' | 'tarjeta' | 'qr';
  descripcion: string;
  monto: number;
  confianza: number;
}

export interface N8NWebhookPayload {
  texto: string;
  usuario_id: string;
  timestamp: string;
  duracion: number;
}

export interface N8NWebhookResponse {
  success: boolean;
  data?: VoiceProcessedData;
  error?: string;
}

// Estados del botón de micrófono
export type MicButtonState = 'idle' | 'recording' | 'processing' | 'error';

// Configuración de grabación
export interface RecordingConfig {
  sampleRate: number;
  echoCancellation: boolean;
  noiseSuppression: boolean;
  mimeType: string;
  chunkSize: number;
}
