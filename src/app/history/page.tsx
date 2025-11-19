"use client";

import { useState } from 'react';
import { Calendar, TrendingDown, TrendingUp, Edit2, Trash2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCurrency } from '@/hooks/useCurrency';
import { useSupabase } from '@/contexts/SupabaseContext';
import { useModal } from '@/contexts/ModalContext';
import { getCategoryLabel } from '@/components/TransactionModal';
import ConfirmModal from '@/components/ConfirmModal';
import { getPlanLimits } from '@/lib/planLimits';
import { logger } from '@/lib/logger';

// Categorías disponibles
const EXPENSE_CATEGORIES = [
  { id: 'comida', label: 'Comida', emoji: '🍽️' },
  { id: 'transporte', label: 'Transporte', emoji: '🚗' },
  { id: 'entretenimiento', label: 'Entretenimiento', emoji: '🎬' },
  { id: 'compras', label: 'Compras', emoji: '🛍️' },
  { id: 'salud', label: 'Salud', emoji: '💊' },
  { id: 'servicios', label: 'Servicios', emoji: '💡' },
  { id: 'educacion', label: 'Educación', emoji: '📚' },
  { id: 'ropa', label: 'Ropa', emoji: '👕' },
  { id: 'hogar', label: 'Hogar', emoji: '🏠' },
  { id: 'otros', label: 'Otro', emoji: '📦' },
];

const INCOME_CATEGORIES = [
  { id: 'salario', label: 'Salario', emoji: '💰' },
  { id: 'freelance', label: 'Freelance', emoji: '💼' },
  { id: 'inversion', label: 'Inversión', emoji: '📈' },
  { id: 'regalo', label: 'Regalo', emoji: '🎁' },
  { id: 'venta', label: 'Venta', emoji: '🤝' },
  { id: 'otros', label: 'Otro', emoji: '💵' },
];

const PAYMENT_METHODS = [
  { id: 'efectivo', label: '💵 Efectivo' },
  { id: 'tarjeta', label: '💳 Tarjeta' },
  { id: 'transferencia', label: '📱 Transferencia' },
  { id: 'qr', label: '📲 QR' },
  { id: 'cheque', label: '📝 Cheque' },
  { id: 'otro', label: '📎 Otro' },
];

export default function HistoryPage() {
  const router = useRouter();
  const { formatAmount, currency } = useCurrency();
  const { user, supabaseTransactions, deleteSupabaseTransaction, updateSupabaseTransaction, getAllMovements } = useSupabase();
  const { setModalOpen } = useModal();
  // Usar moneda de Supabase si está disponible
  const currentCurrency = user?.moneda || currency;
  
  // Verificar si el usuario tiene acceso al historial completo
  const currentPlan = user?.suscripcion || 'free';
  const planLimits = getPlanLimits(currentPlan);
  const hasFullHistoryAccess = planLimits.historicalDataLimit !== null;
  
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
    // Buscar la transacción completa
    const transaction = currentMovements.find(m => m.id === optionsModal.transactionId);
    
    if (!transaction) {
      logger.error('Transacción no encontrada');
      return;
    }
    
    // Cerrar modal de opciones sin afectar la barra inferior
    setOptionsModal({ isOpen: false, transactionId: '', transactionName: '', transactionAmount: 0 });
    
    // Preparar fecha para el input date (formato YYYY-MM-DD)
    const transactionDate = new Date(transaction.date);
    const year = transactionDate.getFullYear();
    const month = String(transactionDate.getMonth() + 1).padStart(2, '0');
    const day = String(transactionDate.getDate()).padStart(2, '0');
    const fechaStr = `${year}-${month}-${day}`;
    
    // Abrir modal de edición con todos los datos
    setEditModal({
      isOpen: true,
      transactionId: transaction.id,
      tipo: transaction.type === 'expense' ? 'gasto' : 'ingreso',
      monto: transaction.amount,
      categoria: transaction.category,
      descripcion: transaction.description || '',
      metodo_pago: transaction.paymentMethod || 'efectivo',
      fecha: fechaStr
    });
  };

  // Función para abrir modal de eliminación desde el modal de opciones (solo transacciones regulares)
  const handleDeleteFromOptions = () => {
    // Cerrar modal de opciones sin afectar la barra inferior
    setOptionsModal({ isOpen: false, transactionId: '', transactionName: '', transactionAmount: 0 });
    
          // Abrir modal de eliminación (solo para transacciones regulares)
      setDeleteModal({
        isOpen: true,
        transactionId: optionsModal.transactionId,
        transactionName: optionsModal.transactionName
      });
    // No llamar setModalOpen(false) aquí, mantener la barra oculta
  };

  // Función para cerrar modal de edición
  const handleCloseEditModal = () => {
    setEditModal({ 
      isOpen: false, 
      transactionId: '', 
      tipo: 'gasto',
      monto: 0,
      categoria: '',
      descripcion: '',
      metodo_pago: 'efectivo',
      fecha: new Date().toISOString().split('T')[0]
    });
    setModalOpen(false);
  };

  // Función para confirmar edición
  const handleConfirmEdit = async () => {
    if (user && editModal.transactionId) {
      try {
        // Validar que el monto sea mayor que 0
        if (editModal.monto <= 0) {
          alert('El monto debe ser mayor que 0');
          return;
        }
        
        // Validar que la categoría esté seleccionada
        if (!editModal.categoria) {
          alert('Por favor selecciona una categoría');
          return;
        }
        
        // Actualizar la transacción usando updateSupabaseTransaction
        // Esto actualizará automáticamente el estado local
        await updateSupabaseTransaction(editModal.transactionId, {
          tipo: editModal.tipo,
          monto: editModal.monto,
          categoria: editModal.categoria,
          descripcion: editModal.descripcion || null,
          metodo_pago: editModal.metodo_pago
        });
        
        handleCloseEditModal();
      } catch (error) {
        logger.error('Error al editar transacción:', error);
        alert('Error al editar la transacción. Por favor intenta de nuevo.');
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
        logger.error('Error al eliminar transacción:', error);
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
    tipo: 'ingreso' | 'gasto';
    monto: number;
    categoria: string;
    descripcion: string;
    metodo_pago: string;
    fecha: string;
  }>({ 
    isOpen: false, 
    transactionId: '', 
    tipo: 'gasto',
    monto: 0,
    categoria: '',
    descripcion: '',
    metodo_pago: 'efectivo',
    fecha: new Date().toISOString().split('T')[0]
  });

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
    const matchesType = filterType === 'all' || movement.type === filterType;
    
    // Filtrar por fecha: solo últimos 3 días
    let matchesDate = true;
    const movementDate = new Date(movement.date);
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    threeDaysAgo.setHours(0, 0, 0, 0);
    matchesDate = movementDate >= threeDaysAgo;
    
    return matchesType && matchesDate;
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
    // Extraer año, mes y día en la zona horaria del país del usuario
    // Esto es crítico para evitar que transacciones después de 9 PM se muestren al día siguiente
    const userCountry = user?.pais || 'BO';
    const timeZone = userCountry === 'BO' ? 'America/La_Paz' : 
                     userCountry === 'AR' ? 'America/Argentina/Buenos_Aires' :
                     userCountry === 'BR' ? 'America/Sao_Paulo' :
                     userCountry === 'CL' ? 'America/Santiago' :
                     userCountry === 'CO' ? 'America/Bogota' :
                     userCountry === 'EC' ? 'America/Guayaquil' :
                     userCountry === 'PE' ? 'America/Lima' :
                     userCountry === 'PY' ? 'America/Asuncion' :
                     userCountry === 'UY' ? 'America/Montevideo' :
                     userCountry === 'VE' ? 'America/Caracas' :
                     userCountry === 'MX' ? 'America/Mexico_City' :
                     userCountry === 'US' ? 'America/New_York' :
                     'America/La_Paz';
    
    const movementDate = new Date(movement.date);
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    
    const parts = formatter.formatToParts(movementDate);
    const year = parts.find(p => p.type === 'year')?.value || '';
    const month = parts.find(p => p.type === 'month')?.value || '';
    const day = parts.find(p => p.type === 'day')?.value || '';
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
    // Obtener país del usuario para usar su zona horaria
    const userCountry = user?.pais || 'BO';
    const timeZone = userCountry === 'BO' ? 'America/La_Paz' : 
                     userCountry === 'AR' ? 'America/Argentina/Buenos_Aires' :
                     userCountry === 'BR' ? 'America/Sao_Paulo' :
                     userCountry === 'CL' ? 'America/Santiago' :
                     userCountry === 'CO' ? 'America/Bogota' :
                     userCountry === 'EC' ? 'America/Guayaquil' :
                     userCountry === 'PE' ? 'America/Lima' :
                     userCountry === 'PY' ? 'America/Asuncion' :
                     userCountry === 'UY' ? 'America/Montevideo' :
                     userCountry === 'VE' ? 'America/Caracas' :
                     userCountry === 'MX' ? 'America/Mexico_City' :
                     userCountry === 'US' ? 'America/New_York' :
                     'America/La_Paz';
    
    // Parsear la fecha en formato YYYY-MM-DD
    const [year, month, day] = dateStr.split('-').map(Number);
    
    // Crear fecha en la zona horaria del país usando Intl.DateTimeFormat
    const formatter = new Intl.DateTimeFormat('es-ES', {
      timeZone: timeZone,
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    });
    
    // Crear una fecha que represente el día en la zona horaria del país
    const dateInCountry = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
    const formattedDate = formatter.format(dateInCountry);
    
    // Obtener fecha de hoy en la zona horaria del país
    const now = new Date();
    const todayFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const todayParts = todayFormatter.formatToParts(now);
    const todayYear = parseInt(todayParts.find(p => p.type === 'year')?.value || '0', 10);
    const todayMonth = parseInt(todayParts.find(p => p.type === 'month')?.value || '0', 10);
    const todayDay = parseInt(todayParts.find(p => p.type === 'day')?.value || '0', 10);
    
    const yesterdayFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const yesterdayDate = new Date(now);
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayParts = yesterdayFormatter.formatToParts(yesterdayDate);
    const yesterdayYear = parseInt(yesterdayParts.find(p => p.type === 'year')?.value || '0', 10);
    const yesterdayMonth = parseInt(yesterdayParts.find(p => p.type === 'month')?.value || '0', 10);
    const yesterdayDay = parseInt(yesterdayParts.find(p => p.type === 'day')?.value || '0', 10);

    // Comparar solo año, mes y día (sin hora)
    const isSameDay = (y1: number, m1: number, d1: number, y2: number, m2: number, d2: number) => {
      return y1 === y2 && m1 === m2 && d1 === d2;
    };

    if (isSameDay(year, month, day, todayYear, todayMonth, todayDay)) {
      return 'Hoy';
    } else if (isSameDay(year, month, day, yesterdayYear, yesterdayMonth, yesterdayDay)) {
      return 'Ayer';
    } else {
      return formattedDate;
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
          <div>
          {sortedDates.map((date, index) => (
            <div 
              key={date}
              className={index > 0 ? 'pt-4' : ''}
            >
              {/* Fecha con resumen de gastos e ingresos */}
              <div className="flex items-center gap-2 mb-4">
                <Calendar size={16} className="text-purple-600" />
                <h3 className="text-xs font-bold text-purple-900 capitalize">
                  {formatDate(date)}
                </h3>
                {(() => {
                  // Calcular sumatorias del día
                  const dayMovements = groupedByDate[date];
                  const totalExpenses = dayMovements
                    .filter((m: any) => m.type === 'expense')
                    .reduce((sum: number, m: any) => sum + m.amount, 0);
                  const totalIncome = dayMovements
                    .filter((m: any) => m.type === 'income')
                    .reduce((sum: number, m: any) => sum + m.amount, 0);
                  
                  return (
                    <div className="flex items-center gap-2 ml-2">
                      {totalExpenses > 0 && (
                        <span className="text-xs font-semibold text-red-600">
                          GASTO: {formatAmountWithCurrency(totalExpenses)}
                        </span>
                      )}
                      {totalIncome > 0 && (
                        <span className="text-xs font-semibold text-green-600">
                          INGRESO: {formatAmountWithCurrency(totalIncome)}
                        </span>
                      )}
                    </div>
                  );
                })()}
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
          ))}
          
          {/* Botón para ver historial completo (solo si tiene acceso) */}
          {hasFullHistoryAccess && (
            <div className="pt-6 pb-2">
              <button
                onClick={() => router.push('/history/full')}
                className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold text-sm shadow-lg hover:opacity-90 transition-all flex items-center justify-center gap-2"
              >
                <Calendar size={20} />
                VER HISTORIAL COMPLETO
              </button>
            </div>
          )}
          </div>
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
                  Editar
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
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in overflow-y-auto">
            <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl animate-scale-in my-8">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <Edit2 size={24} className="text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Editar Transacción</h3>
                    <p className="text-xs text-gray-500">Modifica todos los campos</p>
                  </div>
                </div>
                <button
                  onClick={handleCloseEditModal}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                >
                  <X size={18} className="text-gray-600" />
                </button>
              </div>

              <div className="space-y-4 max-h-[calc(100vh-250px)] overflow-y-auto pr-2">
                {/* Tipo de transacción */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">
                    Tipo
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        const newTipo = 'gasto';
                        const availableCategories = EXPENSE_CATEGORIES.map(c => c.id);
                        setEditModal(prev => ({
                          ...prev,
                          tipo: newTipo,
                          categoria: availableCategories.includes(prev.categoria) ? prev.categoria : ''
                        }));
                      }}
                      className={`py-3 px-4 rounded-xl font-semibold text-xs transition-all ${
                        editModal.tipo === 'gasto'
                          ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      <TrendingDown size={16} className="inline mr-2" />
                      Gasto
                    </button>
                    <button
                      onClick={() => {
                        const newTipo = 'ingreso';
                        const availableCategories = INCOME_CATEGORIES.map(c => c.id);
                        setEditModal(prev => ({
                          ...prev,
                          tipo: newTipo,
                          categoria: availableCategories.includes(prev.categoria) ? prev.categoria : ''
                        }));
                      }}
                      className={`py-3 px-4 rounded-xl font-semibold text-xs transition-all ${
                        editModal.tipo === 'ingreso'
                          ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      <TrendingUp size={16} className="inline mr-2" />
                      Ingreso
                    </button>
                  </div>
                </div>

                {/* Monto */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">
                    Monto *
                  </label>
                  <input
                    type="number"
                    value={editModal.monto || ''}
                    onChange={(e) => setEditModal(prev => ({ ...prev, monto: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border-2 border-gray-200 focus:border-blue-500 focus:outline-none text-sm text-gray-900 font-medium"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    autoFocus
                  />
                </div>

                {/* Categoría */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">
                    Categoría *
                  </label>
                  <select
                    value={editModal.categoria}
                    onChange={(e) => setEditModal(prev => ({ ...prev, categoria: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border-2 border-gray-200 focus:border-blue-500 focus:outline-none text-sm text-gray-900 font-medium"
                  >
                    <option value="">Selecciona una categoría</option>
                    {(editModal.tipo === 'gasto' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.emoji} {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Método de pago */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">
                    Método de Pago
                  </label>
                  <select
                    value={editModal.metodo_pago}
                    onChange={(e) => setEditModal(prev => ({ ...prev, metodo_pago: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border-2 border-gray-200 focus:border-blue-500 focus:outline-none text-sm text-gray-900 font-medium"
                  >
                    {PAYMENT_METHODS.map(method => (
                      <option key={method.id} value={method.id}>
                        {method.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Descripción */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">
                    Descripción
                  </label>
                  <input
                    type="text"
                    value={editModal.descripcion}
                    onChange={(e) => setEditModal(prev => ({ ...prev, descripcion: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border-2 border-gray-200 focus:border-blue-500 focus:outline-none text-sm text-gray-900 font-medium placeholder-gray-400"
                    placeholder="Descripción opcional"
                  />
                </div>
              </div>

              {/* Botones */}
              <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={handleCloseEditModal}
                  className="flex-1 py-3.5 px-4 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-all text-sm"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmEdit}
                  disabled={!editModal.monto || editModal.monto <= 0 || !editModal.categoria}
                  className={`flex-1 py-3.5 px-4 rounded-xl font-semibold transition-all text-sm ${
                    editModal.monto && editModal.monto > 0 && editModal.categoria
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:opacity-90 shadow-lg'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Guardar Cambios
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}


