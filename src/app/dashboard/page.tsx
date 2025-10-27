"use client";

import { useState, useEffect } from 'react';
import { TrendingDown, TrendingUp, Calendar, Type } from 'lucide-react';
import { useSupabase } from '@/contexts/SupabaseContext';
import { useCurrency } from '@/hooks/useCurrency';
import { useVoice } from '@/contexts/VoiceContext';
import { getCategoryLabel } from '@/components/TransactionModal';
import TextTransactionModal from '@/components/TextTransactionModal';
import VoiceTransactionModal from '@/components/VoiceTransactionModal';
import { useVoiceRecording } from '@/hooks/useVoiceRecording';

// Función auxiliar para comparar fechas de manera robusta
const isToday = (transactionDate: string): boolean => {
  const today = new Date();
  const txDate = new Date(transactionDate);
  
  // Obtener fechas en zona horaria local (sin UTC)
  const todayLocal = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const txDateLocal = new Date(txDate.getFullYear(), txDate.getMonth(), txDate.getDate());
  
  return todayLocal.getTime() === txDateLocal.getTime();
};

export default function DashboardPage() {
  const { user, supabaseTransactions, addTransaction, getTodayMovements } = useSupabase();
  const { formatAmount, currency, updateCurrencyFromSupabase } = useCurrency();
  const { voiceData, setVoiceData } = useVoice();
  
  // Sincronizar moneda con Supabase cuando el usuario cambie
  useEffect(() => {
    if (user?.moneda) {
      updateCurrencyFromSupabase(user.moneda);
    }
  }, [user?.moneda, updateCurrencyFromSupabase]);
  const [dailyBudget, setDailyBudget] = useState(0);
  const [userName, setUserName] = useState('');
  const [showTextModal, setShowTextModal] = useState(false);
  
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
    handleDateErrorModalClose
  } = useVoiceRecording();

  // Cargar presupuesto diario y nombre del usuario
  useEffect(() => {
    if (user) {
      setUserName(user.nombre.split(' ')[0]);
      setDailyBudget(user.presupuesto_diario || 0);
    }
  }, [user]);

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
    console.log('📝 Datos procesados del texto:', groqData);
    // Usar el contexto de voz para texto
    setVoiceData({
      transcriptionText: 'Texto procesado',
      groqData: groqData,
      source: 'text'
    });
  };

  return (
    <div className="pt-[40px] px-4 pb-24">
      {/* Header */}
      <div className="mb-3" style={{ marginTop: 0 }}>
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
            <div>
              <p className="text-lg font-bold text-gray-900">{todayMovements.length}</p>
              <p className="text-xs text-gray-600">Movimientos</p>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de transacciones de hoy */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Movimientos HOY</h2>
        </div>

        {todayMovements.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100">
            <div className="w-16 h-16 rounded-full bg-gray-100 mx-auto mb-3 flex items-center justify-center">
              <TrendingUp size={32} className="text-gray-400" />
            </div>
            <p className="text-gray-600 mb-1">No hay movimientos hoy</p>
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
    </div>
  );
}
