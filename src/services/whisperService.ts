// Servicio para comunicación con Whisper API de OpenAI

export interface WhisperTranscriptionResponse {
  text: string;
  language?: string;
  duration?: number;
}

export interface WhisperConfig {
  apiKey: string;
  model?: string;
  language?: string;
  temperature?: number;
  responseFormat?: 'json' | 'text' | 'srt' | 'verbose_json' | 'vtt';
}

class WhisperService {
  private config: WhisperConfig;

  constructor(config: WhisperConfig) {
    this.config = {
      model: 'whisper-1',
      language: 'es', // Español por defecto
      temperature: 0.0,
      responseFormat: 'json',
      ...config
    };
  }

  /**
   * Transcribe audio usando Whisper API
   */
  async transcribeAudio(audioBlob: Blob): Promise<WhisperTranscriptionResponse> {
    try {
      console.log('🎤 Enviando audio a Whisper API...', {
        size: audioBlob.size,
        type: audioBlob.type
      });

      // Verificar el archivo antes de enviarlo
      if (audioBlob.size === 0) {
        throw new Error('Archivo de audio vacío');
      }
      
      if (!audioBlob.type.includes('webm') && !audioBlob.type.includes('audio')) {
        console.warn('⚠️ Tipo de archivo inesperado:', audioBlob.type);
      }

      const formData = new FormData();
      formData.append('file', audioBlob, 'recording.webm');
      formData.append('model', this.config.model!);
      formData.append('language', this.config.language!);
      formData.append('temperature', this.config.temperature!.toString());
      formData.append('response_format', this.config.responseFormat!);

      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Whisper API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
      }

      const result = await response.json();
      
      console.log('✅ Transcripción completada:', result);

      return {
        text: result.text || '',
        language: result.language,
        duration: result.duration
      };

    } catch (error) {
      console.error('❌ Error en transcripción Whisper:', error);
      throw error;
    }
  }

  /**
   * Valida la configuración del servicio
   */
  validateConfig(): boolean {
    if (!this.config.apiKey || this.config.apiKey === 'your_openai_api_key_here') {
      console.error('❌ API Key de OpenAI no configurada');
      console.error('📝 Instrucciones:');
      console.error('   1. Ve a https://platform.openai.com/api-keys');
      console.error('   2. Crea una nueva API key');
      console.error('   3. Agrega NEXT_PUBLIC_OPENAI_API_KEY=tu_key_aqui a .env.local');
      console.error('   4. Reinicia el servidor (npm run dev)');
      return false;
    }
    console.log('✅ OpenAI API Key configurada correctamente');
    return true;
  }

  /**
   * Actualiza la configuración del servicio
   */
  updateConfig(newConfig: Partial<WhisperConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

// Instancia singleton del servicio
let whisperServiceInstance: WhisperService | null = null;

export const getWhisperService = (): WhisperService => {
  if (!whisperServiceInstance) {
    const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY || '';
    
    if (!apiKey) {
      console.warn('⚠️ OpenAI API Key no encontrada en variables de entorno');
    }

    whisperServiceInstance = new WhisperService({
      apiKey,
      language: 'es',
      model: 'whisper-1'
    });
  }
  
  return whisperServiceInstance;
};

export default WhisperService;
