"use client";

import { useState } from 'react';
import { useSupabase } from '@/contexts/SupabaseContext';

export default function TestIntegrationPage() {
  const { user, addTransaction, addDebt, addGoal } = useSupabase();
  const [status, setStatus] = useState('Listo para probar');

  const testAddTransaction = async () => {
    setStatus('Probando transacción...');
    try {
      await addTransaction({
        type: 'expense',
        amount: 25.50,
        category: 'Alimentación',
        description: 'Prueba de transacción',
        date: new Date().toISOString(),
        receipt_url: null
      });
      setStatus('✅ Transacción agregada exitosamente');
    } catch (error) {
      setStatus('❌ Error al agregar transacción');
      console.error('Error:', error);
    }
  };

  const testAddDebt = async () => {
    setStatus('Probando deuda...');
    try {
      await addDebt({
        name: 'Prueba de deuda',
        total_amount: 1000.00,
        paid_amount: 0,
        due_date: null,
        is_monthly: false,
        monthly_day: null,
        payment_history: []
      });
      setStatus('✅ Deuda agregada exitosamente');
    } catch (error) {
      setStatus('❌ Error al agregar deuda');
      console.error('Error:', error);
    }
  };

  const testAddGoal = async () => {
    setStatus('Probando meta...');
    try {
      await addGoal({
        name: 'Prueba de meta',
        target_amount: 5000.00,
        current_amount: 0,
        target_date: null,
        category: 'Prueba',
        priority: 'media',
        description: 'Meta de prueba',
        savings_history: []
      });
      setStatus('✅ Meta agregada exitosamente');
    } catch (error) {
      setStatus('❌ Error al agregar meta');
      console.error('Error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4 pb-24 flex flex-col items-center justify-center text-center">
      <h1 className="text-xl font-bold text-gray-900 mb-4">Prueba de Integración Supabase</h1>
      
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6 max-w-md">
        <h2 className="text-xl font-semibold mb-4">Usuario actual:</h2>
        {user ? (
          <div className="text-left">
            <p><strong>Nombre:</strong> {user.name}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>ID:</strong> {user.id}</p>
          </div>
        ) : (
          <p className="text-gray-500">No hay usuario cargado</p>
        )}
      </div>

      <div className="space-y-4 mb-6">
        <button
          onClick={testAddTransaction}
          className="block w-full px-6 py-3 bg-blue-600 text-white rounded-xl shadow-lg hover:bg-blue-700 transition-all"
        >
          Probar Agregar Transacción
        </button>

        <button
          onClick={testAddDebt}
          className="block w-full px-6 py-3 bg-red-600 text-white rounded-xl shadow-lg hover:bg-red-700 transition-all"
        >
          Probar Agregar Deuda
        </button>

        <button
          onClick={testAddGoal}
          className="block w-full px-6 py-3 bg-green-600 text-white rounded-xl shadow-lg hover:bg-green-700 transition-all"
        >
          Probar Agregar Meta
        </button>
      </div>

      <p className={`text-xl font-semibold ${
        status.includes('✅') ? 'text-green-600' :
        status.includes('❌') ? 'text-red-600' :
        'text-gray-600'
      }`}>
        Estado: {status}
      </p>

      <div className="mt-8">
        <a 
          href="/test-supabase-integration" 
          className="inline-block px-6 py-3 bg-purple-600 text-white rounded-xl shadow-lg hover:bg-purple-700 transition-all"
        >
          Ver Datos en Supabase
        </a>
      </div>
    </div>
  );
}
