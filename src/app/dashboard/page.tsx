"use client";

import { useState, useEffect } from 'react';
import { TrendingDown, TrendingUp, Calendar, Plus } from 'lucide-react';
import { useTransactions } from '@/contexts/TransactionsContext';
import { useSupabase } from '@/contexts/SupabaseContext';
import { useCurrency } from '@/hooks/useCurrency';
import { getCategoryLabel } from '@/components/TransactionModal';
import TransactionModal from '@/components/TransactionModal';

export default function DashboardPage() {
  const { transactions, getTodayTransactions, getStats, addTransaction } = useTransactions();
  const { user, transactions: supabaseTransactions, addTransaction: addSupabaseTransaction } = useSupabase();
  const { formatAmount, currency } = useCurrency();
  // Usar moneda de Supabase si está disponible
  const currentCurrency = user?.moneda || currency;
  const [dailyBudget, setDailyBudget] = useState(0);
  const [userName, setUserName] = useState('');
  const [showTransactionModal, setShowTransactionModal] = useState(false);

  // Cargar presupuesto diario y nombre del usuario
  useEffect(() => {
    if (user) {
      setUserName(user.nombre.split(' ')[0]);
      setDailyBudget(user.presupuesto_diario || 0);
    }
  }, [user]);

  // Recalcular cuando las transacciones cambien
  const todayTransactions = getTodayTransactions();
  const stats = getStats(todayTransactions);

  const budgetPercentage = dailyBudget > 0 
    ? Math.min((stats.totalExpenses / dailyBudget) * 100, 100)
    : 0;

  const handleSaveTransaction = async (transaction: any) => {
    try {
      // Guardar en Supabase si está disponible
      if (user) {
        await addSupabaseTransaction({
          type: transaction.type,
          amount: transaction.amount,
          category: transaction.category,
          description: transaction.description,
          date: transaction.date,
          receipt_url: transaction.receipt_url
        });
      } else {
        // Fallback a localStorage
        addTransaction(transaction);
      }
      setShowTransactionModal(false);
    } catch (error) {
      console.error('Error saving transaction:', error);
      // Fallback a localStorage si hay error
      addTransaction(transaction);
      setShowTransactionModal(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4 pb-24">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 mb-1">
          Hola {userName ? `${userName} 👋` : '👋'}
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
            <p className="text-blue-100 text-xs mb-1">Gastos de hoy</p>
            <p className="text-2xl font-bold">{formatAmount(stats.totalExpenses)}</p>
          </div>
          <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <TrendingDown size={32} />
          </div>
        </div>

        {/* Progreso del presupuesto */}
        {dailyBudget > 0 && (
          <div>
            <div className="flex justify-between text-xs mb-2">
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
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <TrendingUp size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">{formatAmount(stats.totalIncome)}</p>
              <p className="text-xs text-gray-600">Ingresos</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Calendar size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">{todayTransactions.length}</p>
              <p className="text-xs text-gray-600">Transacciones</p>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de transacciones de hoy */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Transacciones de hoy</h2>
        </div>

        {todayTransactions.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100">
            <div className="w-16 h-16 rounded-full bg-gray-100 mx-auto mb-3 flex items-center justify-center">
              <Plus size={32} className="text-gray-400" />
            </div>
            <p className="text-gray-600 mb-1">No hay transacciones hoy</p>
            <p className="text-xs text-gray-500">Usa el botón de voz para registrar</p>
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
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900 capitalize text-xs">
                          {getCategoryLabel(tx.category)}
                        </p>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                          {new Date(tx.date).toLocaleTimeString('es-ES', { 
                            hour: '2-digit', 
                            minute: '2-digit',
                            hour12: false 
                          })}
                        </span>
                      </div>
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
                    className={`text-sm font-bold ${
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

      {/* Botón flotante para agregar transacción */}
      <button
        onClick={() => setShowTransactionModal(true)}
        className="fixed bottom-24 right-4 w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all flex items-center justify-center"
        title="Registrar gasto o ingreso"
      >
        <Plus size={24} />
      </button>

      {/* Modal de transacción */}
      <TransactionModal
        isOpen={showTransactionModal}
        onClose={() => setShowTransactionModal(false)}
        onSave={handleSaveTransaction}
      />
    </div>
  );
}
