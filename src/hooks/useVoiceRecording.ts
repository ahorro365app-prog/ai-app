"use client";

import { useState, useCallback, useRef, useEffect } from 'react';
import { VoiceRecordingState, RecordingConfig, MicButtonState } from '@/types/voice';
import { useWhisperTranscription } from './useWhisperTranscription';
import { groqService } from '@/services/groqService';
import { useSupabase } from '@/contexts/SupabaseContext';

const DEFAULT_CONFIG: RecordingConfig = {
  sampleRate: 44100,
  echoCancellation: true,
  noiseSuppression: true,
  mimeType: 'audio/webm;codecs=opus',
  chunkSize: 1000
};

export const useVoiceRecording = (config: Partial<RecordingConfig> = {}) => {
  const { addTransaction, user } = useSupabase();
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  // Función para solicitar permisos de micrófono
  const requestMicrophonePermission = async (): Promise<boolean> => {
    try {
      // Verificar si el navegador soporta getUserMedia
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error('❌ Este navegador no soporta acceso al micrófono');
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
      
      console.log('✅ Permiso de micrófono concedido');
      return true;
    } catch (error: any) {
      console.error('❌ Error al solicitar permiso de micrófono:', error);
      
      // Mostrar mensaje específico según el tipo de error
      if (error.name === 'NotAllowedError') {
        console.error('🚫 Usuario denegó el permiso de micrófono');
      } else if (error.name === 'NotFoundError') {
        console.error('🎤 No se encontró ningún micrófono');
      } else if (error.name === 'NotSupportedError') {
        console.error('🚫 El navegador no soporta acceso al micrófono');
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
  }, []);

  // Iniciar grabación
  const startRecording = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, error: null }));
      
      // Solicitar permisos de micrófono primero
      const hasPermission = await requestMicrophonePermission();
      if (!hasPermission) {
        setState(prev => ({ 
          ...prev, 
          error: 'Permiso de micrófono denegado. Por favor, permite el acceso al micrófono en la configuración de tu dispositivo.' 
        }));
        return;
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: finalConfig.sampleRate,
          echoCancellation: finalConfig.echoCancellation,
          noiseSuppression: finalConfig.noiseSuppression,
          autoGainControl: true,
          channelCount: 1,
          latency: 0.01
        }
      });

      streamRef.current = stream;
      chunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: finalConfig.mimeType
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: finalConfig.mimeType });
        
        // Procesar con Whisper en lugar de simulación
        try {
          setState(prev => ({
            ...prev,
            audioBlob,
            isProcessing: true
          }));
          
          console.log('🎤 Audio grabado, enviando a Whisper...', {
            size: audioBlob.size,
            duration: state.duration
          });
          
          // Transcribir con Whisper
          const transcribedText = await transcribeAudio(audioBlob);
          console.log('✅ Transcripción completada:', transcribedText);

          // Enviar a Groq si hay API key configurada
          try {
            // Obtener el país del usuario para usar su zona horaria
            const userCountry = user?.pais || 'BO'; // Default a Bolivia si no hay país
            const groqMultipleResult = await groqService.processTranscriptionMultiple(transcribedText || '', userCountry);
            if (groqMultipleResult && groqMultipleResult.transacciones.length > 0) {
              console.log('🤖 Groq multiple result:', groqMultipleResult);
              
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
              }
            } else {
              // Si no hay resultado de Groq, mostrar solo transcripción
              setModalTranscriptionText(transcribedText || '');
              setModalGroqData(null);
              setShowModal(true);
            }
          } catch (e) {
            console.warn('Groq no disponible o sin API key, se omite.');
            // Mostrar modal con solo transcripción
            setModalTranscriptionText(transcribedText || '');
            setModalGroqData(null);
            setShowModal(true);
          }
          
          setState(prev => ({
            ...prev,
            isProcessing: false,
            duration: 0
          }));
          
        } catch (error) {
          console.error('❌ Error en transcripción:', error);
          setState(prev => ({
            ...prev,
            isProcessing: false,
            duration: 0,
            error: error instanceof Error ? error.message : 'Error en transcripción'
          }));
        }

        cleanup();
      };

      mediaRecorder.start(finalConfig.chunkSize);
      mediaRecorderRef.current = mediaRecorder;

      setState(prev => ({
        ...prev,
        isRecording: true,
        duration: 0
      }));

      // Iniciar timer
      timerRef.current = setInterval(() => {
        setState(prev => ({
          ...prev,
          duration: prev.duration + 1
        }));
      }, 1000);

    } catch (error) {
      console.error('Error al acceder al micrófono:', error);
      setState(prev => ({
        ...prev,
        error: 'No se pudo acceder al micrófono. Verifica los permisos.',
        isRecording: false
      }));
    }
  }, [finalConfig, cleanup, state.duration]);

  // Detener grabación
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && state.isRecording) {
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
    if (mediaRecorderRef.current && state.isRecording) {
      mediaRecorderRef.current.stop();
    }
    
    setIsSwipeDetected(true);
    
    setState({
      isRecording: false,
      isProcessing: false,
      duration: 0,
      audioBlob: null,
      error: null
    });

    // Resetear el estado de swipe después de un breve delay
    setTimeout(() => {
      setIsSwipeDetected(false);
    }, 1000);

    cleanup();
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
  const handlePressEnd = useCallback(() => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
    
    setIsPressed(false);
    
    if (state.isRecording) {
      stopRecording();
    }
  }, [state.isRecording, stopRecording]);

  // Manejar movimiento para detectar swipe - Mouse
  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (!touchStartX || !touchStartY || !state.isRecording || isSwipeDetected) return;
    
    const deltaX = event.clientX - touchStartX;
    const deltaY = event.clientY - touchStartY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // Si el movimiento es mayor a 40px (salir del círculo del botón), cancelar grabación
    if (distance > 40) {
      console.log('🔄 Swipe detectado (mouse):', { deltaX, deltaY, distance });
      cancelRecording();
      setTouchStartX(null);
      setTouchStartY(null);
    }
  }, [touchStartX, touchStartY, state.isRecording, isSwipeDetected, cancelRecording]);

  // Manejar movimiento para detectar swipe - Touch
  const handleTouchMove = useCallback((event: React.TouchEvent) => {
    if (!touchStartX || !touchStartY || !state.isRecording || isSwipeDetected) return;
    
    const deltaX = event.touches[0].clientX - touchStartX;
    const deltaY = event.touches[0].clientY - touchStartY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // Si el movimiento es mayor a 40px (salir del círculo del botón), cancelar grabación
    if (distance > 40) {
      console.log('🔄 Swipe detectado (touch):', { deltaX, deltaY, distance });
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

  // Agregar listener global para mouse move cuando está grabando
  useEffect(() => {
    if (state.isRecording && touchStartX !== null && touchStartY !== null && !isSwipeDetected) {
      const handleGlobalMouseMove = (event: MouseEvent) => {
        const deltaX = event.clientX - touchStartX;
        const deltaY = event.clientY - touchStartY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        if (distance > 40) {
          console.log('🔄 Swipe global detectado:', { deltaX, deltaY, distance });
          cancelRecording();
          setTouchStartX(null);
          setTouchStartY(null);
        }
      };

      document.addEventListener('mousemove', handleGlobalMouseMove);
      
      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove);
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
    console.log('💾 Guardando transacciones:', data);
    console.log('👤 Usuario actual:', user);
    
    if (!user) {
      console.error('❌ No hay usuario autenticado. No se pueden guardar transacciones.');
      return;
    }
    
    if (data?.transacciones && Array.isArray(data.transacciones)) {
      try {
        console.log(`🔄 Procesando ${data.transacciones.length} transacciones...`);
        
        for (const transaction of data.transacciones) {
          // Usar la fecha detectada por Groq o la fecha actual como fallback
          const transactionDate = transaction.fecha || new Date().toISOString().split('T')[0];
          
          console.log('💾 Guardando transacción:', {
            tipo: transaction.tipo || 'gasto',
            monto: transaction.monto || 0,
            categoria: transaction.categoria || 'otros',
            descripcion: transaction.descripcion || '',
            fecha: transactionDate
          });
          
          console.log('🔄 Llamando a addTransaction...');
          const result = await addTransaction({
            tipo: transaction.tipo || 'gasto',
            monto: transaction.monto || 0,
            categoria: transaction.categoria || 'otros',
            descripcion: transaction.descripcion || '',
            fecha: transactionDate,
            url_comprobante: null
          });
          console.log('✅ addTransaction completado:', result);
        }
        
        console.log('✅ Transacciones guardadas exitosamente');
      } catch (error) {
        console.error('❌ Error guardando transacciones:', error);
        console.error('❌ Tipo de error:', typeof error);
        console.error('❌ Mensaje de error:', (error as Error).message);
        console.error('❌ Stack trace:', (error as Error).stack);
        throw error; // Re-lanzar el error para que lo capture el modal
      }
    } else {
      console.error('❌ No hay transacciones válidas para guardar');
    }
    
    handleModalClose();
  };

  const handleModalCancel = () => {
    console.log('❌ Transacción cancelada');
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
    handleDateErrorModalClose
  };
};
