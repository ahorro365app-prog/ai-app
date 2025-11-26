"use client";

import { useState, useCallback, useRef, useEffect } from 'react';
import { VoiceRecordingState, RecordingConfig, MicButtonState } from '@/types/voice';
import { useWhisperTranscription } from './useWhisperTranscription';
import { groqService } from '@/services/groqService';
import { useSupabase } from '@/contexts/SupabaseContext';
import { useVoice } from '@/contexts/VoiceContext';
import { getPlanLimits, validateCanCreateTransaction } from '@/lib/planLimits';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

const DEFAULT_CONFIG: RecordingConfig = {
  sampleRate: 44100,
  echoCancellation: true,
  noiseSuppression: true,
  mimeType: 'audio/webm;codecs=opus',
  chunkSize: 1000
};

export const useVoiceRecording = (config: Partial<RecordingConfig> = {}) => {
  const { addTransaction, user } = useSupabase();
  const { setVoiceData } = useVoice();
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  // Función para solicitar permisos de micrófono
  const requestMicrophonePermission = async (): Promise<boolean> => {
    try {
      // Verificar si el navegador soporta getUserMedia
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        logger.error('❌ Este navegador no soporta acceso al micrófono');
        return false;
      }

      // Solicitar permiso de micrófono
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
          latency: 0.01
        } 
      });
      
      // Detener el stream inmediatamente (solo necesitamos el permiso)
      stream.getTracks().forEach(track => track.stop());
      
      logger.debug('✅ Permiso de micrófono concedido');
      return true;
    } catch (error: any) {
      logger.error('❌ Error al solicitar permiso de micrófono:', error);
      
      // Mostrar mensaje específico según el tipo de error
      if (error.name === 'NotAllowedError') {
        logger.error('🚫 Usuario denegó el permiso de micrófono');
      } else if (error.name === 'NotFoundError') {
        logger.error('🎤 No se encontró ningún micrófono');
      } else if (error.name === 'NotSupportedError') {
        logger.error('🚫 El navegador no soporta acceso al micrófono');
      }
      
      return false;
    }
  };
  
  const [state, setState] = useState<VoiceRecordingState>({
    isRecording: false,
    isProcessing: false,
    duration: 0,
    audioBlob: null,
    error: null
  });

  // Estados para el modal de confirmación
  const [showModal, setShowModal] = useState(false);
  const [modalTranscriptionText, setModalTranscriptionText] = useState('');
  const [modalGroqData, setModalGroqData] = useState<any>(null);
  
  // Estados para el modal de error de fecha
  const [showDateErrorModal, setShowDateErrorModal] = useState(false);
  const [dateError, setDateError] = useState<{ message: string; daysDiff: number } | null>(null);
  
  // Estado para el modal de límite de duración de audio
  const [showDurationLimitModal, setShowDurationLimitModal] = useState(false);
  
  // Estado para el modal de límite diario de transacciones
  const [showDailyLimitModal, setShowDailyLimitModal] = useState(false);
  const [dailyLimitInfo, setDailyLimitInfo] = useState<{ currentCount: number; maxCount: number } | null>(null);

  const [isPressed, setIsPressed] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [isSwipeDetected, setIsSwipeDetected] = useState(false);

  // Hook de transcripción Whisper
  const {
    state: transcriptionState,
    transcribeAudio,
    clearTranscription,
    isTranscribing,
    transcriptionText,
    hasError: transcriptionError,
    isComplete: transcriptionComplete
  } = useWhisperTranscription();

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const pressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const userRef = useRef(user);
  const durationRef = useRef<number>(0); // Ref para guardar la duración antes de limpiar
  const stoppedByLimitRef = useRef<boolean>(false); // Ref para indicar si se detuvo por límite de duración
  const cancelledRef = useRef<boolean>(false); // Ref para indicar si la grabación fue cancelada
  
  // Actualizar ref cuando user cambia
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // Limpiar recursos
  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    mediaRecorderRef.current = null;
    chunksRef.current = [];
    setIsPressed(false);
    setIsSwipeDetected(false);
    // NO resetear cancelledRef aquí - se reseteará cuando sea seguro
  }, []);

  // Iniciar grabación
  const startRecording = useCallback(async () => {
    try {
      // Resetear bandera de cancelación al iniciar nueva grabación
      cancelledRef.current = false;
      setState(prev => ({ ...prev, error: null }));
      
      // Solicitar permisos de micrófono primero
      logger.debug('🎤 Iniciando grabación...');
      const hasPermission = await requestMicrophonePermission();
      logger.debug('✅ Permiso de micrófono:', hasPermission);
      
      if (!hasPermission) {
        logger.error('❌ Permiso denegado');
        setState(prev => ({ 
          ...prev, 
          error: 'Permiso de micrófono denegado. Por favor, permite el acceso al micrófono en la configuración de tu dispositivo.' 
        }));
        return;
      }
      
      logger.debug('🎤 Obteniendo stream de audio...');
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            sampleRate: finalConfig.sampleRate,
            echoCancellation: finalConfig.echoCancellation,
            noiseSuppression: finalConfig.noiseSuppression,
            autoGainControl: true,
            channelCount: 1,
            latency: 0.01
          }
        });
        logger.debug('✅ Stream obtenido exitosamente');
      } catch (streamError: any) {
        logger.error('❌ Error al obtener stream:', streamError);
        logger.error('❌ Error name:', streamError.name);
        logger.error('❌ Error message:', streamError.message);
        throw streamError; // Re-lanzar para que lo capture el catch externo
      }

      streamRef.current = stream;
      chunksRef.current = [];
      logger.debug('✅ Stream guardado en ref');

      logger.debug('🎤 Creando MediaRecorder...');
      logger.debug('📋 MIME type:', finalConfig.mimeType);
      
      let mediaRecorder: MediaRecorder;
      try {
        // Verificar si el MIME type es soportado
        if (!MediaRecorder.isTypeSupported(finalConfig.mimeType)) {
          logger.warn('⚠️ MIME type no soportado:', finalConfig.mimeType);
          // Intentar con un tipo alternativo
          const alternativeTypes = ['audio/webm', 'audio/mp4', 'audio/ogg', 'audio/wav'];
          let supportedType = alternativeTypes.find(type => MediaRecorder.isTypeSupported(type));
          if (!supportedType) {
            supportedType = ''; // Usar el tipo por defecto del navegador
          }
          logger.debug('🔄 Usando tipo alternativo:', supportedType);
          mediaRecorder = new MediaRecorder(stream, {
            mimeType: supportedType || undefined
          });
        } else {
          mediaRecorder = new MediaRecorder(stream, {
            mimeType: finalConfig.mimeType
          });
        }
        logger.debug('✅ MediaRecorder creado exitosamente');
      } catch (recorderError: any) {
        logger.error('❌ Error al crear MediaRecorder:', recorderError);
        logger.error('❌ Error name:', recorderError.name);
        logger.error('❌ Error message:', recorderError.message);
        // Detener el stream si hay error
        stream.getTracks().forEach(track => track.stop());
        throw recorderError; // Re-lanzar para que lo capture el catch externo
      }

      mediaRecorder.ondataavailable = (event) => {
        logger.debug('📦 ondataavailable:', { size: event.data.size });
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
          logger.debug('✅ Chunk agregado, total chunks:', chunksRef.current.length);
        }
      };

      mediaRecorder.onerror = (event: any) => {
        logger.error('❌ MediaRecorder.onerror:', event);
        logger.error('❌ Error name:', event?.error?.name);
        logger.error('❌ Error message:', event?.error?.message);
        setState(prev => ({
          ...prev,
          error: event?.error?.message || 'Error durante la grabación de audio',
          isRecording: false,
          isProcessing: false
        }));
        cleanup();
      };

      mediaRecorder.onstop = async () => {
        logger.debug('🛑 MediaRecorder.onstop llamado');
        logger.debug('📊 Total chunks:', chunksRef.current.length);
        logger.debug('⚠️ ¿Se detuvo por límite?', stoppedByLimitRef.current);
        logger.debug('⚠️ ¿Fue cancelada?', cancelledRef.current);
        
        // Verificar PRIMERO si fue cancelada (usar una copia del valor para evitar problemas de timing)
        const wasCancelled = cancelledRef.current;
        logger.debug('🔍 Verificando cancelación (valor capturado):', wasCancelled);
        
        // Si fue cancelada, no procesar el audio
        if (wasCancelled) {
          logger.debug('🚫 Grabación cancelada, no se procesará');
          chunksRef.current = []; // Limpiar chunks
          setState(prev => ({
            ...prev,
            isProcessing: false,
            isRecording: false,
            audioBlob: null
          }));
          // NO llamar a cleanup() aquí porque resetea isSwipeDetected
          // Limpiar recursos manualmente sin resetear isSwipeDetected
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
          }
          // NO resetear isSwipeDetected aquí - se reseteará después del timeout en cancelRecording
          return; // Salir sin procesar
        }
        
        // Si se detuvo por límite de duración, no procesar el audio
        if (stoppedByLimitRef.current) {
          logger.debug('🚫 Audio detenido por límite de duración, no se procesará');
          stoppedByLimitRef.current = false; // Resetear la bandera
          chunksRef.current = []; // Limpiar chunks
          cleanup();
          return; // Salir sin procesar
        }
        
        // Limpiar el timer primero
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        
        // Guardar la duración del timer desde el ref (más confiable que state.duration)
        const timerDuration = durationRef.current || state.duration;
        logger.debug('⏱️ Duración del timer guardada (desde ref):', timerDuration, 'segundos');
        logger.debug('⏱️ Duración del timer (desde state):', state.duration, 'segundos');
        
        // Obtener el tipo MIME real del MediaRecorder (más confiable que la configuración)
        const actualMimeType = mediaRecorderRef.current?.mimeType || finalConfig.mimeType;
        logger.debug('🎤 Tipo MIME del MediaRecorder:', actualMimeType);
        
        // Normalizar el tipo MIME para Whisper (remover codecs si están presentes)
        let normalizedMimeType = actualMimeType;
        if (normalizedMimeType.includes('webm')) {
          // Whisper espera 'audio/webm' sin codecs
          normalizedMimeType = 'audio/webm';
        } else if (normalizedMimeType.includes('ogg')) {
          normalizedMimeType = 'audio/ogg';
        } else if (normalizedMimeType.includes('wav')) {
          normalizedMimeType = 'audio/wav';
        } else if (normalizedMimeType.includes('mp4') || normalizedMimeType.includes('m4a')) {
          normalizedMimeType = 'audio/mp4';
        } else if (!normalizedMimeType || normalizedMimeType === '') {
          // Si no hay tipo, usar webm por defecto
          logger.warn('⚠️ No se pudo determinar el tipo MIME, usando webm por defecto');
          normalizedMimeType = 'audio/webm';
        }
        
        // Crear el Blob con el tipo normalizado
        const audioBlob = new Blob(chunksRef.current, { type: normalizedMimeType });
        logger.debug('📦 AudioBlob creado:', { 
          size: audioBlob.size, 
          type: audioBlob.type,
          originalMimeType: actualMimeType,
          normalizedMimeType,
          chunksCount: chunksRef.current.length,
          totalChunksSize: chunksRef.current.reduce((sum, chunk) => sum + chunk.size, 0)
        });
        
        // Validar que el Blob tenga contenido
        if (audioBlob.size === 0) {
          logger.error('❌ El Blob de audio está vacío');
          setState(prev => ({
            ...prev,
            isProcessing: false,
            error: 'El audio grabado está vacío. Por favor, intenta nuevamente.',
            duration: 0,
            audioBlob: null
          }));
          cleanup();
          return;
        }
        
        // Obtener duración real del audio desde el Blob
        let audioDurationSeconds = timerDuration; // Usar duración del timer como fallback inicial
        
        try {
          logger.debug('🔍 Calculando duración real del audio...');
          // Calcular duración real del audio desde el Blob
          const audioUrl = URL.createObjectURL(audioBlob);
          const audio = new Audio(audioUrl);
          
          await new Promise((resolve, reject) => {
            audio.onloadedmetadata = () => {
              const calculatedDuration = audio.duration;
              logger.debug('📊 Duración calculada del audio:', calculatedDuration, 'segundos');
              
              // Validar que la duración sea un número válido (no Infinity, no NaN)
              if (isFinite(calculatedDuration) && !isNaN(calculatedDuration) && calculatedDuration > 0) {
                audioDurationSeconds = Math.ceil(calculatedDuration);
                logger.debug('✅ Duración real calculada:', audioDurationSeconds, 'segundos');
              } else {
                logger.warn('⚠️ Duración inválida (Infinity/NaN), usando duración del timer:', timerDuration);
                audioDurationSeconds = timerDuration;
              }
              URL.revokeObjectURL(audioUrl);
              resolve(audioDurationSeconds);
            };
            audio.onerror = (err) => {
              logger.warn('⚠️ Error al cargar metadata del audio:', err);
              URL.revokeObjectURL(audioUrl);
              // Si falla, usar la duración del timer
              logger.debug('⚠️ Usando duración del timer como fallback:', timerDuration);
              audioDurationSeconds = timerDuration;
              resolve(audioDurationSeconds);
            };
            // Timeout de seguridad
            setTimeout(() => {
              logger.warn('⚠️ Timeout al calcular duración, usando duración del timer:', timerDuration);
              URL.revokeObjectURL(audioUrl);
              audioDurationSeconds = timerDuration;
              resolve(audioDurationSeconds);
            }, 1000);
          });
        } catch (error) {
          logger.warn('⚠️ No se pudo obtener duración del audio, usando duración del timer:', error);
          audioDurationSeconds = timerDuration;
        }
        
        // Validar duración de audio (15 segundos máximo)
        logger.debug('🔍 Validando duración del audio...');
        logger.debug('📊 Duración final a validar:', audioDurationSeconds, 'segundos');
        
        if (user) {
          const currentPlan = user.suscripcion || 'free';
          const limits = getPlanLimits(currentPlan);
          logger.debug('📊 Límite de duración para plan', currentPlan, ':', limits.maxAudioDurationSeconds, 'segundos');
          
          // Validar que la duración sea un número válido antes de comparar
          if (isFinite(audioDurationSeconds) && !isNaN(audioDurationSeconds) && limits.maxAudioDurationSeconds !== null && audioDurationSeconds > limits.maxAudioDurationSeconds) {
            logger.error('❌ Duración excedida:', audioDurationSeconds, '>', limits.maxAudioDurationSeconds);
            setState(prev => ({
              ...prev,
              isProcessing: false,
              error: `El audio no puede exceder ${limits.maxAudioDurationSeconds} segundos. Por favor, envía un audio más corto. (Duración: ${audioDurationSeconds}s)`,
              duration: 0,
              audioBlob: null
            }));
            cleanup();
            return;
          }
          logger.debug('✅ Duración válida');
        }
        
        // Procesar con Whisper en lugar de simulación
        try {
          logger.debug('🔄 Cambiando estado a isProcessing = true');
          setState(prev => ({
            ...prev,
            audioBlob,
            isProcessing: true
          }));
          
          logger.debug('🎤 Audio grabado, enviando a Whisper...', {
            size: audioBlob.size,
            duration: state.duration,
            audioDurationSeconds
          });
          
          // Transcribir con Whisper
          logger.debug('🎙️ Iniciando transcripción con Whisper...');
          const transcribedText = await transcribeAudio(audioBlob);
          logger.debug('✅ Transcripción completada:', transcribedText);
          
          // Validar que la transcripción no esté vacía o sea inválida
          if (!transcribedText || !transcribedText.trim() || transcribedText.trim().length === 0) {
            logger.error('❌ Transcripción vacía o inválida, no se procesará con Groq');
            setState(prev => ({
              ...prev,
              isProcessing: false,
              error: 'No se pudo transcribir el audio. Por favor, intenta nuevamente hablando más claro.',
              duration: 0,
              audioBlob: null
            }));
            cleanup();
            return;
          }
          
          // Validar que la transcripción no sea solo texto de fallback de Whisper
          const normalizedText = transcribedText.trim().toLowerCase();
          const isFallbackText = normalizedText.includes('subtítulos') || 
                                 normalizedText.includes('subtitulos') || 
                                 normalizedText.includes('realizados por') ||
                                 normalizedText.includes('amara.org') ||
                                 normalizedText.includes('amara') ||
                                 normalizedText.length < 3;
          
          if (isFallbackText) {
            logger.error('❌ Transcripción inválida o texto de fallback detectado:', transcribedText);
            setState(prev => ({
              ...prev,
              isProcessing: false,
              error: 'No se pudo entender el audio. Por favor, intenta nuevamente hablando más claro y cerca del micrófono.',
              duration: 0,
              audioBlob: null
            }));
            
            // Limpiar el error después de 3 segundos para que el usuario pueda reintentar
            setTimeout(() => {
              setState(prev => ({
                ...prev,
                error: null
              }));
            }, 3000);
            
            cleanup();
            return;
          }

          // Validar límite diario de transacciones ANTES de procesar con Groq
          if (user) {
            try {
              const currentPlan = (user.suscripcion || 'free') as 'free' | 'smart' | 'pro' | 'caducado';
              const limits = getPlanLimits(currentPlan);
              
              // Obtener conteo actual de transacciones del día
              if (limits.maxDailyTransactions !== null) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const tomorrow = new Date(today);
                tomorrow.setDate(tomorrow.getDate() + 1);
                
                const { count, error: countError } = await supabase
                  .from('transacciones')
                  .select('*', { count: 'exact', head: true })
                  .eq('usuario_id', user.id)
                  .gte('fecha_creacion', today.toISOString())
                  .lt('fecha_creacion', tomorrow.toISOString());
                
                if (!countError && count !== null && count >= limits.maxDailyTransactions) {
                  logger.error('❌ Límite diario excedido, no se procesará con Groq');
                  setDailyLimitInfo({
                    currentCount: count,
                    maxCount: limits.maxDailyTransactions
                  });
                  setShowDailyLimitModal(true);
                  setState(prev => ({
                    ...prev,
                    isProcessing: false,
                    error: null, // No mostrar error en el estado, el modal lo mostrará
                    duration: 0,
                    audioBlob: null
                  }));
                  cleanup();
                  return; // Salir sin procesar con Groq
                }
              }
              
              // Si pasó el conteo, validar con la función completa (incluye validaciones de audio y texto)
              const validation = await validateCanCreateTransaction(
                currentPlan,
                user.id,
                supabase,
                audioDurationSeconds, // Duración del audio
                transcribedText || undefined // Texto transcrito
              );
              
              if (!validation.valid) {
                logger.error('❌ Validación fallida:', validation.message);
                setState(prev => ({
                  ...prev,
                  isProcessing: false,
                  error: validation.message || 'No se puede crear la transacción',
                  duration: 0,
                  audioBlob: null
                }));
                cleanup();
                return; // Salir sin procesar con Groq
              }
              logger.debug('✅ Validación de límite diario OK, procediendo con Groq');
            } catch (validationError: any) {
              logger.error('❌ Error validando límite diario:', validationError);
              setState(prev => ({
                ...prev,
                isProcessing: false,
                error: validationError.message || 'Error al validar límite diario',
                duration: 0,
                audioBlob: null
              }));
              cleanup();
              return; // Salir sin procesar con Groq
            }
          }

          // Enviar a Groq si hay API key configurada
          try {
            // Obtener el país del usuario para usar su zona horaria
            const userCountry = user?.pais || 'BO'; // Default a Bolivia si no hay país
            const groqMultipleResult = await groqService.processTranscriptionMultiple(transcribedText || '', userCountry);
            if (groqMultipleResult && groqMultipleResult.transacciones.length > 0) {
              logger.debug('🤖 Groq multiple result:', groqMultipleResult);
              
              // Verificar si hay errores de fecha
              const hasDateError = groqMultipleResult.transacciones.some((transaction: any) => transaction.fechaError);
              
              if (hasDateError) {
                // Mostrar modal de error de fecha
                const errorTransaction = groqMultipleResult.transacciones.find((transaction: any) => transaction.fechaError);
                if (errorTransaction && errorTransaction.fechaError) {
                  setDateError(errorTransaction.fechaError);
                  setShowDateErrorModal(true);
                }
              } else {
                // Mostrar modal con los datos procesados
                setModalTranscriptionText(transcribedText || '');
                setModalGroqData(groqMultipleResult);
                setShowModal(true);
                
                // También actualizar el contexto VoiceContext para el dashboard
                setVoiceData({
                  transcriptionText: transcribedText || '',
                  groqData: groqMultipleResult,
                  source: 'audio'
                });
              }
            } else {
              // Si no hay resultado de Groq, mostrar solo transcripción
              setModalTranscriptionText(transcribedText || '');
              setModalGroqData(null);
              setShowModal(true);
              
              // También actualizar el contexto VoiceContext
              setVoiceData({
                transcriptionText: transcribedText || '',
                groqData: null,
                source: 'audio'
              });
            }
          } catch (e) {
            logger.warn('Groq no disponible o sin API key, se omite.');
            // Mostrar modal con solo transcripción
            setModalTranscriptionText(transcribedText || '');
            setModalGroqData(null);
            setShowModal(true);
            
            // También actualizar el contexto VoiceContext
            setVoiceData({
              transcriptionText: transcribedText || '',
              groqData: null,
              source: 'audio'
            });
          }
          
          setState(prev => ({
            ...prev,
            isProcessing: false,
            duration: 0
          }));
          
          } catch (error) {
            logger.error('❌ Error en transcripción:', error);
            logger.error('❌ Error type:', typeof error);
            logger.error('❌ Error message:', error instanceof Error ? error.message : String(error));
            logger.error('❌ Error stack:', error instanceof Error ? error.stack : 'N/A');
          setState(prev => ({
            ...prev,
            isProcessing: false,
            duration: 0,
            error: error instanceof Error ? error.message : 'Error en transcripción'
          }));
        }

        logger.debug('🧹 Limpiando recursos...');
        cleanup();
        logger.debug('✅ Limpieza completada');
      };

      logger.debug('🎤 Iniciando grabación con MediaRecorder...');
      logger.debug('📋 Chunk size:', finalConfig.chunkSize);
      
      try {
        mediaRecorder.start(finalConfig.chunkSize);
        logger.debug('✅ MediaRecorder.start() ejecutado exitosamente');
        logger.debug('📊 Estado del MediaRecorder:', {
          state: mediaRecorder.state,
          mimeType: mediaRecorder.mimeType
        });
      } catch (startError: any) {
        logger.error('❌ Error al iniciar MediaRecorder:', startError);
        logger.error('❌ Error name:', startError?.name);
        logger.error('❌ Error message:', startError?.message);
        // Detener el stream si hay error
        stream.getTracks().forEach(track => track.stop());
        throw startError;
      }
      
      mediaRecorderRef.current = mediaRecorder;
      logger.debug('✅ MediaRecorder guardado en ref');

      setState(prev => ({
        ...prev,
        isRecording: true,
        duration: 0
      }));
      logger.debug('✅ Estado actualizado: isRecording = true');

      // Iniciar timer con validación automática de límite
      logger.debug('⏱️ Iniciando timer de duración...');
      durationRef.current = 0; // Resetear el ref al iniciar
      stoppedByLimitRef.current = false; // Resetear la bandera de límite
      timerRef.current = setInterval(() => {
        setState(prev => {
          const newDuration = prev.duration + 1;
          durationRef.current = newDuration; // Actualizar el ref en cada tick
          logger.debug(`⏱️ Duración: ${newDuration}s`);
          
          // Detener automáticamente si se alcanza el límite de 15 segundos
          const currentUser = userRef.current;
          if (currentUser) {
            const currentPlan = currentUser.suscripcion || 'free';
            const limits = getPlanLimits(currentPlan);
            
            if (limits.maxAudioDurationSeconds !== null && newDuration >= limits.maxAudioDurationSeconds) {
              // Guardar la duración en el ref antes de detener
              durationRef.current = limits.maxAudioDurationSeconds;
              
              // Marcar que se detuvo por límite
              stoppedByLimitRef.current = true;
              logger.warn('⚠️ Límite de duración alcanzado, deteniendo grabación sin procesar');
              
              // Detener la grabación automáticamente
              if (mediaRecorderRef.current && prev.isRecording) {
                mediaRecorderRef.current.stop();
              }
              
              if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
              }
              
              // Limpiar chunks para evitar procesar el audio
              chunksRef.current = [];
              
              // Mostrar modal de límite de duración (usar setTimeout para asegurar que se ejecute después del estado)
              setTimeout(() => {
                setShowDurationLimitModal(true);
              }, 100);
              
              return {
                ...prev,
                duration: limits.maxAudioDurationSeconds,
                isRecording: false,
                error: null // No establecer error, solo mostrar el modal
              };
            }
          }
          
          return {
            ...prev,
            duration: newDuration
          };
        });
      }, 1000);

    } catch (error: any) {
      logger.error('❌ Error al acceder al micrófono:', error);
      logger.error('❌ Error name:', error?.name);
      logger.error('❌ Error message:', error?.message);
      logger.error('❌ Error stack:', error?.stack);
      
      // Limpiar recursos si hay error
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current = null;
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      // Mensaje de error más específico según el tipo de error
      let errorMessage = 'No se pudo acceder al micrófono. Verifica los permisos.';
      if (error?.name === 'NotAllowedError') {
        errorMessage = 'Permiso de micrófono denegado. Por favor, permite el acceso al micrófono.';
      } else if (error?.name === 'NotFoundError') {
        errorMessage = 'No se encontró ningún micrófono. Verifica que tu dispositivo tenga un micrófono conectado.';
      } else if (error?.name === 'NotSupportedError') {
        errorMessage = 'Tu navegador no soporta grabación de audio. Intenta con otro navegador.';
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isRecording: false,
        isProcessing: false
      }));
    }
  }, [finalConfig, cleanup, state.duration]);

  // Detener grabación
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && state.isRecording) {
      // Guardar la duración antes de detener
      durationRef.current = state.duration;
      stoppedByLimitRef.current = false; // No fue detenido por límite, fue manual
      logger.debug('🛑 stopRecording: Guardando duración en ref:', durationRef.current);
      
      mediaRecorderRef.current.stop();
      
      setState(prev => ({
        ...prev,
        isRecording: false
      }));

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [state.isRecording]);

  // Cancelar grabación
  const cancelRecording = useCallback(() => {
    // Marcar como cancelada INMEDIATAMENTE y de forma síncrona (ANTES de cualquier otra acción)
    cancelledRef.current = true;
    
    logger.debug('🚫 cancelRecording: Marcando como cancelada');
    
    // Establecer isSwipeDetected PRIMERO para que el mensaje aparezca inmediatamente
    setIsSwipeDetected(true);
    logger.debug('✅ cancelRecording: isSwipeDetected establecido a true');
    
    // Detener el recorder si está activo
    if (mediaRecorderRef.current && state.isRecording) {
      logger.debug('🛑 cancelRecording: Deteniendo MediaRecorder');
      mediaRecorderRef.current.stop();
    }
    
    // Actualizar estado inmediatamente
    setState({
      isRecording: false,
      isProcessing: false,
      duration: 0,
      audioBlob: null,
      error: null
    });

    // Limpiar chunks para evitar procesar el audio cancelado
    chunksRef.current = [];
    logger.debug('🧹 cancelRecording: Chunks limpiados');

    // Limpiar recursos pero NO resetear isSwipeDetected (se reseteará después del timeout)
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    // NO limpiar mediaRecorderRef aquí porque onstop puede necesitarlo
    // NO resetear isSwipeDetected aquí - debe permanecer true para mostrar el mensaje

    // Guardar referencia al timeout para poder cancelarlo si es necesario
    const swipeTimeoutRef = setTimeout(() => {
      logger.debug('⏰ cancelRecording: Reseteando isSwipeDetected después de 2 segundos');
      setIsSwipeDetected(false);
      
      // Resetear cancelledRef solo después de un delay adicional para asegurar que onstop ya lo verificó
      setTimeout(() => {
        cancelledRef.current = false;
        logger.debug('✅ cancelRecording: Estado de cancelación reseteado');
        // Ahora sí limpiar el mediaRecorderRef
        if (mediaRecorderRef.current) {
          mediaRecorderRef.current = null;
        }
      }, 1000); // Delay adicional de 1 segundo para asegurar que onstop ya terminó
    }, 2000); // Cambiado a 2 segundos
    
    // Guardar el timeout en un ref para poder cancelarlo si es necesario
    // (aunque en este caso no lo necesitamos, pero es buena práctica)
  }, [state.isRecording, cleanup]);

  // Manejar presión del botón (mantener presionado) - Mouse
  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    
    if (state.isProcessing) return;
    
    setIsPressed(true);
    setTouchStartX(event.clientX);
    setTouchStartY(event.clientY);
    
    // Iniciar grabación después de un pequeño delay para evitar clicks accidentales
    pressTimerRef.current = setTimeout(() => {
      if (!state.isRecording) {
        startRecording();
      }
    }, 200);
  }, [state.isProcessing, state.isRecording, startRecording]);

  // Manejar presión del botón (mantener presionado) - Touch
  const handleTouchStart = useCallback((event: React.TouchEvent) => {
    // No usar preventDefault en touch para evitar el error
    if (state.isProcessing) return;
    
    setIsPressed(true);
    setTouchStartX(event.touches[0].clientX);
    setTouchStartY(event.touches[0].clientY);
    
    // Iniciar grabación después de un pequeño delay para evitar clicks accidentales
    pressTimerRef.current = setTimeout(() => {
      if (!state.isRecording) {
        startRecording();
      }
    }, 200);
  }, [state.isProcessing, state.isRecording, startRecording]);

  // Manejar liberación del botón
  const handlePressEnd = useCallback((event?: React.TouchEvent | React.MouseEvent) => {
    // Verificar PRIMERO si ya fue cancelado (antes de cualquier otra acción)
    if (cancelledRef.current || isSwipeDetected) {
      logger.debug('🚫 Grabación ya cancelada, ignorando handlePressEnd');
      if (pressTimerRef.current) {
        clearTimeout(pressTimerRef.current);
        pressTimerRef.current = null;
      }
      setIsPressed(false);
      return;
    }
    
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
    
    setIsPressed(false);
    
    // Verificar nuevamente después de limpiar el timer (por si acaso cambió durante la limpieza)
    if (cancelledRef.current || isSwipeDetected) {
      logger.debug('🚫 Grabación cancelada durante handlePressEnd, abortando');
      return;
    }
    
    // Si está grabando y no hubo swipe, detener normalmente
    if (state.isRecording) {
      stopRecording();
    }
  }, [state.isRecording, isSwipeDetected, stopRecording]);

  // Manejar movimiento para detectar swipe - Mouse
  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (!touchStartX || !touchStartY || !state.isRecording || isSwipeDetected || cancelledRef.current) return;
    
    const deltaX = event.clientX - touchStartX;
    const deltaY = event.clientY - touchStartY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // Si el movimiento es mayor a 60px (salir del círculo del botón), cancelar grabación
    if (distance > 60) {
      logger.debug('🔄 Swipe detectado (mouse):', { deltaX, deltaY, distance });
      event.preventDefault(); // Prevenir que el evento continúe
      event.stopPropagation(); // Detener la propagación
      cancelRecording();
      setTouchStartX(null);
      setTouchStartY(null);
    }
  }, [touchStartX, touchStartY, state.isRecording, isSwipeDetected, cancelRecording]);

  // Manejar movimiento para detectar swipe - Touch
  const handleTouchMove = useCallback((event: React.TouchEvent) => {
    if (!touchStartX || !touchStartY || !state.isRecording || isSwipeDetected || cancelledRef.current) return;
    
    const deltaX = event.touches[0].clientX - touchStartX;
    const deltaY = event.touches[0].clientY - touchStartY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // Si el movimiento es mayor a 60px (salir del círculo del botón), cancelar grabación
    if (distance > 60) {
      logger.debug('🔄 Swipe detectado (touch):', { deltaX, deltaY, distance });
      // No usar preventDefault aquí porque puede causar problemas con listeners pasivos
      // En su lugar, cancelar inmediatamente
      cancelRecording();
      setTouchStartX(null);
      setTouchStartY(null);
    }
  }, [touchStartX, touchStartY, state.isRecording, isSwipeDetected, cancelRecording]);

  // Manejar cancelación por pérdida de foco
  const handlePressCancel = useCallback(() => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
    
    setIsPressed(false);
    
    if (state.isRecording) {
      cancelRecording();
    }
  }, [state.isRecording, cancelRecording]);

  // Determinar estado del botón
  const getButtonState = useCallback((): MicButtonState => {
    if (state.error) return 'error';
    if (state.isProcessing) return 'processing';
    if (state.isRecording) return 'recording';
    return 'idle';
  }, [state]);

  // Limpiar al desmontar
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  // Agregar listeners globales para mouse y touch cuando está grabando
  useEffect(() => {
    if (state.isRecording && touchStartX !== null && touchStartY !== null && !isSwipeDetected) {
      // Listener global para mouse (desktop)
      const handleGlobalMouseMove = (event: MouseEvent) => {
        if (cancelledRef.current || isSwipeDetected) return;
        
        const deltaX = event.clientX - touchStartX;
        const deltaY = event.clientY - touchStartY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        if (distance > 60) {
          logger.debug('🔄 Swipe global detectado (mouse):', { deltaX, deltaY, distance });
          event.preventDefault();
          cancelRecording();
          setTouchStartX(null);
          setTouchStartY(null);
        }
      };

      // Listener global para touch (móvil) - importante para cuando el dedo sale del área del botón
      const handleGlobalTouchMove = (event: TouchEvent) => {
        if (event.touches.length === 0 || cancelledRef.current || isSwipeDetected) return;
        
        const deltaX = event.touches[0].clientX - touchStartX;
        const deltaY = event.touches[0].clientY - touchStartY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        if (distance > 60) {
          logger.debug('🔄 Swipe global detectado (touch):', { deltaX, deltaY, distance });
          // preventDefault está permitido aquí porque el listener no es pasivo
          event.preventDefault(); // Prevenir scroll mientras se cancela
          cancelRecording();
          setTouchStartX(null);
          setTouchStartY(null);
        }
      };

      // Agregar listeners globales
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('touchmove', handleGlobalTouchMove, { passive: false }); // passive: false para poder usar preventDefault
      
      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove);
        document.removeEventListener('touchmove', handleGlobalTouchMove);
      };
    }
  }, [state.isRecording, touchStartX, touchStartY, isSwipeDetected, cancelRecording]);

  // Funciones para manejar el modal
  const handleModalClose = () => {
    setShowModal(false);
    setModalTranscriptionText('');
    setModalGroqData(null);
  };

  const handleModalSave = async (data: any) => {
    logger.debug('💾 Guardando transacciones:', data);
    logger.debug('👤 Usuario actual:', user);
    
    if (!user) {
      logger.error('❌ No hay usuario autenticado. No se pueden guardar transacciones.');
      return;
    }
    
    if (data?.transacciones && Array.isArray(data.transacciones)) {
      try {
        logger.debug(`🔄 Procesando ${data.transacciones.length} transacciones...`);
        
        for (const transaction of data.transacciones) {
          // Usar la fecha detectada por Groq o la fecha actual como fallback
          const transactionDate = transaction.fecha || new Date().toISOString().split('T')[0];
          
          logger.debug('💾 Guardando transacción:', {
            tipo: transaction.tipo || 'gasto',
            monto: transaction.monto || 0,
            categoria: transaction.categoria || 'otros',
            descripcion: transaction.descripcion || '',
            fecha: transactionDate
          });
          
          logger.debug('🔄 Llamando a addTransaction...');
          const result = await addTransaction({
            tipo: transaction.tipo || 'gasto',
            monto: transaction.monto || 0,
            categoria: transaction.categoria || 'otros',
            descripcion: transaction.descripcion || '',
            fecha: transactionDate,
            url_comprobante: null
          });
          logger.debug('✅ addTransaction completado:', result);
        }
        
        logger.debug('✅ Transacciones guardadas exitosamente');
      } catch (error) {
        logger.error('❌ Error guardando transacciones:', error);
        logger.error('❌ Tipo de error:', typeof error);
        logger.error('❌ Mensaje de error:', (error as Error).message);
        logger.error('❌ Stack trace:', (error as Error).stack);
        throw error; // Re-lanzar el error para que lo capture el modal
      }
    } else {
      logger.error('❌ No hay transacciones válidas para guardar');
    }
    
    handleModalClose();
  };

  const handleModalCancel = () => {
    logger.debug('❌ Transacción cancelada');
    handleModalClose();
  };

  // Funciones para manejar el modal de error de fecha
  const handleDateErrorModalClose = () => {
    setShowDateErrorModal(false);
    setDateError(null);
  };

  return {
    state,
    startRecording,
    stopRecording,
    cancelRecording,
    getButtonState,
    requestMicrophonePermission,
    handleMouseDown,
    handleMouseUp: handlePressEnd,
    handleMouseMove,
    handleMouseLeave: handlePressCancel,
    handleTouchStart,
    handleTouchEnd: handlePressEnd,
    handleTouchMove,
    handleTouchCancel: handlePressCancel,
    isIdle: !state.isRecording && !state.isProcessing && !state.error,
    isRecording: state.isRecording,
    isProcessing: state.isProcessing,
    hasError: !!state.error,
    duration: state.duration,
    audioBlob: state.audioBlob,
    isPressed,
    isSwipeDetected,
    // Estados de transcripción
    transcriptionState,
    isTranscribing,
    transcriptionText,
    transcriptionError,
    transcriptionComplete,
    clearTranscription,
    // Estados del modal
    showModal,
    modalTranscriptionText,
    modalGroqData,
    handleModalClose,
    handleModalSave,
    handleModalCancel,
    // Estados del modal de error de fecha
    showDateErrorModal,
    dateError,
    handleDateErrorModalClose,
    // Estados del modal de límite de duración
    showDurationLimitModal,
    setShowDurationLimitModal,
    // Estados del modal de límite diario de transacciones
    showDailyLimitModal,
    setShowDailyLimitModal,
    dailyLimitInfo
  };
};
