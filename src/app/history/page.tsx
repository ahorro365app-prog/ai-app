"use client";

import { useState } from 'react';
import { Calendar, TrendingDown, TrendingUp, Trash2, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTransactions } from '@/contexts/TransactionsContext';
import { useCurrency } from '@/hooks/useCurrency';
import { useSupabase } from '@/contexts/SupabaseContext';
import { getCategoryLabel } from '@/components/TransactionModal';

export default function HistoryPage() {
  const router = useRouter();
  const { transactions, deleteTransaction, getStats } = useTransactions();
  const { formatAmount, currency } = useCurrency();
  const { user, transactions: supabaseTransactions, deleteTransaction: deleteSupabaseTransaction } = useSupabase();
  // Usar moneda de Supabase si está disponible
  const currentCurrency = user?.moneda || currency;
  
  // Función para formatear montos con la moneda correcta
  const formatAmountWithCurrency = (amount: number) => {
    const currencyMap: Record<string, { symbol: string; decimals: number }> = {
      'BOB': { symbol: 'Bs', decimals: 2 },
      'USD': { symbol: '$', decimals: 2 },
      'EUR': { symbol: '€', decimals: 2 },
      'ARS': { symbol: '$', decimals: 2 },
      'CLP': { symbol: '$', decimals: 0 },
      'COP': { symbol: '$', decimals: 0 },
      'PEN': { symbol: 'S/', decimals: 2 },
      'MXN': { symbol: '$', decimals: 2 },
      'UYU': { symbol: '$U', decimals: 2 },
      'VES': { symbol: 'Bs', decimals: 2 }
    };
    
    const config = currencyMap[currentCurrency] || { symbol: 'Bs', decimals: 2 };
    return `${config.symbol} ${amount.toLocaleString('es-ES', { 
      minimumFractionDigits: config.decimals, 
      maximumFractionDigits: config.decimals 
    })}`;
  };
  
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'expense' | 'income'>('all');

  // Usar transacciones de Supabase si están disponibles, sino usar localStorage
  const currentTransactions = user && supabaseTransactions.length > 0 
    ? supabaseTransactions.map(tx => ({
        id: tx.id,
        type: tx.tipo === 'gasto' ? 'expense' : 'income',
        amount: tx.monto,
        category: tx.categoria,
        description: tx.descripcion || '',
        date: tx.fecha,
        receipt: tx.url_comprobante
      }))
    : transactions;

  // Filtrar transacciones
  const filteredTransactions = currentTransactions.filter(tx => {
    const categoryLabel = getCategoryLabel(tx.category);
    const matchesSearch = tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         categoryLabel.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || tx.type === filterType;
    return matchesSearch && matchesType;
  });

  // Obtener estadísticas de las transacciones filtradas
  const stats = getStats(filteredTransactions);

  // Agrupar transacciones por fecha (usando hora local, no UTC)
  const groupedByDate = filteredTransactions.reduce((acc, tx) => {
    const txDate = new Date(tx.date);
    const year = txDate.getFullYear();
    const month = String(txDate.getMonth() + 1).padStart(2, '0');
    const day = String(txDate.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    if (!acc[dateStr]) {
      acc[dateStr] = [];
    }
    acc[dateStr].push(tx);
    return acc;
  }, {} as Record<string, typeof transactions>);

  const sortedDates = Object.keys(groupedByDate).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  const formatDate = (dateStr: string) => {
    // Parsear la fecha en formato YYYY-MM-DD como hora local
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Comparar solo año, mes y día (sin hora)
    const isSameDay = (d1: Date, d2: Date) => {
      return d1.getFullYear() === d2.getFullYear() &&
             d1.getMonth() === d2.getMonth() &&
             d1.getDate() === d2.getDate();
    };

    if (isSameDay(date, today)) {
      return 'Hoy';
    } else if (isSameDay(date, yesterday)) {
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
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            📜 Historial
          </h1>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 text-center">
            <p className="text-xs text-white/80 mb-1">Ingresos</p>
            <p className="text-xs font-bold text-white">{formatAmountWithCurrency(stats.totalIncome)}</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 text-center">
            <p className="text-xs text-white/80 mb-1">Gastos</p>
            <p className="text-xs font-bold text-white">{formatAmountWithCurrency(stats.totalExpenses)}</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 text-center">
            <p className="text-xs text-white/80 mb-1">Balance</p>
            <p className={`text-xs font-bold ${stats.balance >= 0 ? 'text-green-300' : 'text-red-300'}`}>
              {formatAmountWithCurrency(stats.balance)}
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
            className="flex-1 bg-transparent text-xs text-gray-900 focus:outline-none placeholder-gray-400"
          />
        </div>

        {/* Filtros de tipo */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilterType('all')}
            className={`flex-1 py-2 px-4 rounded-xl font-semibold text-xs transition-all ${
              filterType === 'all'
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
                : 'bg-white text-gray-600 border-2 border-gray-200'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setFilterType('expense')}
            className={`flex-1 py-2 px-4 rounded-xl font-semibold text-xs transition-all ${
              filterType === 'expense'
                ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md'
                : 'bg-white text-gray-600 border-2 border-gray-200'
            }`}
          >
            Gastos
          </button>
          <button
            onClick={() => setFilterType('income')}
            className={`flex-1 py-2 px-4 rounded-xl font-semibold text-xs transition-all ${
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
            <p className="text-gray-500 text-xs">No hay transacciones</p>
            <p className="text-gray-400 text-xs mt-1">Comienza a registrar tus gastos e ingresos</p>
          </div>
        ) : (
          sortedDates.map(date => (
            <div key={date}>
              {/* Fecha */}
              <div className="flex items-center gap-2 mb-3">
                <Calendar size={16} className="text-purple-600" />
                <h3 className="text-xs font-bold text-purple-900 capitalize">
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
                            <p className="font-semibold text-gray-900 text-xs capitalize">
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
                        <p className={`text-sm font-bold ${
                          tx.type === 'expense' ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {tx.type === 'expense' ? '-' : '+'}{formatAmountWithCurrency(tx.amount)}
                        </p>
                        <button
                          onClick={async () => {
                            if (confirm('¿Eliminar esta transacción?')) {
                              if (user) {
                                // Usar Supabase si hay usuario
                                await deleteSupabaseTransaction(tx.id);
                              } else {
                                // Fallback a localStorage
                                deleteTransaction(tx.id);
                              }
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



