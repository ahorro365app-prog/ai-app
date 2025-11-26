"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, TrendingDown, TrendingUp, X, ArrowLeft } from 'lucide-react';
import { useCurrency } from '@/hooks/useCurrency';
import { useSupabase } from '@/contexts/SupabaseContext';
import { getCategoryLabel } from '@/components/TransactionModal';
import { getPlanLimits } from '@/lib/planLimits';

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

type PeriodOption = 'today' | 'week' | 'month' | '3months' | 'all' | 'daterange';

export default function FullHistoryPage() {
  const router = useRouter();
  const { formatAmount, currency } = useCurrency();
  const { user, getAllMovements } = useSupabase();
  const currentCurrency = user?.moneda || currency;
  
  // Obtener límites del plan
  const currentPlan = user?.suscripcion || 'free';
  const planLimits = getPlanLimits(currentPlan);
  
  // Verificar si el usuario tiene acceso al historial completo
  const hasAccess = planLimits.historicalDataLimit !== null;
  
  // Si no tiene acceso, redirigir o mostrar mensaje
  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-xl text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <Calendar size={32} className="text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Acceso Restringido</h2>
          <p className="text-gray-700 mb-6">
            Tu plan actual no permite acceder al historial completo. Actualiza a un plan superior para ver todas tus transacciones.
          </p>
          <button
            onClick={() => router.push('/billing')}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold hover:opacity-90 transition-all"
          >
            Ver Planes
          </button>
          <button
            onClick={() => router.back()}
            className="w-full mt-3 py-3 px-4 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-all"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  // Estados de período
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodOption>('month');
  
  // Estados de filtros
  const [filterType, setFilterType] = useState<'all' | 'expense' | 'income'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterPaymentMethod, setFilterPaymentMethod] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  
  // Estados de carga
  const [displayedMovements, setDisplayedMovements] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const itemsPerPage = 30;
  

  // Referencia para el observer de infinite scroll
  const observerTarget = useRef<HTMLDivElement>(null);

  // Función para calcular el rango de fechas según el período
  const getDateRange = (period: PeriodOption): { start: Date; end: Date } => {
    const now = new Date();
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    
    let start = new Date(now);
    
    switch (period) {
      case 'today':
        start.setHours(0, 0, 0, 0);
        break;
      case 'week':
        const dayOfWeek = now.getDay();
        const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        start.setDate(now.getDate() - daysFromMonday);
        start.setHours(0, 0, 0, 0);
        break;
      case 'month':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        start.setHours(0, 0, 0, 0);
        break;
      case '3months':
        start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        start.setHours(0, 0, 0, 0);
        break;
      case 'all':
        // Fecha muy antigua para incluir todo
        start = new Date(2000, 0, 1);
        break;
      case 'daterange':
        // Para rango de fechas personalizado, no usar este método
        start = new Date(2000, 0, 1);
        break;
    }
    
    return { start, end };
  };

  // Función para filtrar movimientos
  const filterMovements = useCallback((movements: any[]): any[] => {
    const { start, end } = getDateRange(selectedPeriod);
    
    return movements.filter(movement => {
      // Filtro por fecha
      const movementDate = new Date(movement.fecha);
      
      // Aplicar límite de historial según el plan
      let matchesHistoricalLimit = true;
      if (planLimits.historicalDataLimit === '4weeks') {
        const fourWeeksAgo = new Date();
        fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
        fourWeeksAgo.setHours(0, 0, 0, 0);
        matchesHistoricalLimit = movementDate >= fourWeeksAgo;
      }
      
      const matchesDate = selectedPeriod === 'all' || selectedPeriod === 'daterange' || (movementDate >= start && movementDate <= end);
      
      // Filtro por tipo
      const matchesType = filterType === 'all' || 
        (filterType === 'expense' && movement.tipo === 'gasto') ||
        (filterType === 'income' && movement.tipo === 'ingreso');
      
      // Filtro por categoría
      const matchesCategory = filterCategory === 'all' || movement.categoria === filterCategory;
      
      // Filtro por método de pago
      const matchesPaymentMethod = filterPaymentMethod === 'all' || 
        (movement.metodo_pago || 'efectivo') === filterPaymentMethod;
      
      // Filtro por rango de fechas personalizado
      let matchesDateRange = true;
      
      if (dateFrom && dateTo) {
        const fromDate = new Date(dateFrom);
        fromDate.setHours(0, 0, 0, 0);
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        matchesDateRange = movementDate >= fromDate && movementDate <= toDate;
      } else if (dateFrom) {
        const fromDate = new Date(dateFrom);
        fromDate.setHours(0, 0, 0, 0);
        matchesDateRange = movementDate >= fromDate;
      } else if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        matchesDateRange = movementDate <= toDate;
      }
      
      // Si hay rango de fechas personalizado o está seleccionado "Rango Fechas", no aplicar el filtro de período
      const shouldApplyPeriodFilter = selectedPeriod !== 'daterange' && (!dateFrom && !dateTo);
      const matchesPeriod = shouldApplyPeriodFilter ? matchesDate : true;
      
      return matchesHistoricalLimit && matchesPeriod && matchesType && matchesCategory && matchesPaymentMethod && matchesDateRange;
    });
  }, [selectedPeriod, filterType, filterCategory, filterPaymentMethod, dateFrom, dateTo, planLimits.historicalDataLimit]);

  // Función para cargar más movimientos
  const loadMoreMovements = useCallback(() => {
    if (isLoading || !hasMore) return;
    
    setIsLoading(true);
    
    // Simular carga asíncrona (pequeño delay para mejor UX)
    setTimeout(() => {
      const allMovements = getAllMovements();
      const filtered = filterMovements(allMovements);
      
      const startIndex = (page - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const newMovements = filtered.slice(startIndex, endIndex);
      
      if (newMovements.length > 0) {
        setDisplayedMovements(prev => [...prev, ...newMovements]);
        setPage(prev => prev + 1);
        setHasMore(endIndex < filtered.length);
      } else {
        setHasMore(false);
      }
      
      setIsLoading(false);
    }, 300);
  }, [isLoading, hasMore, page, getAllMovements, filterMovements]);

  // Efecto para recargar cuando cambian los filtros
  useEffect(() => {
    setPage(1);
    setDisplayedMovements([]);
    setHasMore(true);
    
    const allMovements = getAllMovements();
    const filtered = filterMovements(allMovements);
    
    const initialMovements = filtered.slice(0, itemsPerPage);
    setDisplayedMovements(initialMovements);
    setHasMore(filtered.length > itemsPerPage);
    setPage(2);
  }, [selectedPeriod, filterType, filterCategory, filterPaymentMethod, dateFrom, dateTo, getAllMovements, filterMovements]);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          loadMoreMovements();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, isLoading, loadMoreMovements]);

  // Formatear fecha
  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

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

  // Formatear cantidad con moneda
  const formatAmountWithCurrency = (amount: number) => {
    return formatAmount(amount);
  };

  // Agrupar movimientos por fecha
  const groupedByDate = displayedMovements.reduce((acc, movement) => {
    const movementDate = new Date(movement.fecha);
    const year = movementDate.getFullYear();
    const month = String(movementDate.getMonth() + 1).padStart(2, '0');
    const day = String(movementDate.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    if (!acc[dateStr]) {
      acc[dateStr] = [];
    }
    acc[dateStr].push(movement);
    return acc;
  }, {} as Record<string, any[]>);

  const sortedDates = Object.keys(groupedByDate).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  // Calcular total de resultados
  const allMovements = getAllMovements();
  const totalFiltered = filterMovements(allMovements).length;

  // Limpiar filtros
  const clearFilters = () => {
    setFilterType('all');
    setFilterCategory('all');
    setFilterPaymentMethod('all');
    setSelectedPeriod('month');
    setDateFrom('');
    setDateTo('');
  };


  // Convertir movimientos al formato esperado
  const convertMovement = (movement: any) => ({
    id: movement.id,
    type: movement.tipo === 'gasto' ? 'expense' : 'income',
    amount: movement.monto,
    category: movement.categoria,
    description: movement.descripcion,
    date: movement.fecha,
    receipt: movement.url_comprobante,
    paymentMethod: movement.metodo_pago || 'efectivo',
    tipo_movimiento: movement.tipo_movimiento,
    marco_color: movement.marco_color,
    deuda_info: movement.deuda_info,
    meta_info: movement.meta_info
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 pt-[40px] pb-4 shadow-lg sticky top-0 z-10">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <ArrowLeft size={20} className="text-white" />
          </button>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            📜 Historial Completo
          </h1>
        </div>

        {/* Indicador de resultados */}
        <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
          <p className="text-sm text-white font-medium">
            📊 Mostrando: {displayedMovements.length} de {totalFiltered} transacciones
          </p>
        </div>
      </div>

      {/* Botones rápidos de período */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'today', label: 'Hoy' },
            { id: 'week', label: 'Semana' },
            { id: 'month', label: 'Mes' },
            { id: '3months', label: '3 Meses' },
            { id: 'all', label: 'Todo' },
            { id: 'daterange', label: 'Rango Fechas' }
          ].map(period => (
            <button
              key={period.id}
              onClick={() => {
                setSelectedPeriod(period.id as PeriodOption);
                // Si no es "Rango Fechas", limpiar las fechas
                if (period.id !== 'daterange') {
                  setDateFrom('');
                  setDateTo('');
                }
              }}
              className={`px-4 py-2 rounded-xl font-semibold text-xs transition-all ${
                selectedPeriod === period.id
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md'
                  : 'bg-white text-gray-800 border-2 border-gray-200 hover:border-purple-300'
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filtros secundarios */}
      <div className="px-4 pt-4 pb-2 space-y-3">
        {/* Búsqueda por rango de fechas - solo visible cuando está seleccionado "Rango Fechas" */}
        {selectedPeriod === 'daterange' && (
          <div>
            <p className="text-xs text-gray-700 px-1 mb-2">
              {dateFrom && dateTo 
                ? `Buscando entre ${new Date(dateFrom).toLocaleDateString('es-ES')} y ${new Date(dateTo).toLocaleDateString('es-ES')}`
                : dateFrom 
                  ? `Desde ${new Date(dateFrom).toLocaleDateString('es-ES')}`
                  : dateTo
                    ? `Hasta ${new Date(dateTo).toLocaleDateString('es-ES')}`
                    : 'Selecciona un rango de fechas'}
            </p>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Calendar size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600" />
                <input
                  type="date"
                  placeholder="Fecha desde..."
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border-2 border-gray-200 focus:border-purple-500 focus:outline-none text-sm text-gray-800"
                />
              </div>
              <div className="relative flex-1">
                <Calendar size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600" />
                <input
                  type="date"
                  placeholder="Fecha hasta..."
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  min={dateFrom || undefined}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border-2 border-gray-200 focus:border-purple-500 focus:outline-none text-sm text-gray-800"
                />
              </div>
            </div>
          </div>
        )}

        {/* Filtros de tipo, categoría y método */}
        <div className="grid grid-cols-3 gap-2">
          {/* Tipo */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as 'all' | 'expense' | 'income')}
            className="px-3 py-2 rounded-xl bg-white border-2 border-gray-200 focus:border-purple-500 focus:outline-none text-xs font-semibold text-gray-800"
          >
            <option value="all">Todos</option>
            <option value="expense">Gastos</option>
            <option value="income">Ingresos</option>
          </select>

          {/* Categoría */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 rounded-xl bg-white border-2 border-gray-200 focus:border-purple-500 focus:outline-none text-xs font-semibold text-gray-800"
          >
            <option value="all">Todas</option>
            {filterType === 'all' && (
              <>
                {EXPENSE_CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.emoji} {cat.label}</option>
                ))}
                {INCOME_CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.emoji} {cat.label}</option>
                ))}
              </>
            )}
            {filterType === 'expense' && EXPENSE_CATEGORIES.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.emoji} {cat.label}</option>
            ))}
            {filterType === 'income' && INCOME_CATEGORIES.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.emoji} {cat.label}</option>
            ))}
          </select>

          {/* Método de pago */}
          <select
            value={filterPaymentMethod}
            onChange={(e) => setFilterPaymentMethod(e.target.value)}
            className="px-3 py-2 rounded-xl bg-white border-2 border-gray-200 focus:border-purple-500 focus:outline-none text-xs font-semibold text-gray-800"
          >
            <option value="all">Todos</option>
            {PAYMENT_METHODS.map(method => (
              <option key={method.id} value={method.id}>{method.label}</option>
            ))}
          </select>
        </div>

        {/* Botón limpiar filtros */}
        {(filterType !== 'all' || filterCategory !== 'all' || filterPaymentMethod !== 'all' || selectedPeriod !== 'month' || dateFrom !== '' || dateTo !== '') && (
          <button
            onClick={clearFilters}
            className="w-full py-2 px-4 rounded-xl bg-gray-100 text-gray-700 font-semibold text-xs hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
          >
            <X size={16} />
            Limpiar Filtros
          </button>
        )}
      </div>

      {/* Lista de transacciones */}
      <div className="px-4 pt-6 space-y-8">
        {sortedDates.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-700 text-sm">No hay transacciones</p>
            <p className="text-gray-600 text-xs mt-1">Intenta cambiar los filtros o el período</p>
          </div>
        ) : (
          <>
            {sortedDates.map((date) => (
              <div key={date}>
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
                      .filter((m: any) => {
                        const converted = convertMovement(m);
                        return converted.type === 'expense';
                      })
                      .reduce((sum: number, m: any) => sum + m.monto, 0);
                    const totalIncome = dayMovements
                      .filter((m: any) => {
                        const converted = convertMovement(m);
                        return converted.type === 'income';
                      })
                      .reduce((sum: number, m: any) => sum + m.monto, 0);
                    
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
                  {groupedByDate[date].map((movement: any) => {
                    const converted = convertMovement(movement);
                    return (
                      <div
                        key={movement.id}
                        className={`relative rounded-2xl transition-all shadow-sm overflow-hidden ${
                          movement.marco_color 
                            ? `border-2 hover:border-gray-300 ${movement.marco_color}` 
                            : 'border border-gray-100 hover:border-gray-200 bg-white'
                        }`}
                      >
                        {/* Contenido principal */}
                        <div className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                {converted.type === 'expense' ? (
                                  <TrendingDown size={16} className="text-red-500" />
                                ) : (
                                  <TrendingUp size={16} className="text-green-500" />
                                )}
                                <span className="text-xs text-gray-700">
                                  {new Date(converted.date).toLocaleTimeString('es-ES', { 
                                    hour: '2-digit', 
                                    minute: '2-digit',
                                    hour12: false 
                                  })}
                                </span>
                                <p className="font-semibold text-gray-900 capitalize text-xs">
                                  {getCategoryLabel(converted.category)}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-700">
                                  {converted.paymentMethod === 'efectivo' && '💵 Efectivo'}
                                  {converted.paymentMethod === 'tarjeta' && '💳 Tarjeta'}
                                  {converted.paymentMethod === 'transferencia' && '📱 Transferencia'}
                                  {converted.paymentMethod === 'qr' && '📲 QR'}
                                  {converted.paymentMethod === 'otro' && '📎 Otro'}
                                  {!converted.paymentMethod && '💵 Efectivo'}
                                </span>
                                {converted.description && (
                                  <span className="text-xs text-gray-600 truncate">
                                    {converted.description}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <p className={`text-sm font-bold ${
                                converted.type === 'expense' ? 'text-red-600' : 'text-green-600'
                              }`}>
                                {converted.type === 'expense' ? '-' : '+'}{formatAmountWithCurrency(converted.amount)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Target para infinite scroll */}
            <div ref={observerTarget} className="h-10 flex items-center justify-center">
              {isLoading && (
                <p className="text-gray-700 text-xs">Cargando más transacciones...</p>
              )}
              {!hasMore && displayedMovements.length > 0 && (
                <p className="text-gray-600 text-xs">No hay más transacciones</p>
              )}
            </div>
          </>
        )}
      </div>

    </div>
  );
}
