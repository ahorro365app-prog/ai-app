"use client";

import React from 'react';
import { AlertTriangle, X, Mic } from 'lucide-react';

interface AudioDurationLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  maxDuration: number;
}

export default function AudioDurationLimitModal({ 
  isOpen, 
  onClose, 
  maxDuration 
}: AudioDurationLimitModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl animate-scale-in">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center">
            <Mic size={32} className="text-orange-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Límite de Duración Alcanzado</h3>
            <p className="text-sm text-gray-600">Audio demasiado largo</p>
          </div>
        </div>

        {/* Content */}
        <div className="mb-6">
          <p className="text-gray-700 mb-4 text-center">
            El audio no puede exceder <span className="font-bold text-orange-600">{maxDuration} segundos</span>.
          </p>
          
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-orange-600 text-xs">⚠️</span>
              </div>
              <div>
                <p className="font-semibold text-orange-800 text-sm mb-1">¿Qué hacer?</p>
                <p className="text-orange-700 text-sm">
                  Por favor, envía un audio más corto de {maxDuration} segundos o menos.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3.5 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold hover:opacity-90 transition-all shadow-lg"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}


