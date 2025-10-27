"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function TestSupabasePage() {
  const [connectionStatus, setConnectionStatus] = useState('No probado');
  const [error, setError] = useState<string | null>(null);

  const testConnection = async () => {
    setConnectionStatus('Probando...');
    setError(null);
    try {
      const { data, error } = await supabase.from('users').select('id').limit(1);

      if (error) {
        throw error;
      }

      if (data) {
        setConnectionStatus('🎉 ¡Conexión exitosa con Supabase!');
      } else {
        setConnectionStatus('⚠️ Conexión exitosa, pero no se pudieron obtener datos.');
      }
    } catch (err: any) {
      setConnectionStatus('❌ Error de conexión');
      setError(err.message || 'Error desconocido');
      console.error('Error al probar conexión con Supabase:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4 pb-24 flex flex-col items-center justify-center text-center">
      <h1 className="text-xl font-bold text-gray-900 mb-4">Prueba de Conexión Supabase</h1>
      <p className="text-gray-700 mb-6">
        Haz clic en el botón para verificar si tu aplicación puede conectarse a Supabase.
      </p>

      <button
        onClick={testConnection}
        className="px-6 py-3 bg-blue-600 text-white rounded-xl shadow-lg hover:bg-blue-700 transition-all mb-4"
      >
        Probar Conexión
      </button>

      <p className={`text-xl font-semibold ${
        connectionStatus.includes('exitosa') ? 'text-green-600' :
        connectionStatus.includes('Error') ? 'text-red-600' :
        'text-gray-600'
      }`}>
        Estado: {connectionStatus}
      </p>

      {error && (
        <div className="mt-4 p-4 bg-red-100 border border-red-300 text-red-800 rounded-xl max-w-md text-left">
          <h3 className="font-bold mb-2">Detalles del Error:</h3>
          <p className="text-xl break-all">{error}</p>
        </div>
      )}

      <div className="mt-8 text-left text-gray-600 text-xl">
        <h4 className="font-bold mb-2">Instrucciones:</h4>
        <ul className="list-disc list-inside space-y-1">
          <li>Asegúrate de que tu archivo <code>.env.local</code> tenga las variables <code>NEXT_PUBLIC_SUPABASE_URL</code> y <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> configuradas correctamente.</li>
          <li>Verifica que tu proyecto Supabase esté activo y que las claves sean correctas.</li>
          <li>Si el error persiste, revisa la consola del navegador para más detalles.</li>
        </ul>
      </div>
    </div>
  );
}