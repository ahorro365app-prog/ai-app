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
      
      // Determinar el nombre de archivo y tipo MIME correcto según el tipo del Blob
      let fileName = 'recording.webm';
      let mimeType = audioBlob.type;
      
      // Normalizar el tipo MIME (remover codecs y parámetros adicionales)
      if (audioBlob.type.includes('webm')) {
        fileName = 'recording.webm';
        mimeType = 'audio/webm'; // Whisper requiere 'audio/webm' sin codecs
      } else if (audioBlob.type.includes('ogg') || audioBlob.type.includes('oga')) {
        fileName = 'recording.ogg';
        mimeType = 'audio/ogg';
      } else if (audioBlob.type.includes('wav')) {
        fileName = 'recording.wav';
        mimeType = 'audio/wav';
      } else if (audioBlob.type.includes('mp4') || audioBlob.type.includes('m4a')) {
        fileName = 'recording.m4a';
        mimeType = 'audio/mp4';
      } else if (audioBlob.type.includes('mp3') || audioBlob.type.includes('mpeg')) {
        fileName = 'recording.mp3';
        mimeType = 'audio/mpeg';
      } else if (!audioBlob.type || audioBlob.type === 'application/octet-stream') {
        // Si no hay tipo o es genérico, asumir webm (formato más común del navegador)
        console.warn('⚠️ Tipo de archivo no especificado o genérico, usando webm por defecto');
        fileName = 'recording.webm';
        mimeType = 'audio/webm';
      } else {
        // Intentar extraer el tipo base
        const baseType = audioBlob.type.split(';')[0].trim();
        if (baseType.startsWith('audio/')) {
          mimeType = baseType;
          // Determinar extensión basada en el tipo
          if (baseType.includes('webm')) {
            fileName = 'recording.webm';
          } else if (baseType.includes('ogg')) {
            fileName = 'recording.ogg';
          } else if (baseType.includes('wav')) {
            fileName = 'recording.wav';
          } else if (baseType.includes('mp4') || baseType.includes('m4a')) {
            fileName = 'recording.m4a';
            mimeType = 'audio/mp4';
          } else {
            fileName = 'recording.webm';
            mimeType = 'audio/webm';
          }
        } else {
          console.warn('⚠️ Tipo de archivo no reconocido, usando webm por defecto:', audioBlob.type);
          fileName = 'recording.webm';
          mimeType = 'audio/webm';
        }
      }

      console.log('📋 Formato final:', { fileName, mimeType, originalType: audioBlob.type });

      // Crear un nuevo Blob con el tipo MIME correcto (siempre crear uno nuevo para asegurar consistencia)
      const finalBlob = new Blob([audioBlob], { type: mimeType });
      
      console.log('📦 Blob final creado:', {
        size: finalBlob.size,
        type: finalBlob.type
      });

      const formData = new FormData();
      // Crear un File con el nombre y tipo correctos
      const audioFile = new File([finalBlob], fileName, { 
        type: mimeType,
        lastModified: Date.now()
      });
      
      console.log('📁 File creado:', {
        name: audioFile.name,
        type: audioFile.type,
        size: audioFile.size
      });
      
      formData.append('file', audioFile);
      formData.append('model', this.config.model!);
      formData.append('language', this.config.language!);
      formData.append('temperature', this.config.temperature!.toString());
      formData.append('response_format', this.config.responseFormat!);

      console.log('📤 Enviando request a Whisper API...');
      
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: { message: errorText || response.statusText } };
        }
        
        console.error('❌ Error de Whisper API:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData.error,
          fileName,
          mimeType,
          fileSize: audioFile.size
        });
        
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
