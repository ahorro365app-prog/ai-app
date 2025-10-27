"use client";

import { useState, useEffect } from 'react';
import { Mic, X } from 'lucide-react';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';

interface VoiceRecorderProps {
  onTranscriptComplete: (transcript: string) => void;
  maxDuration?: number; // en segundos
}

export default function VoiceRecorder({ onTranscriptComplete, maxDuration = 5 }: VoiceRecorderProps) {
  const [showRecorder, setShowRecorder] = useState(false);
  const [timeLeft, setTimeLeft] = useState(maxDuration);
  const [showInstructions, setShowInstructions] = useState(() => {
    if (typeof window !== 'undefined') {
      const timesUsed = parseInt(localStorage.getItem('voiceRecorderUsed') || '0');
      return timesUsed < 10;
    }
    return false;
  });

  const {
    isListening,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
    isSupported,
    error,
  } = useSpeechRecognition({
    lang: 'es-ES',
    continuous: true,
    interimResults: true,
  });

  // Contador regresivo
  useEffect(() => {
    if (isListening && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);

      return () => clearInterval(timer);
    }

    if (timeLeft === 0) {
      handleStopRecording();
    }
  }, [isListening, timeLeft]);

  // Actualizar contador de usos
  useEffect(() => {
    if (showRecorder) {
      const timesUsed = parseInt(localStorage.getItem('voiceRecorderUsed') || '0');
      localStorage.setItem('voiceRecorderUsed', (timesUsed + 1).toString());
      
      if (timesUsed + 1 >= 10) {
        setShowInstructions(false);
      }
    }
  }, [showRecorder]);

  const handleStartRecording = () => {
    setShowRecorder(true);
    setTimeLeft(maxDuration);
    resetTranscript();
    startListening();
  };

  const handleStopRecording = () => {
    stopListening();
    if (transcript) {
      onTranscriptComplete(transcript);
    }
    setShowRecorder(false);
    setTimeLeft(maxDuration);
  };

  const handleCancel = () => {
    stopListening();
    resetTranscript();
    setShowRecorder(false);
    setTimeLeft(maxDuration);
  };

  if (!isSupported) {
    return (
      <div className="fixed bottom-24 right-6 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg text-xl">
        ⚠️ Reconocimiento de voz no disponible
      </div>
    );
  }

  return (
    <>
      {/* Botón flotante para iniciar grabación */}
      {!showRecorder && (
        <button
          onClick={handleStartRecording}
          className="fixed bottom-24 right-6 w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50"
          aria-label="Grabar con voz"
        >
          <Mic size={28} />
        </button>
      )}

      {/* Modal de grabación */}
      {showRecorder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">🎤 Grabando...</h3>
              <button
                onClick={handleCancel}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} className="text-gray-600" />
              </button>
            </div>

            {/* Instrucciones (primeras 10 veces) */}
            {showInstructions && (
              <div className="mb-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
                <p className="text-xl font-semibold text-blue-900 mb-2">💡 Ejemplos de uso:</p>
                <ul className="text-xl text-blue-800 space-y-1">
                  <li>• "Gasté 50 en comida"</li>
                  <li>• "Pagué 150 de taxi"</li>
                  <li>• "Almuerzo 85 pesos"</li>
                </ul>
              </div>
            )}

            {/* Indicador visual de grabación */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="w-32 h-32 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center animate-pulse">
                  <Mic size={48} className="text-white" />
                </div>
                {/* Contador */}
                <div className="absolute -bottom-2 -right-2 bg-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg border-2 border-red-500">
                  <span className="text-xl font-bold text-red-600">{timeLeft}</span>
                </div>
              </div>
            </div>

            {/* Transcripción en tiempo real */}
            <div className="mb-6">
              <p className="text-xl font-semibold text-gray-700 mb-2">Transcripción:</p>
              <div className="min-h-[60px] p-3 bg-gray-50 rounded-xl border-2 border-gray-200">
                <p className="text-xl text-gray-900">
                  {transcript || <span className="text-gray-400 italic">Esperando...</span>}
                </p>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-xl text-red-600">{error}</p>
              </div>
            )}

            {/* Botones */}
            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                className="flex-1 py-3 px-4 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleStopRecording}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-purple-500 to-blue-600 text-white font-semibold hover:opacity-90 transition-all shadow-lg"
              >
                Procesar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}



