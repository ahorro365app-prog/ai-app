"use client";

import { useEffect, useState } from 'react';
import { Mic, Loader2, CheckCircle, XCircle, Copy, Send } from 'lucide-react';

interface TranscriptionDisplayProps {
  isTranscribing: boolean;
  transcriptionText: string;
  hasError: boolean;
  errorMessage?: string;
  onSendToN8N?: (text: string) => void;
  onRetry?: () => void;
  className?: string;
}

export default function TranscriptionDisplay({
  isTranscribing,
  transcriptionText,
  hasError,
  errorMessage,
  onSendToN8N,
  onRetry,
  className = ''
}: TranscriptionDisplayProps) {
  const [showCopied, setShowCopied] = useState(false);

  // Copiar texto al portapapeles
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(transcriptionText);
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    } catch (error) {
      console.error('Error al copiar:', error);
    }
  };

  // Si no hay nada que mostrar, no renderizar
  if (!isTranscribing && !transcriptionText && !hasError) {
    return null;
  }

  return (
    <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 max-w-sm w-full mx-4 ${className}`}>
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-3 text-white">
          <div className="flex items-center gap-2">
            <Mic size={20} />
            <span className="font-semibold">Transcripción de Voz</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          
          {/* Estado de transcripción */}
          {isTranscribing && (
            <div className="flex items-center gap-3 py-4">
              <Loader2 size={24} className="animate-spin text-blue-600" />
              <div>
                <p className="font-medium text-gray-900">Transcribiendo audio...</p>
                <p className="text-sm text-gray-500">Procesando con Whisper AI</p>
              </div>
            </div>
          )}

          {/* Error */}
          {hasError && (
            <div className="flex items-start gap-3 py-4">
              <XCircle size={24} className="text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-red-900">Error en transcripción</p>
                <p className="text-sm text-red-600 mt-1">{errorMessage}</p>
                {onRetry && (
                  <button
                    onClick={onRetry}
                    className="mt-2 px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm hover:bg-red-200 transition-colors"
                  >
                    Reintentar
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Transcripción exitosa */}
          {transcriptionText && !isTranscribing && !hasError && (
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle size={24} className="text-green-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-green-900">Transcripción completada</p>
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                    <p className="text-gray-900 leading-relaxed">"{transcriptionText}"</p>
                  </div>
                </div>
              </div>

              {/* Acciones */}
              <div className="flex gap-2">
                <button
                  onClick={copyToClipboard}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Copy size={16} />
                  {showCopied ? 'Copiado!' : 'Copiar'}
                </button>
                
                {onSendToN8N && (
                  <button
                    onClick={() => onSendToN8N(transcriptionText)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:opacity-90 transition-opacity"
                  >
                    <Send size={16} />
                    Procesar
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
