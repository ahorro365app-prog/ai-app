"use client";

import { useState } from 'react';
import { Calendar, TrendingDown, TrendingUp, Search, Edit2, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCurrency } from '@/hooks/useCurrency';
import { useSupabase } from '@/contexts/SupabaseContext';
import { useModal } from '@/contexts/ModalContext';
import { getCategoryLabel } from '@/components/TransactionModal';
import ConfirmModal from '@/components/ConfirmModal';

export default function HistoryPage() {
  const router = useRouter();
  const { formatAmount, currency } = useCurrency();
  const { user, supabaseTransactions, deleteSupabaseTransaction, updateSupabaseTransaction, getAllMovements } = useSupabase();
  const { setModalOpen } = useModal();
  // Usar moneda de Supabase si está disponible
  const currentCurrency = user?.moneda || currency;
  
  // Estado para el modal de confirmación de eliminación
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    transactionId: string;
    transactionName: string;
  }>({
    isOpen: false,
    transactionId: '',
    transactionName: ''
  });
  
  // Estado para el gráfico de gastos
  const [chartPeriod, setChartPeriod] = useState<'week' | 'month'>('week');
  const [chartType, setChartType] = useState<'expenses' | 'income'>('expenses');
  const [isChartExpanded, setIsChartExpanded] = useState(true);
  
  // Estado para el swipe
  const [swipeStartX, setSwipeStartX] = useState(0);
  const [swipeDeltaX, setSwipeDeltaX] = useState(0);
  
  // Función para abrir el modal de confirmación
  const handleDeleteClick = (transactionId: string, transactionName: string) => {
    setDeleteModal({
      isOpen: true,
      transactionId,
      transactionName
    });
    setModalOpen(true);
    // Cerrar opciones de swipe
    setSwipeState({ startX: 0, deltaX: 0, activeId: null, showOptions: false });
  };

  // Función para cerrar modal de opciones
  const handleCloseOptionsModal = () => {
    setOptionsModal({ isOpen: false, transactionId: '', transactionName: '', transactionAmount: 0 });
    setModalOpen(false);
  };

  // Función para abrir modal de edición desde el modal de opciones (solo transacciones regulares)
  const handleEditFromOptions = () => {
    // Cerrar modal de opciones sin afectar la barra inferior
    setOptionsModal({ isOpen: false, transactionId: '', transactionName: '', transactionAmount: 0 });
    
    // Abrir modal de edición (solo para transacciones regulares)
    setEditModal({
      isOpen: true,
      transactionId: optionsModal.transactionId,
      currentAmount: optionsModal.transactionAmount,
      newAmount: optionsModal.transactionAmount.toString()
    });
    // No llamar setModalOpen(false) aquí, mantener la barra oculta
  };

  // Función para abrir modal de eliminación desde el modal de opciones (solo transacciones regulares)
  const handleDeleteFromOptions = () => {
    // Cerrar modal de opciones sin afectar la barra inferior
    setOptionsModal({ isOpen: false, transactionId: '', transactionName: '', transactionAmount: 0 });
    
    // Abrir modal de eliminación (solo para transacciones regulares)
    setDeleteModal({
      isOpen: true,
      transactionId: optionsModal.transactionId,
      transactionName: optionsModal.transactionName,
      transactionAmount: optionsModal.transactionAmount
    });
    // No llamar setModalOpen(false) aquí, mantener la barra oculta
  };

  // Función para cerrar modal de edición
  const handleCloseEditModal = () => {
    setEditModal({ isOpen: false, transactionId: '', currentAmount: 0, newAmount: '' });
    setModalOpen(false);
  };

  // Función para confirmar edición
  const handleConfirmEdit = async () => {
    if (user && editModal.transactionId && editModal.newAmount) {
      try {
        const newAmount = parseFloat(editModal.newAmount);
        if (newAmount > 0) {
          await updateSupabaseTransaction(editModal.transactionId, {
            monto: newAmount
          });
          handleCloseEditModal();
        }
      } catch (error) {
        console.error('Error al editar transacción:', error);
      }
    }
  };

  // Función para confirmar la eliminación
  const handleConfirmDelete = async () => {
    if (user && deleteModal.transactionId) {
      try {
        await deleteSupabaseTransaction(deleteModal.transactionId);
        setDeleteModal({ isOpen: false, transactionId: '', transactionName: '' });
        setModalOpen(false);
      } catch (error) {
        console.error('Error al eliminar transacción:', error);
      }
    }
  };

  // Función para cancelar la eliminación
  const handleCancelDelete = () => {
    setDeleteModal({ isOpen: false, transactionId: '', transactionName: '' });
    setModalOpen(false);
  };
  
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
    
    const config = currencyMap[currentCurrency as keyof typeof currencyMap] || { symbol: 'Bs', decimals: 2 };
    return `${config.symbol} ${amount.toLocaleString('es-ES', { 
      minimumFractionDigits: config.decimals, 
      maximumFractionDigits: config.decimals 
    })}`;
  };
  
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'expense' | 'income'>('all');

  // Estado para swipe con opciones
  const [swipeState, setSwipeState] = useState<{
    startX: number;
    deltaX: number;
    activeId: string | null;
    showOptions: boolean;
  }>({ startX: 0, deltaX: 0, activeId: null, showOptions: false });

  // Estado para modal de edición
  const [editModal, setEditModal] = useState<{
    isOpen: boolean;
    transactionId: string;
    currentAmount: number;
    newAmount: string;
  }>({ isOpen: false, transactionId: '', currentAmount: 0, newAmount: '' });

  // Estado para modal flotante de opciones
  const [optionsModal, setOptionsModal] = useState<{
    isOpen: boolean;
    transactionId: string;
    transactionName: string;
    transactionAmount: number;
  }>({ isOpen: false, transactionId: '', transactionName: '', transactionAmount: 0 });

  const handleSwipeStart = (transactionId: string) => (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setSwipeState({ startX: touch.clientX, deltaX: 0, activeId: transactionId, showOptions: false });
  };

  const handleSwipeMove = (transactionId: string) => (e: React.TouchEvent) => {
    if (swipeState.activeId !== transactionId) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - swipeState.startX;
    // Solo permitir movimiento hacia la izquierda
    setSwipeState((prev) => ({ ...prev, deltaX: Math.min(0, deltaX) }));
  };

  const handleSwipeEnd = (transactionId: string, transactionName: string, transactionAmount: number) => () => {
    if (swipeState.activeId !== transactionId) {
      setSwipeState({ startX: 0, deltaX: 0, activeId: null, showOptions: false });
      return;
    }
    // Umbral de 80px para mostrar modal flotante
    if (swipeState.deltaX < -80) {
      setOptionsModal({
        isOpen: true,
        transactionId,
        transactionName,
        transactionAmount
      });
      setModalOpen(true);
    }
    // Restablecer posición
    setSwipeState({ startX: 0, deltaX: 0, activeId: null, showOptions: false });
  };

  // Usar transacciones de Supabase
  const currentTransactions = supabaseTransactions.map(tx => ({
        id: tx.id,
        type: tx.tipo === 'gasto' ? 'expense' : 'income',
        amount: tx.monto,
        category: tx.categoria,
        description: tx.descripcion || '',
        date: tx.fecha,
        receipt: tx.url_comprobante,
        paymentMethod: (tx as any).metodo_pago || 'cash'
      }));

  // Obtener todos los movimientos (transacciones + pagos de deudas + ahorros de metas)
  const allMovements = getAllMovements();
  
  // Convertir movimientos al formato esperado por el historial
  const currentMovements = allMovements.map(movement => ({
    id: movement.id,
    type: movement.tipo === 'gasto' ? 'expense' : 'income',
    amount: movement.monto,
    category: movement.categoria,
    description: movement.descripcion,
    date: movement.fecha,
    receipt: movement.url_comprobante,
    paymentMethod: movement.metodo_pago || 'cash',
    tipo_movimiento: movement.tipo_movimiento,
    marco_color: movement.marco_color,
    deuda_info: movement.deuda_info,
    meta_info: movement.meta_info
  }));

  // Filtrar movimientos
  const filteredTransactions = currentMovements.filter(movement => {
    const categoryLabel = getCategoryLabel(movement.category);
    const matchesSearch = movement.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         categoryLabel.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || movement.type === filterType;
    return matchesSearch && matchesType;
  });

  // Obtener estadísticas de los movimientos filtrados
  const stats = filteredTransactions.reduce((acc, movement) => {
    if (movement.type === 'income') {
      acc.totalIncome += movement.amount;
    } else {
      acc.totalExpenses += movement.amount;
    }
    return acc;
  }, { totalIncome: 0, totalExpenses: 0 });
  
  const balance = stats.totalIncome - stats.totalExpenses;

  // Función para obtener datos del gráfico según el período
  const getChartData = () => {
    const now = new Date();
    const data: { label: string; value: number; date: Date }[] = [];
    
    // Filtrar movimientos por tipo (gastos o ingresos) según chartType
    const filteredByType = allMovements.filter(movement => {
      if (chartType === 'expenses') {
        return movement.tipo === 'gasto';
      } else {
        return movement.tipo === 'ingreso';
      }
    });
    
    if (chartPeriod === 'week') {
      // Movimientos por día de lunes a domingo de la semana actual
      const today = new Date();
      const dayOfWeek = today.getDay(); // 0 = domingo, 1 = lunes, ..., 6 = sábado
      const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Ajustar para que lunes = 0
      
      const monday = new Date(today);
      monday.setDate(today.getDate() - daysFromMonday);
      monday.setHours(0, 0, 0, 0);
      
      const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
      
      for (let i = 0; i < 7; i++) {
        const dayStart = new Date(monday);
        dayStart.setDate(monday.getDate() + i);
        dayStart.setHours(0, 0, 0, 0);
        
        const dayEnd = new Date(dayStart);
        dayEnd.setHours(23, 59, 59, 999);
        
        const dayAmount = filteredByType
          .filter(movement => {
            const movementDate = new Date(movement.fecha);
            return movementDate >= dayStart && movementDate <= dayEnd;
          })
          .reduce((sum, movement) => sum + movement.monto, 0);
        
        const dayLabel = dayNames[i];
        data.push({ label: dayLabel, value: dayAmount, date: dayStart });
      }
    } else if (chartPeriod === 'month') {
      // Últimos 6 meses
      for (let i = 5; i >= 0; i--) {
        const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
        monthEnd.setHours(23, 59, 59, 999);
        
        const monthAmount = filteredByType
          .filter(movement => {
            const movementDate = new Date(movement.fecha);
            return movementDate >= monthStart && movementDate <= monthEnd;
          })
          .reduce((sum, movement) => sum + movement.monto, 0);
        
        const monthLabel = monthStart.toLocaleDateString('es-ES', { month: 'short' });
        data.push({ label: monthLabel, value: monthAmount, date: monthStart });
      }
    }
    
    return data;
  };

  const chartData = getChartData();
  const maxValue = Math.max(...chartData.map(d => d.value), 1);

  // Funciones para manejar el swipe del gráfico
  const handleChartSwipeStart = (e: React.TouchEvent) => {
    setSwipeStartX(e.touches[0].clientX);
    setSwipeDeltaX(0);
  };

  const handleChartSwipeMove = (e: React.TouchEvent) => {
    const deltaX = e.touches[0].clientX - swipeStartX;
    setSwipeDeltaX(deltaX);
  };

  const handleChartSwipeEnd = () => {
    const threshold = 50; // Mínimo de píxeles para activar el cambio
    
    if (Math.abs(swipeDeltaX) > threshold) {
      if (swipeDeltaX > 0 && chartType === 'income') {
        // Swipe a la derecha desde ingresos -> gastos
        setChartType('expenses');
      } else if (swipeDeltaX < 0 && chartType === 'expenses') {
        // Swipe a la izquierda desde gastos -> ingresos
        setChartType('income');
      }
    }
    
    setSwipeDeltaX(0);
  };

  // Agrupar movimientos por fecha (usando hora local, no UTC)
  const groupedByDate = filteredTransactions.reduce((acc, movement) => {
    const movementDate = new Date(movement.date);
    const year = movementDate.getFullYear();
    const month = String(movementDate.getMonth() + 1).padStart(2, '0');
    const day = String(movementDate.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    if (!acc[dateStr]) {
      acc[dateStr] = [];
    }
    acc[dateStr].push(movement);
    return acc;
  }, {} as Record<string, typeof currentTransactions>);

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
    <div className="pb-24" style={{ marginTop: 0 }}>
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 pt-[40px] pb-2 shadow-lg">
        <div className="mb-0">
          <h1 className="text-xl font-bold text-white flex items-center gap-1">
            📜 Historial
          </h1>
        </div>
      </div>

      {/* Persiana del gráfico - Se oculta completamente cuando está colapsada */}
      {isChartExpanded && (
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 relative">
        <div 
          className="bg-white/10 backdrop-blur-sm rounded-b-2xl p-4 transition-all duration-300"
          onTouchStart={handleChartSwipeStart}
          onTouchMove={handleChartSwipeMove}
          onTouchEnd={handleChartSwipeEnd}
        >
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-3">
              <h3 className={`text-lg font-bold ${chartType === 'expenses' ? 'text-red-200' : 'text-green-200'}`}>
                {chartType === 'expenses' ? '💸 Gastos' : '💰 Ingresos'} por Período
              </h3>
              <div className="flex gap-1">
                <div className={`w-1.5 h-1.5 rounded-full ${chartType === 'expenses' ? 'bg-red-300' : 'bg-white/40'}`}></div>
                <div className={`w-1.5 h-1.5 rounded-full ${chartType === 'income' ? 'bg-green-300' : 'bg-white/40'}`}></div>
              </div>
              <div className="flex gap-1 bg-white/20 rounded-lg p-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setChartPeriod('week');
                  }}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                    chartPeriod === 'week'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-white/80 hover:text-white'
                  }`}
                >
                  Semana
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setChartPeriod('month');
                  }}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                    chartPeriod === 'month'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-white/80 hover:text-white'
                  }`}
                >
                  Mes
                </button>
              </div>
            </div>
          </div>
          
          {/* Gráfico de barras */}
          <div className="mt-4">
              <div className="flex items-end justify-between gap-1 h-32">
                {chartData.map((item, index) => {
                  const height = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
                  const gradientColors = chartType === 'expenses' ? [
                    'from-red-300 to-red-500',
                    'from-pink-300 to-pink-500',
                    'from-orange-300 to-orange-500',
                    'from-amber-300 to-amber-500',
                    'from-yellow-300 to-yellow-500',
                    'from-red-400 to-red-600',
                    'from-rose-300 to-rose-500'
                  ] : [
                    'from-green-300 to-green-500',
                    'from-emerald-300 to-emerald-500',
                    'from-teal-300 to-teal-500',
                    'from-cyan-300 to-cyan-500',
                    'from-blue-300 to-blue-500',
                    'from-green-400 to-green-600',
                    'from-lime-300 to-lime-500'
                  ];
                  
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center">
                      <div className="w-full flex flex-col items-center">
                        {/* Valor sobre la barra */}
                        {item.value > 0 && (
                          <div className={`text-[10px] font-semibold mb-2 leading-tight ${chartType === 'expenses' ? 'text-red-200' : 'text-green-200'}`}>
                            {formatAmountWithCurrency(item.value)}
                          </div>
                        )}
                        
                        {/* Barra */}
                        <div className="w-full bg-white/20 rounded-t-lg h-20 flex items-end">
                          <div
                            className={`w-full bg-gradient-to-t ${gradientColors[index % gradientColors.length]} rounded-t-lg transition-all duration-500 ease-out`}
                            style={{ height: `${height}%` }}
                          />
                        </div>
                        
                        {/* Etiqueta */}
                        <div className="text-xs text-white/80 mt-2 font-medium">
                          {item.label}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Información adicional */}
              <div className="mt-3 pt-3 border-t border-white/20">
                <div className={`flex justify-between text-xs ${chartType === 'expenses' ? 'text-red-200' : 'text-green-200'}`}>
                  <span>Total: {formatAmountWithCurrency(chartData.reduce((sum, item) => sum + item.value, 0))}</span>
                  <span>Promedio: {formatAmountWithCurrency(chartData.reduce((sum, item) => sum + item.value, 0) / chartData.length)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Botón de la flecha - siempre visible */}
      <div className="relative">
        <div className="flex justify-center">
          <button
            onClick={() => setIsChartExpanded(!isChartExpanded)}
            className="w-12 h-12 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all bg-gradient-to-r from-blue-600 to-purple-600 -mt-6 z-10"
          >
            <span className={`text-white text-lg transition-transform duration-300 ${isChartExpanded ? 'rotate-180' : ''}`}>
              ⌄
            </span>
          </button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="px-4 pt-4 pb-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl p-3 text-center shadow-sm border border-gray-100">
            <p className="text-xs text-gray-600 mb-1">Ingresos</p>
            <p className="text-xs font-bold text-gray-900">{formatAmountWithCurrency(stats.totalIncome)}</p>
          </div>
          <div className="bg-white rounded-xl p-3 text-center shadow-sm border border-gray-100">
            <p className="text-xs text-gray-600 mb-1">Gastos</p>
            <p className="text-xs font-bold text-gray-900">{formatAmountWithCurrency(stats.totalExpenses)}</p>
          </div>
          <div className="bg-white rounded-xl p-3 text-center shadow-sm border border-gray-100">
            <p className="text-xs text-gray-600 mb-1">Balance</p>
            <p className={`text-xs font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatAmountWithCurrency(balance)}
            </p>
          </div>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <div className="px-4 space-y-3">
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
      <div className="px-4 pt-6 space-y-8">
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
                {groupedByDate[date].map((movement: any) => (
                  <div
                    key={movement.id}
                    className={`relative rounded-2xl transition-all shadow-sm overflow-hidden ${
                      movement.marco_color 
                        ? `border-2 hover:border-gray-300 ${movement.marco_color}` 
                        : 'border border-gray-100 hover:border-gray-200 bg-white'
                    }`}
                    style={{
                      transform: swipeState.activeId === movement.id 
                        ? `translateX(${swipeState.deltaX}px)` 
                        : 'translateX(0)',
                      transition: swipeState.activeId === movement.id ? 'none' : 'transform 200ms ease-out'
                    }}
                  >
                    {/* Línea roja delgada al lado derecho - solo para transacciones regulares */}
                    {movement.tipo_movimiento === 'transaccion' && (
                      <div className="absolute top-0 right-0 w-1 h-full bg-red-500 rounded-r-2xl"></div>
                    )}
                    
                    {/* Contenido principal de la transacción */}
                    <div className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {movement.type === 'expense' ? (
                              <TrendingDown size={16} className="text-red-500" />
                            ) : (
                              <TrendingUp size={16} className="text-green-500" />
                            )}
                            <span className="text-xs text-gray-500">
                              {new Date(movement.date).toLocaleTimeString('es-ES', { 
                                hour: '2-digit', 
                                minute: '2-digit',
                                hour12: false 
                              })}
                            </span>
                            <p className="font-semibold text-gray-900 capitalize text-xs">
                              {getCategoryLabel(movement.category)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">
                              {movement.paymentMethod === 'cash' && '💵 Efectivo'}
                              {movement.paymentMethod === 'card' && '💳 Tarjeta'}
                              {movement.paymentMethod === 'transfer' && '📱 Transferencia'}
                              {movement.paymentMethod === 'qr' && '📲 QR'}
                              {movement.paymentMethod === 'other' && '📎 Otro'}
                              {!movement.paymentMethod && '💵 Efectivo'}
                            </span>
                            {movement.description && (
                              <span className="text-xs text-gray-400 truncate">
                                {movement.description}
                              </span>
                            )}
                          </div>
                        </div>
                        <div 
                          onTouchStart={movement.tipo_movimiento === 'transaccion' ? handleSwipeStart(movement.id) : undefined}
                          onTouchMove={movement.tipo_movimiento === 'transaccion' ? handleSwipeMove(movement.id) : undefined}
                          onTouchEnd={movement.tipo_movimiento === 'transaccion' ? handleSwipeEnd(movement.id, `${movement.type === 'expense' ? 'Gasto' : 'Ingreso'} de ${formatAmountWithCurrency(movement.amount)}`, movement.amount) : undefined}
                          className={`flex items-center gap-2 ${movement.tipo_movimiento === 'transaccion' ? 'cursor-pointer' : ''}`}
                        >
                          <p className={`text-sm font-bold ${
                            movement.type === 'expense' ? 'text-red-600' : 'text-green-600'
                          }`}>
                            {movement.type === 'expense' ? '-' : '+'}{formatAmountWithCurrency(movement.amount)}
                          </p>
                          {/* Los indicadores de tipo ya no son necesarios porque la categoría ya lo indica */}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
      {/* Modal de confirmación para eliminar transacción */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        type="danger"
        title="Eliminar transacción"
        message={`¿Estás seguro de que quieres eliminar la transacción "${deleteModal.transactionName}"?\nEsta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
      />

      {/* Modal flotante de opciones */}
      {optionsModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl animate-scale-in">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                <Edit2 size={32} className="text-blue-600" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Acciones</h3>
                <p className="text-sm text-gray-600">{optionsModal.transactionName}</p>
              </div>
            </div>
            
            {/* Botones de acción */}
            <div className="space-y-3 mb-6">
              <button
                onClick={handleEditFromOptions}
                className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold hover:opacity-90 transition-all shadow-lg flex items-center justify-center gap-3"
              >
                <Edit2 size={20} />
                Editar Monto
              </button>
              
              <button
                onClick={handleDeleteFromOptions}
                className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold hover:opacity-90 transition-all shadow-lg flex items-center justify-center gap-3"
              >
                <Trash2 size={20} />
                Eliminar
              </button>
            </div>
            
            {/* Botón cancelar */}
            <div className="flex gap-3">
              <button
                onClick={handleCloseOptionsModal}
                className="flex-1 py-3.5 px-4 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-all"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de edición de transacción */}
      {editModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl animate-scale-in">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                <Edit2 size={32} className="text-blue-600" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Editar Monto</h3>
                <p className="text-sm text-gray-600">
                  Monto actual: <span className="font-semibold">{formatAmountWithCurrency(editModal.currentAmount)}</span>
                </p>
              </div>
            </div>
            
            {/* Campo de entrada */}
            <div className="mb-6">
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                Nuevo monto
              </label>
              <input
                type="number"
                value={editModal.newAmount}
                onChange={(e) => setEditModal(prev => ({ ...prev, newAmount: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border-2 border-gray-200 focus:border-blue-500 focus:outline-none modal-input"
                placeholder="0.00"
                step="0.01"
                min="0"
                autoFocus
              />
            </div>
            
            {/* Botones */}
            <div className="flex gap-3">
              <button
                onClick={handleCloseEditModal}
                className="flex-1 py-3.5 px-4 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmEdit}
                disabled={!editModal.newAmount || parseFloat(editModal.newAmount) <= 0}
                className={`flex-1 py-3.5 px-4 rounded-xl font-semibold transition-all ${
                  editModal.newAmount && parseFloat(editModal.newAmount) > 0
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:opacity-90 shadow-lg'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



