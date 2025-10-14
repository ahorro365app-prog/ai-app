"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabase } from '@/contexts/SupabaseContext';
import { CheckCircle, AlertTriangle, Database, Trash2, Download } from 'lucide-react';

interface LocalData {
  user: any;
  transactions: any[];
  debts: any[];
  goals: any[];
}

export default function MigrateLocalDataPage() {
  const router = useRouter();
  const { user, addTransaction, addDebt, addGoal, updateUser } = useSupabase();
  const [localData, setLocalData] = useState<LocalData>({
    user: null,
    transactions: [],
    debts: [],
    goals: []
  });
  const [migrationStatus, setMigrationStatus] = useState<'ready' | 'migrating' | 'completed' | 'error'>('ready');
  const [migrationProgress, setMigrationProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Cargar datos de localStorage
  useEffect(() => {
    const userData = localStorage.getItem('user');
    const transactions = JSON.parse(localStorage.getItem('userTransactions') || '[]');
    const debts = JSON.parse(localStorage.getItem('userDebts') || '[]');
    const goals = JSON.parse(localStorage.getItem('userGoals') || '[]');

    setLocalData({
      user: userData ? JSON.parse(userData) : null,
      transactions,
      debts,
      goals
    });
  }, []);

  const hasLocalData = localData.transactions.length > 0 || 
                      localData.debts.length > 0 || 
                      localData.goals.length > 0 ||
                      localData.user;

  const startMigration = async () => {
    if (!user) {
      setErrorMessage('No hay usuario de Supabase disponible');
      setMigrationStatus('error');
      return;
    }

    setMigrationStatus('migrating');
    setMigrationProgress(0);
    setErrorMessage('');

    try {
      let progress = 0;
      const totalSteps = 4;

      // 1. Migrar datos del usuario
      if (localData.user) {
        await updateUser({
          nombre: localData.user.name || localData.user.nombre || user.nombre,
          correo: localData.user.email || localData.user.correo || user.correo,
          telefono: localData.user.phone || localData.user.telefono || user.telefono,
          pais: localData.user.country || localData.user.pais || user.pais,
          moneda: localData.user.currency || localData.user.moneda || user.moneda,
          presupuesto_diario: localData.user.dailyBudget || localData.user.presupuesto_diario || user.presupuesto_diario
        });
      }
      progress = 25;
      setMigrationProgress(progress);

      // 2. Migrar transacciones
      for (const transaction of localData.transactions) {
        await addTransaction({
          tipo: transaction.type === 'expense' ? 'gasto' : 'ingreso',
          monto: transaction.amount,
          categoria: transaction.category,
          descripcion: transaction.description,
          fecha: transaction.date,
          url_comprobante: transaction.receipt
        });
      }
      progress = 50;
      setMigrationProgress(progress);

      // 3. Migrar deudas
      for (const debt of localData.debts) {
        await addDebt({
          nombre: debt.name,
          monto_total: debt.totalAmount || debt.monto_total,
          monto_pagado: debt.paidAmount || debt.monto_pagado || 0,
          fecha_vencimiento: debt.dueDate || debt.fecha_vencimiento,
          es_mensual: debt.isMonthlyPayment || debt.es_mensual || false,
          dia_mensual: debt.monthlyPaymentDay || debt.dia_mensual,
          historial_pagos: debt.paymentHistory || debt.historial_pagos || []
        });
      }
      progress = 75;
      setMigrationProgress(progress);

      // 4. Migrar metas
      for (const goal of localData.goals) {
        await addGoal({
          nombre: goal.name,
          monto_objetivo: goal.targetAmount || goal.monto_objetivo,
          monto_actual: goal.currentAmount || goal.monto_actual || 0,
          fecha_objetivo: goal.targetDate || goal.fecha_objetivo,
          categoria: goal.category,
          prioridad: goal.priority || 'media',
          descripcion: goal.description || goal.descripcion,
          historial_ahorros: goal.savingsHistory || goal.historial_ahorros || []
        });
      }
      progress = 100;
      setMigrationProgress(progress);

      setMigrationStatus('completed');

    } catch (error: any) {
      setErrorMessage(error.message || 'Error durante la migración');
      setMigrationStatus('error');
      console.error('Error en migración:', error);
    }
  };

  const clearLocalData = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('userTransactions');
    localStorage.removeItem('userDebts');
    localStorage.removeItem('userGoals');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userPhone');
    localStorage.removeItem('userCountry');
    localStorage.removeItem('userCurrency');
    localStorage.removeItem('dailyBudget');
    localStorage.removeItem('isDebtsEnabled');
    localStorage.removeItem('isGoalsEnabled');
    localStorage.removeItem('userSubscription');
    
    setLocalData({
      user: null,
      transactions: [],
      debts: [],
      goals: []
    });
    setShowConfirmModal(false);
  };

  const exportLocalData = () => {
    const dataToExport = {
      timestamp: new Date().toISOString(),
      user: localData.user,
      transactions: localData.transactions,
      debts: localData.debts,
      goals: localData.goals
    };

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ahorro365-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4 pb-24">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Migración de Datos a Supabase
        </h1>

        {/* Estado del usuario */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Database className="text-blue-600" size={20} />
            Estado del Usuario
          </h2>
          {user ? (
            <div className="text-green-600 flex items-center gap-2">
              <CheckCircle size={16} />
              Usuario de Supabase disponible: {user.nombre} ({user.correo})
            </div>
          ) : (
            <div className="text-red-600 flex items-center gap-2">
              <AlertTriangle size={16} />
              No hay usuario de Supabase disponible
            </div>
          )}
        </div>

        {/* Datos locales encontrados */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Database className="text-orange-600" size={20} />
            Datos en localStorage
          </h2>
          
          {hasLocalData ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-600">{localData.transactions.length}</div>
                  <div className="text-sm text-gray-600">Transacciones</div>
                </div>
                <div className="bg-green-50 p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600">{localData.debts.length}</div>
                  <div className="text-sm text-gray-600">Deudas</div>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-purple-600">{localData.goals.length}</div>
                  <div className="text-sm text-gray-600">Metas</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg text-center">
                  <div className="text-2xl font-bold text-gray-600">{localData.user ? '1' : '0'}</div>
                  <div className="text-sm text-gray-600">Usuario</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-gray-500 text-center py-4">
              No se encontraron datos en localStorage
            </div>
          )}
        </div>

        {/* Botones de acción */}
        {hasLocalData && user && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Acciones</h2>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={startMigration}
                disabled={migrationStatus === 'migrating'}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl shadow-lg hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Database size={16} />
                {migrationStatus === 'migrating' ? 'Migrando...' : 'Migrar a Supabase'}
              </button>
              
              <button
                onClick={exportLocalData}
                className="px-6 py-3 bg-green-600 text-white rounded-xl shadow-lg hover:bg-green-700 transition-all flex items-center justify-center gap-2"
              >
                <Download size={16} />
                Exportar Respaldo
              </button>
              
              <button
                onClick={() => setShowConfirmModal(true)}
                className="px-6 py-3 bg-red-600 text-white rounded-xl shadow-lg hover:bg-red-700 transition-all flex items-center justify-center gap-2"
              >
                <Trash2 size={16} />
                Limpiar localStorage
              </button>
            </div>
          </div>
        )}

        {/* Barra de progreso */}
        {migrationStatus === 'migrating' && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Progreso de Migración</h3>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${migrationProgress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 mt-2">{migrationProgress}% completado</p>
          </div>
        )}

        {/* Estado de migración */}
        {migrationStatus === 'completed' && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6">
            <div className="flex items-center gap-2 text-green-800">
              <CheckCircle size={20} />
              <h3 className="text-lg font-semibold">¡Migración Completada!</h3>
            </div>
            <p className="text-green-700 mt-2">
              Todos los datos han sido migrados exitosamente a Supabase.
            </p>
            <button
              onClick={() => router.push('/dashboard')}
              className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all"
            >
              Ir al Dashboard
            </button>
          </div>
        )}

        {migrationStatus === 'error' && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
            <div className="flex items-center gap-2 text-red-800">
              <AlertTriangle size={20} />
              <h3 className="text-lg font-semibold">Error en la Migración</h3>
            </div>
            <p className="text-red-700 mt-2">{errorMessage}</p>
          </div>
        )}

        {/* Modal de confirmación */}
        {showConfirmModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold mb-4">Confirmar Limpieza</h3>
              <p className="text-gray-600 mb-6">
                ¿Estás seguro de que quieres eliminar todos los datos de localStorage? 
                Esta acción no se puede deshacer.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={clearLocalData}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Información adicional */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Información Importante</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• La migración transferirá todos los datos de localStorage a Supabase</li>
            <li>• Los datos originales permanecerán en localStorage hasta que los elimines</li>
            <li>• Es recomendable hacer un respaldo antes de migrar</li>
            <li>• Después de migrar, puedes eliminar los datos de localStorage</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
