"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabase } from '@/contexts/SupabaseContext';

export default function TestDatosAutomaticosPage() {
  const router = useRouter();
  const { user, addTransaction, addDebt, addGoal } = useSupabase();
  const [status, setStatus] = useState('Listo para crear datos');
  const [progreso, setProgreso] = useState(0);

  const crearDatosCompletos = async () => {
    setStatus('Creando datos de prueba...');
    setProgreso(0);

    try {
      // 1. Crear 3 transacciones
      setStatus('Creando transacciones...');
      await addTransaction({
        tipo: 'gasto',
        monto: 45.50,
        categoria: 'Alimentación',
        descripcion: 'Almuerzo en restaurante',
        fecha: new Date().toISOString(),
        url_comprobante: null
      });
      setProgreso(20);

      await addTransaction({
        tipo: 'gasto',
        monto: 25.00,
        categoria: 'Transporte',
        descripcion: 'Taxi al trabajo',
        fecha: new Date().toISOString(),
        url_comprobante: null
      });
      setProgreso(40);

      await addTransaction({
        tipo: 'ingreso',
        monto: 1500.00,
        categoria: 'Salario',
        descripcion: 'Pago mensual',
        fecha: new Date().toISOString(),
        url_comprobante: null
      });
      setProgreso(60);

      // 2. Crear 2 deudas
      setStatus('Creando deudas...');
      await addDebt({
        nombre: 'Préstamo del banco',
        monto_total: 5000.00,
        monto_pagado: 1500.00,
        fecha_vencimiento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        es_mensual: true,
        dia_mensual: 15,
        historial_pagos: [
          {
            id: '1',
            amount: 500.00,
            date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
            description: 'Pago registrado el: 15 de octubre de 2025, 10:30',
            receipt_url: null
          },
          {
            id: '2',
            amount: 1000.00,
            date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            description: 'Pago registrado el: 1 de octubre de 2025, 14:15',
            receipt_url: null
          }
        ]
      });
      setProgreso(80);

      await addDebt({
        nombre: 'Tarjeta de crédito',
        monto_total: 2000.00,
        monto_pagado: 800.00,
        fecha_vencimiento: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        es_mensual: false,
        dia_mensual: null,
        historial_pagos: [
          {
            id: '1',
            amount: 800.00,
            date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
            description: 'Pago registrado el: 5 de octubre de 2025, 16:45',
            receipt_url: null
          }
        ]
      });
      setProgreso(90);

      // 3. Crear 2 metas
      setStatus('Creando metas...');
      await addGoal({
        nombre: 'Viaje a Europa',
        monto_objetivo: 10000.00,
        monto_actual: 3500.00,
        fecha_objetivo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        categoria: 'viaje',
        prioridad: 'alta',
        descripcion: 'Ahorrar para un viaje de 2 semanas por Europa',
        historial_ahorros: [
          {
            id: '1',
            amount: 1000.00,
            date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            description: 'Ahorro registrado el: 1 de octubre de 2025, 09:00',
            receipt_url: null
          },
          {
            id: '2',
            amount: 1500.00,
            date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
            description: 'Ahorro registrado el: 15 de octubre de 2025, 11:30',
            receipt_url: null
          },
          {
            id: '3',
            amount: 1000.00,
            date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            description: 'Ahorro registrado el: 25 de octubre de 2025, 15:20',
            receipt_url: null
          }
        ]
      });

      await addGoal({
        nombre: 'Laptop nueva',
        monto_objetivo: 3000.00,
        monto_actual: 1200.00,
        fecha_objetivo: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
        categoria: 'otro',
        prioridad: 'media',
        descripcion: 'Comprar una laptop para trabajo',
        historial_ahorros: [
          {
            id: '1',
            amount: 600.00,
            date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
            description: 'Ahorro registrado el: 10 de octubre de 2025, 13:45',
            receipt_url: null
          },
          {
            id: '2',
            amount: 600.00,
            date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            description: 'Ahorro registrado el: 25 de octubre de 2025, 10:15',
            receipt_url: null
          }
        ]
      });

      setProgreso(100);
      setStatus('✅ ¡Datos creados exitosamente!');
      
      // Redirigir a la página de verificación después de 2 segundos
      setTimeout(() => {
        router.push('/test-supabase-integration');
      }, 2000);

    } catch (error) {
      setStatus('❌ Error al crear datos');
      console.error('Error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4 pb-24 flex flex-col items-center justify-center text-center">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Crear Datos de Prueba Automáticos</h1>
      
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6 max-w-md">
        <h2 className="text-lg font-semibold mb-4">¿Qué se creará?</h2>
        <div className="space-y-2 text-left">
          <p>👤 <span className="font-bold">Usuario:</span> Usuario Demo</p>
          <p>📊 <span className="font-bold">Transacciones:</span> 3 (2 gastos, 1 ingreso)</p>
          <p>💳 <span className="font-bold">Deudas:</span> 2 (préstamo y tarjeta)</p>
          <p>🎯 <span className="font-bold">Metas:</span> 2 (viaje y laptop)</p>
        </div>
      </div>

      <button
        onClick={crearDatosCompletos}
        disabled={status === 'Creando datos de prueba...'}
        className="px-6 py-3 bg-purple-600 text-white rounded-xl shadow-lg hover:bg-purple-700 transition-all mb-4 disabled:opacity-50"
      >
        {status === 'Creando datos de prueba...' ? 'Creando...' : 'Crear Datos Completos'}
      </button>

      {/* Barra de progreso */}
      {status === 'Creando datos de prueba...' && (
        <div className="w-full max-w-md mb-4">
          <div className="bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-purple-600 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${progreso}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 mt-2">{progreso}% completado</p>
        </div>
      )}

      <p className={`text-lg font-semibold ${
        status.includes('✅') ? 'text-green-600' :
        status.includes('❌') ? 'text-red-600' :
        status === 'Creando datos de prueba...' ? 'text-purple-600' :
        'text-gray-600'
      }`}>
        Estado: {status}
      </p>

      <div className="mt-8 text-left text-gray-600 text-sm max-w-md">
        <h4 className="font-bold mb-2">ℹ️ Información:</h4>
        <ul className="list-disc list-inside space-y-1">
          <li>Estos datos se guardarán en Supabase con nombres en español</li>
          <li>Después de crear los datos, serás redirigido a la página de verificación</li>
          <li>Los datos incluyen historial de pagos y ahorros</li>
        </ul>
      </div>

      <div className="mt-6">
        <a 
          href="/test-supabase-integration" 
          className="inline-block px-6 py-3 bg-blue-600 text-white rounded-xl shadow-lg hover:bg-blue-700 transition-all"
        >
          Ver Datos Actuales
        </a>
      </div>
    </div>
  );
}
