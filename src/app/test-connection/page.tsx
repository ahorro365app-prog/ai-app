'use client'

import { useState } from 'react'

export default function TestConnection() {
  const [status, setStatus] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const testSupabaseConnection = async () => {
    setLoading(true)
    setStatus('🔄 Probando conexión...')

    try {
      // Verificar variables de entorno
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (!supabaseUrl || !supabaseKey) {
        setStatus('❌ Variables de entorno no configuradas')
        setLoading(false)
        return
      }

      setStatus('✅ Variables de entorno configuradas')
      
      // Importar Supabase dinámicamente
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(supabaseUrl, supabaseKey)

      // Probar conexión
      const { data, error } = await supabase
        .from('users')
        .select('count')
        .limit(1)

      if (error) {
        setStatus(`❌ Error de conexión: ${error.message}`)
      } else {
        setStatus('🎉 ¡Conexión exitosa con Supabase!')
      }

    } catch (error: any) {
      setStatus(`❌ Error: ${error.message}`)
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 shadow-xl max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-xl">🔗</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            Test de Conexión
          </h1>
          <p className="text-gray-600">
            Verifica que Supabase esté configurado correctamente
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={testSupabaseConnection}
            disabled={loading}
            className="w-full py-3 px-4 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? '🔄 Probando...' : '🔍 Probar Conexión'}
          </button>

          {status && (
            <div className="p-4 rounded-xl bg-gray-50 border">
              <p className="text-xl font-medium">{status}</p>
            </div>
          )}

          <div className="text-xl text-gray-500 space-y-1">
            <p>Este test verifica:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Variables de entorno configuradas</li>
              <li>Conexión con Supabase</li>
              <li>Acceso a la base de datos</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
