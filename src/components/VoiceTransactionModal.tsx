"use client";

import { useState } from 'react';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

interface VoiceTransactionModalProps {
  isOpen: boolean;
  transcript: string;
  onConfirm: () => void;
  onCancel: () => void;
  isProcessing: boolean;
  parsedData: {
    amount?: number;
    category?: string;
    description?: string;
  } | null;
  error?: string | null;
}

export default function VoiceTransactionModal({
  isOpen,
  transcript,
  onConfirm,
  onCancel,
  isProcessing,
  parsedData,
  error,
}: VoiceTransactionModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl">
        {/* Header */}
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {isProcessing ? '⚙️ Procesando...' : error ? '❌ Error' : '✅ Confirmar Gasto'}
          </h3>
          <p className="text-sm text-gray-600">
            {isProcessing
              ? 'Analizando tu mensaje con IA...'
              : error
              ? 'Hubo un problema al procesar tu gasto'
              : 'Revisa la información extraída'}
          </p>
        </div>

        {/* Loading indicator */}
        {isProcessing && (
          <div className="flex justify-center py-8">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
          </div>
        )}

        {/* Error */}
        {error && !isProcessing && (
          <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Transcripción original */}
        {!isProcessing && (
          <div className="mb-6">
            <p className="text-xs font-semibold text-gray-500 mb-2">Tu mensaje:</p>
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
              <p className="text-sm text-gray-900 italic">"{transcript}"</p>
            </div>
          </div>
        )}

        {/* Datos parseados */}
        {parsedData && !isProcessing && !error && (
          <div className="mb-6 space-y-3">
            <p className="text-xs font-semibold text-gray-500 mb-2">Información extraída:</p>
            
            {parsedData.amount && (
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                <span className="text-sm font-semibold text-gray-700">Monto:</span>
                <span className="text-lg font-bold text-green-600">${parsedData.amount}</span>
              </div>
            )}

            {parsedData.category && (
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                <span className="text-sm font-semibold text-gray-700">Categoría:</span>
                <span className="text-sm font-bold text-blue-600 capitalize">{parsedData.category}</span>
              </div>
            )}

            {parsedData.description && (
              <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                <p className="text-xs font-semibold text-gray-700 mb-1">Descripción:</p>
                <p className="text-sm text-purple-600">{parsedData.description}</p>
              </div>
            )}
          </div>
        )}

        {/* Botones */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 px-4 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
            disabled={isProcessing}
          >
            <XCircle size={18} />
            Cancelar
          </button>
          {!error && (
            <button
              onClick={onConfirm}
              disabled={isProcessing || !parsedData}
              className={`
                flex-1 py-3 px-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2
                ${
                  isProcessing || !parsedData
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:opacity-90 shadow-lg'
                }
              `}
            >
              <CheckCircle2 size={18} />
              Confirmar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}



