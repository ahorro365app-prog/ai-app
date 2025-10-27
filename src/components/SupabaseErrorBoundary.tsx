"use client";

import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Settings } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class SupabaseErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    // Verificar si es un error relacionado con Supabase
    const isSupabaseError = 
      error.message.includes('supabaseUrl') ||
      error.message.includes('NEXT_PUBLIC_SUPABASE') ||
      error.message.includes('Supabase') ||
      error.message.includes('Invalid supabaseUrl');

    return { 
      hasError: true, 
      error: isSupabaseError ? error : null 
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error capturado por SupabaseErrorBoundary:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    // Recargar la página para reintentar
    window.location.reload();
  };

  handleGoToConfig = () => {
    // Redirigir a la página de configuración
    window.location.href = '/config';
  };

  render() {
    if (this.state.hasError) {
      // Si es un error de Supabase, mostrar interfaz de configuración
      if (this.state.error && this.state.error.message.includes('supabaseUrl')) {
        return (
          <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  ⚠️ Error de Configuración de Supabase
                </h1>
                <p className="text-gray-600">
                  La aplicación no puede conectarse a Supabase. Necesitas configurar las variables de entorno.
                </p>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-red-800 mb-2">🔍 Error detectado:</h3>
                <code className="text-red-700 text-sm bg-red-100 px-2 py-1 rounded">
                  {this.state.error?.message}
                </code>
              </div>

              <div className="space-y-4">
                <button
                  onClick={this.handleGoToConfig}
                  className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Settings size={20} />
                  Ir a Configuración de Supabase
                </button>

                <button
                  onClick={this.handleRetry}
                  className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  <RefreshCw size={20} />
                  Reintentar
                </button>
              </div>

              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">📝 Pasos rápidos:</h4>
                <ol className="list-decimal list-inside text-blue-700 space-y-1 text-sm">
                  <li>Ve a <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="underline">Supabase Dashboard</a></li>
                  <li>Selecciona tu proyecto → Settings → API</li>
                  <li>Copia la "Project URL" y "anon public" key</li>
                  <li>Edita el archivo <code className="bg-blue-100 px-1 rounded">.env.local</code></li>
                  <li>Reinicia el servidor</li>
                </ol>
              </div>
            </div>
          </div>
        );
      }

      // Para otros errores, mostrar error genérico
      return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Algo salió mal
            </h2>
            <p className="text-gray-600 mb-4">
              Ha ocurrido un error inesperado. Intenta recargar la página.
            </p>
            <button
              onClick={this.handleRetry}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto"
            >
              <RefreshCw size={16} />
              Recargar página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
