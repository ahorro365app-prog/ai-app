"use client";

import { useState } from 'react';
import { ArrowLeft, Calendar, TrendingDown, TrendingUp, Trash2, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTransactions } from '@/contexts/TransactionsContext';
import { useCurrency } from '@/hooks/useCurrency';
import { getCategoryLabel } from '@/components/TransactionModal';

export default function HistoryPage() {
  const router = useRouter();
  const { transactions, deleteTransaction, getStats } = useTransactions();
  const { formatAmount, currency } = useCurrency();
  
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'expense' | 'income'>('all');

  // Filtrar transacciones
  const filteredTransactions = transactions.filter(tx => {
    const categoryLabel = getCategoryLabel(tx.category);
    const matchesSearch = tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         categoryLabel.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || tx.type === filterType;
    return matchesSearch && matchesType;
  });

  // Obtener estadísticas de las transacciones filtradas
  const stats = getStats(filteredTransactions);

  // Agrupar transacciones por fecha
  const groupedByDate = filteredTransactions.reduce((acc, tx) => {
    const date = new Date(tx.date).toISOString().split('T')[0];
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(tx);
    return acc;
  }, {} as Record<string, typeof transactions>);

  const sortedDates = Object.keys(groupedByDate).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Hoy';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Ayer';
    } else {
      return date.toLocaleDateString('es-ES', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long' 
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 pb-8 rounded-b-3xl shadow-lg">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-full hover:bg-white/20 transition-colors"
          >
            <ArrowLeft size={24} className="text-white" />
          </button>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            📜 Historial
          </h1>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 text-center">
            <p className="text-xs text-white/80 mb-1">Ingresos</p>
            <p className="text-sm font-bold text-white">{formatAmount(stats.totalIncome)}</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 text-center">
            <p className="text-xs text-white/80 mb-1">Gastos</p>
            <p className="text-sm font-bold text-white">{formatAmount(stats.totalExpenses)}</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 text-center">
            <p className="text-xs text-white/80 mb-1">Balance</p>
            <p className={`text-sm font-bold ${stats.balance >= 0 ? 'text-green-300' : 'text-red-300'}`}>
              {formatAmount(stats.balance)}
            </p>
          </div>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <div className="p-4 space-y-3">
        {/* Buscador */}
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white border-2 border-gray-200 focus-within:border-blue-500 transition-colors shadow-sm">
          <Search size={18} className="text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar transacción..."
            className="flex-1 bg-transparent text-sm text-gray-900 focus:outline-none placeholder-gray-400"
          />
        </div>

        {/* Filtros de tipo */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilterType('all')}
            className={`flex-1 py-2 px-4 rounded-xl font-semibold text-sm transition-all ${
              filterType === 'all'
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
                : 'bg-white text-gray-600 border-2 border-gray-200'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setFilterType('expense')}
            className={`flex-1 py-2 px-4 rounded-xl font-semibold text-sm transition-all ${
              filterType === 'expense'
                ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md'
                : 'bg-white text-gray-600 border-2 border-gray-200'
            }`}
          >
            Gastos
          </button>
          <button
            onClick={() => setFilterType('income')}
            className={`flex-1 py-2 px-4 rounded-xl font-semibold text-sm transition-all ${
              filterType === 'income'
                ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md'
                : 'bg-white text-gray-600 border-2 border-gray-200'
            }`}
          >
            Ingresos
          </button>
        </div>
      </div>

      {/* Lista de transacciones agrupadas por fecha */}
      <div className="px-4 space-y-6">
        {sortedDates.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-sm">No hay transacciones</p>
            <p className="text-gray-400 text-xs mt-1">Comienza a registrar tus gastos e ingresos</p>
          </div>
        ) : (
          sortedDates.map(date => (
            <div key={date}>
              {/* Fecha */}
              <div className="flex items-center gap-2 mb-3">
                <Calendar size={16} className="text-purple-600" />
                <h3 className="text-sm font-bold text-purple-900 capitalize">
                  {formatDate(date)}
                </h3>
                <div className="flex-1 h-px bg-gradient-to-r from-purple-200 to-transparent"></div>
              </div>

              {/* Transacciones del día */}
              <div className="space-y-2">
                {groupedByDate[date].map(tx => (
                  <div
                    key={tx.id}
                    className="bg-white rounded-2xl p-4 border-2 border-gray-100 hover:border-gray-200 transition-all shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {tx.type === 'expense' ? (
                            <TrendingDown size={16} className="text-red-500" />
                          ) : (
                            <TrendingUp size={16} className="text-green-500" />
                          )}
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-gray-900 text-sm capitalize">
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
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                            {tx.paymentMethod === 'cash' && '💵 Efectivo'}
                            {tx.paymentMethod === 'card' && '💳 Tarjeta'}
                            {tx.paymentMethod === 'transfer' && '📱 Transferencia'}
                            {tx.paymentMethod === 'qr' && '📲 QR'}
                            {tx.paymentMethod === 'other' && '📎 Otro'}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <p className={`text-lg font-bold ${
                          tx.type === 'expense' ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {tx.type === 'expense' ? '-' : '+'}{formatAmount(tx.amount)}
                        </p>
                        <button
                          onClick={() => {
                            if (confirm('¿Eliminar esta transacción?')) {
                              deleteTransaction(tx.id);
                            }
                          }}
                          className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                        >
                          <Trash2 size={14} className="text-red-500" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}



