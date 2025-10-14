"use client";

import { useSupabase } from '@/contexts/SupabaseContext';

export default function TestSupabaseIntegrationPage() {
  const { user, transactions, debts, goals, loading, error } = useSupabase();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4 pb-24 flex flex-col items-center justify-center text-center">
        <div className="text-xl font-semibold text-gray-600">Cargando datos desde Supabase...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-purple-50 p-4 pb-24 flex flex-col items-center justify-center text-center">
        <div className="text-xl font-semibold text-red-600 mb-4">Error al cargar datos</div>
        <div className="text-sm text-gray-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 p-4 pb-24">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          🎉 ¡Integración con Supabase Exitosa!
        </h1>

        {/* Usuario */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">👤 Usuario</h2>
          {user ? (
            <div className="grid grid-cols-2 gap-4">
              <div><strong>Nombre:</strong> {user.nombre}</div>
              <div><strong>Email:</strong> {user.correo}</div>
              <div><strong>País:</strong> {user.pais}</div>
              <div><strong>Moneda:</strong> {user.moneda}</div>
              <div><strong>Presupuesto diario:</strong> {user.presupuesto_diario || 'No establecido'}</div>
              <div><strong>Suscripción:</strong> {user.suscripcion}</div>
            </div>
          ) : (
            <div className="text-gray-500">No hay usuario cargado</div>
          )}
        </div>

        {/* Transacciones */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">📊 Transacciones ({transactions.length})</h2>
          {transactions.length > 0 ? (
            <div className="space-y-3">
              {transactions.slice(0, 5).map((transaction) => (
                <div key={transaction.id} className="border rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-semibold">{transaction.categoria}</div>
                      <div className="text-sm text-gray-600">{transaction.descripcion}</div>
                    </div>
                    <div className={`font-bold ${transaction.tipo === 'ingreso' ? 'text-green-600' : 'text-red-600'}`}>
                      {transaction.tipo === 'ingreso' ? '+' : '-'}{transaction.monto} {user?.moneda}
                    </div>
                  </div>
                </div>
              ))}
              {transactions.length > 5 && (
                <div className="text-sm text-gray-500 text-center">
                  ... y {transactions.length - 5} más
                </div>
              )}
            </div>
          ) : (
            <div className="text-gray-500">No hay transacciones</div>
          )}
        </div>

        {/* Deudas */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">💳 Deudas ({debts.length})</h2>
          {debts.length > 0 ? (
            <div className="space-y-3">
              {debts.map((debt) => (
                <div key={debt.id} className="border rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-semibold">{debt.nombre}</div>
                      <div className="text-sm text-gray-600">
                        Progreso: {debt.monto_pagado} / {debt.monto_total} {user?.moneda}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-blue-600">
                        {((debt.monto_pagado / debt.monto_total) * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500">No hay deudas</div>
          )}
        </div>

        {/* Metas */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">🎯 Metas ({goals.length})</h2>
          {goals.length > 0 ? (
            <div className="space-y-3">
              {goals.map((goal) => (
                <div key={goal.id} className="border rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-semibold">{goal.nombre}</div>
                      <div className="text-sm text-gray-600">
                        Progreso: {goal.monto_actual} / {goal.monto_objetivo} {user?.moneda}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600">
                        {((goal.monto_actual / goal.monto_objetivo) * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500">No hay metas</div>
          )}
        </div>

        <div className="text-center">
          <a 
            href="/dashboard" 
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-xl shadow-lg hover:bg-blue-700 transition-all"
          >
            Ir al Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
