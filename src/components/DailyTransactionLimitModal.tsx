"use client";

import React from 'react';
import { AlertTriangle, X, Calendar } from 'lucide-react';

interface DailyTransactionLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCount: number;
  maxDailyTransactions: number;
}

export default function DailyTransactionLimitModal({ 
  isOpen, 
  onClose, 
  currentCount,
  maxDailyTransactions
}: DailyTransactionLimitModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl animate-scale-in">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
            <Calendar size={32} className="text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Límite Diario Alcanzado</h3>
            <p className="text-sm text-gray-600">Has alcanzado tu límite de transacciones</p>
          </div>
        </div>

        {/* Content */}
        <div className="mb-6">
          <p className="text-gray-700 mb-4 text-center">
            Has alcanzado el límite de <span className="font-bold text-red-600">{maxDailyTransactions} transacciones diarias</span>.
          </p>
          
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <AlertTriangle size={16} className="text-red-600" />
              </div>
              <div>
                <p className="font-semibold text-red-800 text-sm mb-1">Transacciones del día</p>
                <p className="text-red-700 text-sm">
                  Has realizado <span className="font-bold">{currentCount} transacciones</span> hoy (incluyendo eliminadas).
                </p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-blue-600 text-xs">💡</span>
              </div>
              <div>
                <p className="font-semibold text-blue-800 text-sm mb-1">¿Qué hacer?</p>
                <p className="text-blue-700 text-sm">
                  Puedes crear más transacciones mañana o actualizar a un plan superior para aumentar tu límite diario.
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

