"use client";

import React, { useState } from 'react';
import { AlertCircle, CheckCircle, ExternalLink, Copy } from 'lucide-react';

interface ConfigStepProps {
  title: string;
  description: string;
  url: string;
  isCompleted: boolean;
  onComplete: () => void;
}

function ConfigStep({ title, description, url, isCompleted, onComplete }: ConfigStepProps) {
  return (
    <div className={`p-4 rounded-lg border-2 ${isCompleted ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-gray-50'}`}>
      <div className="flex items-center gap-3 mb-3">
        {isCompleted ? (
          <CheckCircle className="w-6 h-6 text-green-600" />
        ) : (
          <AlertCircle className="w-6 h-6 text-orange-600" />
        )}
        <h3 className="text-lg font-semibold">{title}</h3>
      </div>
      
      <p className="text-gray-700 mb-4">{description}</p>
      
      <div className="flex gap-2">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <ExternalLink size={16} />
          Abrir en nueva pestaña
        </a>
        
        {isCompleted && (
          <button
            onClick={onComplete}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <CheckCircle size={16} />
            Completado
          </button>
        )}
      </div>
    </div>
  );
}

export default function SupabaseConfigGuide() {
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [step1Completed, setStep1Completed] = useState(false);
  const [step2Completed, setStep2Completed] = useState(false);

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Aquí podrías agregar un toast de confirmación
  };

  const handleSaveConfig = () => {
    // En una implementación real, esto guardaría en localStorage o enviaría a un API
    console.log('Guardando configuración:', { supabaseUrl, supabaseKey });
    alert('Configuración guardada. Reinicia el servidor para aplicar los cambios.');
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          🔧 Configuración de Supabase
        </h1>
        <p className="text-gray-600 text-lg">
          Para que la aplicación funcione correctamente, necesitas configurar las variables de Supabase.
        </p>
      </div>

      <div className="space-y-6">
        {/* Paso 1: Obtener URL */}
        <ConfigStep
          title="Paso 1: Obtener Project URL"
          description="Ve a tu proyecto de Supabase y copia la Project URL desde la sección de API."
          url="https://supabase.com/dashboard/project/[tu-proyecto]/settings/api"
          isCompleted={step1Completed}
          onComplete={() => setStep1Completed(true)}
        />

        {/* Paso 2: Obtener API Key */}
        <ConfigStep
          title="Paso 2: Obtener API Key"
          description="En la misma página, copia la 'anon public' key que se encuentra en la sección de API."
          url="https://supabase.com/dashboard/project/[tu-proyecto]/settings/api"
          isCompleted={step2Completed}
          onComplete={() => setStep2Completed(true)}
        />

        {/* Formulario de configuración */}
        <div className="p-6 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="text-xl font-semibold text-blue-900 mb-4">
            📝 Configurar Variables de Entorno
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                NEXT_PUBLIC_SUPABASE_URL
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  placeholder="https://tu-proyecto.supabase.co"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={() => handleCopyToClipboard(`NEXT_PUBLIC_SUPABASE_URL=${supabaseUrl}`)}
                  className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  <Copy size={16} />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                NEXT_PUBLIC_SUPABASE_ANON_KEY
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={supabaseKey}
                  onChange={(e) => setSupabaseKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={() => handleCopyToClipboard(`NEXT_PUBLIC_SUPABASE_ANON_KEY=${supabaseKey}`)}
                  className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  <Copy size={16} />
                </button>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="font-semibold text-yellow-800 mb-2">⚠️ Instrucciones importantes:</h4>
            <ol className="list-decimal list-inside text-yellow-700 space-y-1">
              <li>Edita el archivo <code className="bg-yellow-100 px-1 rounded">.env.local</code> en la raíz del proyecto</li>
              <li>Reemplaza los valores placeholder con los valores reales</li>
              <li>Reinicia el servidor con <code className="bg-yellow-100 px-1 rounded">npm run dev</code></li>
              <li>Verifica que no haya errores en la consola</li>
            </ol>
          </div>

          <button
            onClick={handleSaveConfig}
            disabled={!supabaseUrl || !supabaseKey}
            className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            💾 Guardar Configuración
          </button>
        </div>

        {/* Información adicional */}
        <div className="p-6 bg-gray-50 rounded-lg">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            📚 Información Adicional
          </h3>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">🔗 Enlaces Útiles:</h4>
              <ul className="space-y-2 text-gray-600">
                <li>• <a href="https://supabase.com/docs" className="text-blue-600 hover:underline">Documentación de Supabase</a></li>
                <li>• <a href="https://supabase.com/dashboard" className="text-blue-600 hover:underline">Dashboard de Supabase</a></li>
                <li>• <a href="https://nextjs.org/docs/basic-features/environment-variables" className="text-blue-600 hover:underline">Variables de entorno en Next.js</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">🆘 Si necesitas ayuda:</h4>
              <ul className="space-y-2 text-gray-600">
                <li>• Verifica que el archivo <code className="bg-gray-200 px-1 rounded">.env.local</code> esté en la raíz</li>
                <li>• Asegúrate de que las URLs sean válidas</li>
                <li>• Reinicia el servidor después de cada cambio</li>
                <li>• Revisa la consola para errores específicos</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
