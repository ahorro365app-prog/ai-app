"use client";

import { useState, useEffect } from 'react';
import { TrendingDown, TrendingUp, Calendar, Plus } from 'lucide-react';
import { useTransactions } from '@/hooks/useTransactions';
import { useCurrency } from '@/hooks/useCurrency';

export default function DashboardPage() {
  const { transactions, getTodayTransactions, getStats } = useTransactions();
  const { formatAmount, currency } = useCurrency();
  const [dailyBudget, setDailyBudget] = useState(0);

  // Cargar presupuesto diario
  useEffect(() => {
    const saved = localStorage.getItem('dailyBudget');
    if (saved) {
      setDailyBudget(parseFloat(saved));
    }
  }, []);

  // Recalcular cuando las transacciones cambien
  const todayTransactions = getTodayTransactions();
  const stats = getStats(todayTransactions);

  const budgetPercentage = dailyBudget > 0 
    ? Math.min((stats.totalExpenses / dailyBudget) * 100, 100)
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4 pb-24">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">
          Hola 👋
        </h1>
        <p className="text-gray-600">
          {new Date().toLocaleDateString('es-ES', { 
            weekday: 'long', 
            day: 'numeric', 
            month: 'long' 
          })}
        </p>
      </div>

      {/* Resumen del día */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-6 mb-6 text-white shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-blue-100 text-sm mb-1">Gastos de hoy</p>
            <p className="text-4xl font-bold">{formatAmount(stats.totalExpenses)}</p>
          </div>
          <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <TrendingDown size={32} />
          </div>
        </div>

        {/* Progreso del presupuesto */}
        {dailyBudget > 0 && (
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-blue-100">Presupuesto diario</span>
              <span className="font-semibold">{formatAmount(dailyBudget)}</span>
            </div>
            <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-300"
                style={{ width: `${budgetPercentage}%` }}
              />
            </div>
            <p className="text-xs text-blue-100 mt-1">
              Te quedan {formatAmount(Math.max(dailyBudget - stats.totalExpenses, 0))}
            </p>
          </div>
        )}
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <TrendingUp size={20} className="text-green-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatAmount(stats.totalIncome)}</p>
          <p className="text-sm text-gray-600">Ingresos</p>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Calendar size={20} className="text-blue-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{todayTransactions.length}</p>
          <p className="text-sm text-gray-600">Transacciones</p>
        </div>
      </div>

      {/* Lista de transacciones de hoy */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Transacciones de hoy</h2>
        </div>

        {todayTransactions.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100">
            <div className="w-16 h-16 rounded-full bg-gray-100 mx-auto mb-3 flex items-center justify-center">
              <Plus size={32} className="text-gray-400" />
            </div>
            <p className="text-gray-600 mb-1">No hay transacciones hoy</p>
            <p className="text-sm text-gray-500">Usa el botón de voz para registrar</p>
          </div>
        ) : (
          <div className="space-y-3">
            {todayTransactions.map((tx) => (
              <div
                key={tx.id}
                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:border-gray-200 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {tx.type === 'expense' ? (
                        <TrendingDown size={16} className="text-red-500" />
                      ) : (
                        <TrendingUp size={16} className="text-green-500" />
                      )}
                      <p className="font-semibold text-gray-900 capitalize text-sm">
                        {tx.category}
                      </p>
                    </div>
                    {tx.description && (
                      <p className="text-xs text-gray-600 mb-2">{tx.description}</p>
                    )}
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      {tx.paymentMethod === 'cash' && '💵 Efectivo'}
                      {tx.paymentMethod === 'card' && '💳 Tarjeta'}
                      {tx.paymentMethod === 'transfer' && '📱 Transferencia'}
                      {tx.paymentMethod === 'qr' && '📲 QR'}
                      {tx.paymentMethod === 'other' && '📎 Otro'}
                    </span>
                  </div>
                  <p
                    className={`text-lg font-bold ${
                      tx.type === 'expense' ? 'text-red-600' : 'text-green-600'
                    }`}
                  >
                    {tx.type === 'expense' ? '-' : '+'}{formatAmount(tx.amount)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
