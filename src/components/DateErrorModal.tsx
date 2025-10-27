import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface DateErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  error: {
    message: string;
    daysDiff: number;
  };
}

export default function DateErrorModal({ isOpen, onClose, error }: DateErrorModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl animate-scale-in">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle size={32} className="text-red-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">Fecha No Válida</h3>
            <p className="text-xs text-gray-600">Esta acción no se puede realizar</p>
          </div>
        </div>

        {/* Content */}
        <div className="mb-6">
          <p className="text-gray-700 mb-4">
            {error.message}
          </p>
          
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-red-600 text-xs">⚠️</span>
              </div>
              <div>
                <p className="font-semibold text-red-800 text-xs mb-1">Detalles</p>
                <p className="text-red-700 text-xs">
                  La fecha solicitada es {error.daysDiff} días anterior a hoy.
                </p>
                <p className="text-red-700 text-xs mt-1">
                  Solo puedes registrar transacciones de los últimos 7 días.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3.5 px-4 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold hover:opacity-90 transition-all shadow-lg"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
