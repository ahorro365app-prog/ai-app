"use client";

// IMPORTANTE: Este componente NO debe usar lazy loading
// Next.js intentará usar React.lazy automáticamente, pero con output: 'export'
// esto puede causar problemas. Forzamos carga eager.

// Forzar carga inmediata del módulo (no lazy loading)
// Esto asegura que el módulo se cargue tan pronto como se importe
import { useState, useEffect } from 'react';
import { TrendingDown, TrendingUp, Calendar, Type } from 'lucide-react';
import { useSupabase } from '@/contexts/SupabaseContext';
import { useCurrency } from '@/hooks/useCurrency';
import { useVoice } from '@/contexts/VoiceContext';
import { getCategoryLabel } from '@/components/TransactionModal';
import TextTransactionModal from '@/components/TextTransactionModal';
import VoiceTransactionModal from '@/components/VoiceTransactionModal';
import AudioDurationLimitModal from '@/components/AudioDurationLimitModal';
import DailyTransactionLimitModal from '@/components/DailyTransactionLimitModal';
import OnboardingTutorial from '@/components/OnboardingTutorial';
import LoadingScreen from '@/components/LoadingScreen';
import { useVoiceRecording } from '@/hooks/useVoiceRecording';
import { logger } from '@/lib/logger';
import { getTodayForCountry, buildISODateFromString, getTimezoneForCountry } from '@/lib/dateUtils';

// Forzar la ejecución del código del módulo inmediatamente
if (typeof window !== 'undefined') {
  // Este código se ejecuta tan pronto como el módulo se importa
  logger.debug('📦 DashboardPage: MÓDULO IMPORTADO - Código del módulo ejecutándose');
}

// Función auxiliar para comparar fechas de manera robusta
const isToday = (transactionDate: string): boolean => {
  const today = new Date();
  const txDate = new Date(transactionDate);
  
  // Obtener fechas en zona horaria local (sin UTC)
  const todayLocal = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const txDateLocal = new Date(txDate.getFullYear(), txDate.getMonth(), txDate.getDate());
  
  return todayLocal.getTime() === txDateLocal.getTime();
};

// Log GLOBAL antes de la definición del componente para verificar que el módulo se carga
// Este log se ejecuta cuando el módulo se importa/carga
if (typeof window !== 'undefined') {
  logger.debug('📦 DashboardPage: MÓDULO CARGADO - El archivo se está ejecutando (window disponible)');
} else {
  logger.debug('📦 DashboardPage: MÓDULO CARGADO - El archivo se está ejecutando (SSR)');
}

// Forzar la carga del módulo inmediatamente si estamos en el cliente
if (typeof window !== 'undefined') {
  // Registrar que el módulo se cargó
  (window as any).__DASHBOARD_MODULE_LOADED__ = true;
  logger.debug('📦 DashboardPage: Módulo registrado en window.__DASHBOARD_MODULE_LOADED__');
}

// Función del componente - EXPORTADA COMO DEFAULT
export default function DashboardPage() {
  // Log INMEDIATO al inicio del componente, antes de cualquier hook
  // Este log DEBE aparecer cuando React ejecuta el componente
  logger.debug('📱 DashboardPage: Componente INICIADO (antes de hooks)');
  logger.debug('📱 DashboardPage: Stack trace:', new Error().stack);
  
  // Forzar un log adicional para verificar que el componente se está ejecutando
  if (typeof window !== 'undefined') {
    (window as any).__DASHBOARD_COMPONENT_EXECUTED__ = true;
    (window as any).__DASHBOARD_COMPONENT_EXECUTED_TIME__ = Date.now();
    logger.debug('📱 DashboardPage: Componente marcado como ejecutado en window');
  }
  
  const { user, supabaseTransactions, addTransaction, getTodayMovements, getTodayDeletedCount, getTodayActiveCount, getTodayYesterdayCount, updateUser, loading } = useSupabase();
  // IMPORTANTE: Llamar a TODOS los hooks ANTES de cualquier return condicional
  const { country, formatAmount, currency, updateCurrencyFromSupabase } = useCurrency();
  const { voiceData, setVoiceData } = useVoice();
  
  // Estados locales - TODOS los hooks deben estar aquí
  const [dailyBudget, setDailyBudget] = useState(0);
  const [userName, setUserName] = useState('');
  const [showTextModal, setShowTextModal] = useState(false);
  const [deletedCount, setDeletedCount] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [yesterdayCount, setYesterdayCount] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  // Voice recording hook
  const {
    isRecording,
    startRecording,
    stopRecording,
    showModal: showVoiceModal,
    modalTranscriptionText,
    modalGroqData,
    handleModalClose: handleVoiceModalClose,
    handleModalSave: handleVoiceModalSave,
    handleModalCancel: handleVoiceModalCancel,
    showDateErrorModal,
    dateError,
    handleDateErrorModalClose,
    // Estados del modal de límite de duración
    showDurationLimitModal,
    setShowDurationLimitModal,
    // Estados del modal de límite diario de transacciones
    showDailyLimitModal,
    setShowDailyLimitModal,
    dailyLimitInfo
  } = useVoiceRecording();

  // Sincronizar moneda con Supabase cuando el usuario cambie
  useEffect(() => {
    if (user?.moneda) {
      updateCurrencyFromSupabase(user.moneda);
    }
  }, [user?.moneda, updateCurrencyFromSupabase]);

  // Cargar presupuesto diario y nombre del usuario
  useEffect(() => {
    if (user) {
      setUserName(user.nombre.split(' ')[0]);
      setDailyBudget(user.presupuesto_diario || 0);
      
      // Verificar si debe mostrar el tutorial de onboarding desde Supabase
      // IMPORTANTE: Solo mostrar si explícitamente es false
      // Si es undefined o true, NO mostrar (asumir que ya lo vio o no aplica)
      // Esto evita que se muestre el tutorial cada vez que se reinstala la app
      if (user.has_seen_onboarding === false) {
        logger.debug('Mostrando tutorial de onboarding: has_seen_onboarding = false');
        setShowOnboarding(true);
      } else {
        logger.debug('No mostrando tutorial:', {
          has_seen_onboarding: user.has_seen_onboarding,
        });
        setShowOnboarding(false);
      }
    }
  }, [user]);

  // Cargar contadores de transacciones HOY
  useEffect(() => {
    const loadCounts = async () => {
      if (user) {
        const [deleted, active, yesterday] = await Promise.all([
          getTodayDeletedCount(),
          getTodayActiveCount(),
          getTodayYesterdayCount()
        ]);
        setDeletedCount(deleted);
        setActiveCount(active);
        setYesterdayCount(yesterday);
      }
    };
    loadCounts();
  }, [user, getTodayDeletedCount, getTodayActiveCount, getTodayYesterdayCount, supabaseTransactions]); // Recargar cuando cambien las transacciones
  
  logger.debug('📱 DashboardPage: Componente renderizado DESPUÉS de hooks');
  logger.debug('📊 DashboardPage: Estado del contexto:', {
    hasUser: !!user,
    loading,
    transactionsCount: supabaseTransactions?.length || 0,
    shouldRender: !loading && !!user
  });
  
  // Si todavía está cargando, mostrar loading
  if (loading) {
    logger.debug('⏳ DashboardPage: Aún cargando, esperando...');
    return null; // No renderizar nada mientras carga
  }
  
  // Si no hay usuario después de cargar, podría ser un problema
  if (!user) {
    logger.warn('⚠️ DashboardPage: No hay usuario después de cargar');
    return null;
  }
  
  logger.debug('✅ DashboardPage: Renderizando contenido del dashboard');

  // Obtener todos los movimientos de hoy (transacciones + pagos de deudas + ahorros de metas)
  const todayMovements = getTodayMovements();
  
  const stats = todayMovements.reduce((acc, movement) => {
    if (movement.tipo === 'ingreso') {
      acc.totalIncome += movement.monto;
    } else {
      acc.totalExpenses += movement.monto;
    }
    return acc;
  }, { totalIncome: 0, totalExpenses: 0 });
  
  stats.balance = stats.totalIncome - stats.totalExpenses;

  const budgetPercentage = dailyBudget > 0 
    ? Math.min((stats.totalExpenses / dailyBudget) * 100, 100)
    : 0;

  // Función para manejar el procesamiento de texto
  const handleTextProcess = (groqData: any) => {
    logger.debug('📝 Datos procesados del texto:', groqData);
    // Usar el contexto de voz para texto
    setVoiceData({
      transcriptionText: 'Texto procesado',
      groqData: groqData,
      source: 'text'
    });
  };

  // Mostrar loading screen si está cargando o si no hay usuario
  if (loading || !user) {
    return <LoadingScreen />;
  }

  return (
    <div className="pt-[40px] px-4 pb-24">
      {/* Header */}
      <div className="mb-3" style={{ marginTop: 0 }}>
        <h1 className="text-xl font-bold text-gray-900 mb-1">
          Hola {userName ? `${userName} 👋` : '👋'}
        </h1>
        <p className="text-gray-600">
          {(() => {
            // Obtener fecha de hoy en la zona horaria del país del usuario
            const userCountry = country || 'BO';
            const todayString = getTodayForCountry(userCountry);
            const [year, month, day] = todayString.split('-').map(Number);
            
            // Obtener zona horaria del país usando función helper
            const timeZone = getTimezoneForCountry(userCountry);
            
            // Crear fecha en la zona horaria del país usando Intl.DateTimeFormat
            const formatter = new Intl.DateTimeFormat('es-ES', {
              timeZone: timeZone,
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            });
            
            // Crear una fecha que represente el día de hoy en la zona horaria del país
            const now = new Date();
            return formatter.format(now);
          })()}
        </p>
      </div>

      {/* Resumen del día */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-6 mb-3 text-white shadow-xl">
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
      <div className="grid grid-cols-2 gap-4 mb-3">
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
            <div className="flex-1">
              <p className="text-lg font-bold text-gray-900">
                <strong>{activeCount}</strong> <span className="text-xs font-normal text-gray-600">Transacciones</span>
              </p>
              {deletedCount > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  {deletedCount === 1 ? '1 Eliminado' : `${deletedCount} Eliminados`}
                </p>
              )}
              {yesterdayCount > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  {yesterdayCount === 1 ? '1 Ayer' : `${yesterdayCount} Ayer`}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Lista de transacciones de hoy */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Transacciones HOY</h2>
        </div>

        {todayMovements.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100">
            <div className="w-16 h-16 rounded-full bg-gray-100 mx-auto mb-3 flex items-center justify-center">
              <TrendingUp size={32} className="text-gray-400" />
            </div>
            <p className="text-gray-600 mb-1">No hay transacciones hoy</p>
            <p className="text-xs text-gray-500">Usa el botón de voz para registrar</p>
          </div>
        ) : (
          <div className="space-y-3">
            {todayMovements.map((movement) => {
              return (
              <div
                key={movement.id}
                className={`rounded-2xl p-4 shadow-sm transition-all ${
                  movement.marco_color 
                    ? `border-2 hover:border-gray-300 ${movement.marco_color}` 
                    : 'border border-gray-100 hover:border-gray-200 bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {movement.tipo === 'gasto' ? (
                        <TrendingDown size={16} className="text-red-500" />
                      ) : (
                        <TrendingUp size={16} className="text-green-500" />
                      )}
                      <span className="text-xs text-gray-500">
                        {new Date(movement.fecha).toLocaleTimeString('es-ES', { 
                          hour: '2-digit', 
                          minute: '2-digit',
                          hour12: false 
                        })}
                      </span>
                      <p className="font-semibold text-gray-900 capitalize text-xs">
                        {getCategoryLabel(movement.categoria)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">
                        {movement.metodo_pago === 'cash' && '💵 Efectivo'}
                        {movement.metodo_pago === 'card' && '💳 Tarjeta'}
                        {movement.metodo_pago === 'transfer' && '📱 Transferencia'}
                        {movement.metodo_pago === 'qr' && '📲 QR'}
                        {movement.metodo_pago === 'other' && '📎 Otro'}
                        {!movement.metodo_pago && '💵 Efectivo'}
                      </span>
                      {movement.descripcion && (
                        <span className="text-xs text-gray-400 truncate">
                          {movement.descripcion}
                        </span>
                      )}
                    </div>
                  </div>
                  <p
                    className={`text-sm font-bold ${
                      movement.tipo === 'gasto' ? 'text-red-600' : 'text-green-600'
                    }`}
                  >
                    {movement.tipo === 'gasto' ? '-' : '+'}{formatAmount(movement.monto)}
                  </p>
                  {/* Los indicadores de tipo ya no son necesarios porque la categoría ya lo indica */}
                </div>
              </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Botones flotantes para agregar transacciones */}
      <div className="fixed bottom-24 right-4 flex flex-col gap-3">
        {/* Botón de texto */}
        <button
          onClick={() => setShowTextModal(true)}
          className="w-14 h-14 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all flex items-center justify-center"
          title="Registrar por texto"
        >
          <Type size={24} />
        </button>
      </div>

      {/* Modales */}
      <TextTransactionModal
        isOpen={showTextModal}
        onClose={() => setShowTextModal(false)}
        onProcess={handleTextProcess}
      />
      
      {/* Modal unificado para audio y texto */}
      <VoiceTransactionModal
        isOpen={!!voiceData}
        onClose={() => setVoiceData(null)}
        onSave={handleVoiceModalSave}
        onCancel={() => setVoiceData(null)}
        transcriptionText={voiceData?.transcriptionText || ''}
        groqData={voiceData?.groqData || null}
        source={voiceData?.source || 'audio'}
      />
      
      {/* Modal de error de fecha */}
      {showDateErrorModal && dateError && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl animate-scale-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <Calendar size={24} className="text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Fecha No Válida</h3>
                <p className="text-sm text-gray-600">La fecha excede el límite permitido</p>
              </div>
            </div>
            
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <Calendar size={20} className="text-red-600 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-800 mb-1">
                    {dateError.message}
                  </p>
                  <p className="text-xs text-red-700">
                    Solo puedes registrar transacciones de los últimos 7 días.
                  </p>
                </div>
              </div>
            </div>
            
            <button
              onClick={handleDateErrorModalClose}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold hover:opacity-90 transition-all shadow-lg"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
      
      {/* Modal de límite de duración de audio */}
      <AudioDurationLimitModal
        isOpen={showDurationLimitModal}
        onClose={() => setShowDurationLimitModal(false)}
        maxDuration={15}
      />
      
      {/* Modal de límite diario de transacciones */}
      {dailyLimitInfo && (
        <DailyTransactionLimitModal
          isOpen={showDailyLimitModal}
          onClose={() => setShowDailyLimitModal(false)}
          currentCount={dailyLimitInfo.currentCount}
          maxDailyTransactions={dailyLimitInfo.maxCount}
        />
      )}
      
      {/* Tutorial de onboarding */}
      {user && (
        <OnboardingTutorial
          isOpen={showOnboarding}
          onClose={async () => {
            setShowOnboarding(false);
            if (user) {
              try {
                // Guardar en Supabase que ya vio el tutorial
                await updateUser({ has_seen_onboarding: true });
              } catch (error) {
                logger.error('Error guardando estado de onboarding:', error);
              }
            }
          }}
          onComplete={async () => {
            setShowOnboarding(false);
            if (user) {
              try {
                // Guardar en Supabase que ya vio el tutorial
                await updateUser({ has_seen_onboarding: true });
              } catch (error) {
                logger.error('Error guardando estado de onboarding:', error);
              }
            }
          }}
        />
      )}
    </div>
  );
}
