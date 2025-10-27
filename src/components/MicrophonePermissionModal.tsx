"use client";

import { AlertTriangle, Mic, Settings } from 'lucide-react';

interface MicrophonePermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRetry: () => void;
}

export default function MicrophonePermissionModal({ 
  isOpen, 
  onClose, 
  onRetry 
}: MicrophonePermissionModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl animate-scale-in">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle size={32} className="text-red-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">Permiso de Micrófono Requerido</h3>
            <p className="text-gray-600">La aplicación necesita acceso al micrófono</p>
          </div>
        </div>

        {/* Contenido */}
        <div className="mb-6">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
            <div className="flex items-start gap-3">
              <Mic size={20} className="text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-red-900 mb-1">
                  ¿Cómo habilitar el micrófono?
                </p>
                <div className="text-xs text-red-800 space-y-2">
                  <p><strong>Android:</strong></p>
                  <ul className="list-disc list-inside ml-2 space-y-1">
                    <li>Configuración → Aplicaciones → Tu App</li>
                    <li>Permisos → Micrófono → Permitir</li>
                  </ul>
                  
                  <p className="mt-3"><strong>iOS:</strong></p>
                  <ul className="list-disc list-inside ml-2 space-y-1">
                    <li>Configuración → Privacidad → Micrófono</li>
                    <li>Buscar tu app → Activar</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Settings size={20} className="text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-blue-900 mb-1">
                  Alternativa rápida
                </p>
                <p className="text-xs text-blue-800">
                  También puedes ir a Configuración → Privacidad → Micrófono desde el navegador
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Botones */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3.5 px-4 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={onRetry}
            className="flex-1 py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold hover:opacity-90 transition-all shadow-lg flex items-center justify-center gap-2"
          >
            <Mic size={18} />
            Intentar de Nuevo
          </button>
        </div>
      </div>
    </div>
  );
}




