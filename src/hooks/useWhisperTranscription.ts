"use client";

import { useState, useCallback } from 'react';
import { getWhisperService, WhisperTranscriptionResponse } from '@/services/whisperService';
import { logger } from '@/lib/logger';

export interface TranscriptionState {
  isTranscribing: boolean;
  text: string;
  error: string | null;
  isComplete: boolean;
}

export const useWhisperTranscription = () => {
  const [state, setState] = useState<TranscriptionState>({
    isTranscribing: false,
    text: '',
    error: null,
    isComplete: false
  });

  const whisperService = getWhisperService();

  /**
   * Transcribe audio usando Whisper
   */
  const transcribeAudio = useCallback(async (audioBlob: Blob): Promise<string> => {
    try {
      setState(prev => ({
        ...prev,
        isTranscribing: true,
        error: null,
        text: '',
        isComplete: false
      }));

      logger.debug('🎤 Iniciando transcripción...', {
        size: audioBlob.size,
        type: audioBlob.type
      });

      // Validar configuración
      if (!whisperService.validateConfig()) {
        throw new Error('API Key de OpenAI no configurada. Revisa las instrucciones en la consola.');
      }

      // Transcribir audio
      const result: WhisperTranscriptionResponse = await whisperService.transcribeAudio(audioBlob);

      setState(prev => ({
        ...prev,
        isTranscribing: false,
        text: result.text,
        isComplete: true,
        error: null
      }));

      logger.debug('✅ Transcripción exitosa:', result.text);
      return result.text;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido en transcripción';
      
      setState(prev => ({
        ...prev,
        isTranscribing: false,
        error: errorMessage,
        isComplete: false
      }));

      logger.error('❌ Error en transcripción:', error);
      throw error;
    }
  }, [whisperService]);

  /**
   * Limpiar estado de transcripción
   */
  const clearTranscription = useCallback(() => {
    setState({
      isTranscribing: false,
      text: '',
      error: null,
      isComplete: false
    });
  }, []);

  /**
   * Resetear solo el error
   */
  const clearError = useCallback(() => {
    setState(prev => ({
      ...prev,
      error: null
    }));
  }, []);

  return {
    state,
    transcribeAudio,
    clearTranscription,
    clearError,
    isTranscribing: state.isTranscribing,
    transcriptionText: state.text,
    hasError: !!state.error,
    isComplete: state.isComplete
  };
};
