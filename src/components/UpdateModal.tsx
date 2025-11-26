"use client";

import { useEffect } from 'react';
import { X, Download, RefreshCw, AlertCircle, LogOut, MessageCircle } from 'lucide-react';
import { detectPlatform, Platform } from '@/lib/platformDetection';
import { useSupabase } from '@/hooks/useSupabase';
import { useRouter } from 'next/navigation';

interface UpdateModalProps {
  isOpen: boolean;
  onClose?: () => void; // Opcional, solo para actualización recomendada
  title: string;
  message: string;
  releaseNotes?: string;
  isRequired: boolean; // Si es true, no se puede cerrar
  storeUrl?: string | null;
  platform: Platform;
}

export default function UpdateModal({
  isOpen,
  onClose,
  title,
  message,
  releaseNotes,
  isRequired,
  storeUrl,
  platform
}: UpdateModalProps) {
  const { logout } = useSupabase();
  const router = useRouter();
  
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      // Si es requerida, no permitir cerrar con Escape
      if (e.key === 'Escape' && !isRequired && onClose) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, isRequired, onClose]);

  if (!isOpen) return null;

  const handleUpdate = () => {
    if (platform === 'web') {
      // Recargar página para web
      window.location.reload();
    } else if (storeUrl) {
      // Abrir tienda para Android/iOS
      window.open(storeUrl, '_blank');
    } else {
      // Fallback: intentar abrir tienda por defecto
      if (platform === 'android') {
        window.open('https://play.google.com/store/apps/details?id=com.ahorro365.app', '_blank');
      } else if (platform === 'ios') {
        window.open('https://apps.apple.com/app/ahorro365/id123456789', '_blank');
      }
    }
  };

  // BYPASS para desarrollo: Si estamos en localhost y es requerida, permitir cerrar
  const isDevelopment = typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || 
     window.location.hostname === '127.0.0.1' ||
     window.location.hostname.includes('localhost'));

  const handleBypass = () => {
    if (isDevelopment && typeof window !== 'undefined') {
      // Guardar flag para desactivar el modal en esta sesión
      localStorage.setItem('bypassVersionCheck', 'true');
      if (onClose) {
        onClose();
      }
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/sign-in');
  };

  const handleRequestUpdateViaWhatsApp = () => {
    const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_SUPPORT || '+59161600190';
    const message = encodeURIComponent(
      `Hola 😊\n\nMi *Ahorro365* está desactualizado y no me deja seguir usando la app.\n\n¿Me podrían ayudar a actualizarla, por favor?`
    );
    const whatsappUrl = `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  const getIcon = () => {
    if (isRequired) {
      return <AlertCircle size={24} className="text-red-500" />;
    }
    return <Download size={24} className="text-blue-500" />;
  };

  const getIconBackground = () => {
    if (isRequired) {
      return 'bg-red-50 border-red-200';
    }
    return 'bg-blue-50 border-blue-200';
  };

  const getButtonColor = () => {
    if (isRequired) {
      return 'bg-red-500 hover:bg-red-600 text-white';
    }
    return 'bg-blue-500 hover:bg-blue-600 text-white';
  };

  const getButtonText = () => {
    if (platform === 'web') {
      return 'Recargar página';
    }
    return 'Actualizar ahora';
  };

  const getButtonIcon = () => {
    if (platform === 'web') {
      return <RefreshCw size={18} />;
    }
    return <Download size={18} />;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all duration-200 scale-100">
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${getIconBackground()} border-2`}>
              {getIcon()}
            </div>
            <h3 className="font-bold text-gray-900" style={{ fontSize: '18px' }}>
              {title}
            </h3>
          </div>
          {/* Solo mostrar botón cerrar si NO es requerida */}
          {!isRequired && onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X size={20} className="text-gray-400" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="px-6 pb-6">
          <p className="text-gray-700 leading-relaxed text-center text-sm mb-4">
            {message}
          </p>

          {/* Release Notes */}
          {releaseNotes && releaseNotes.trim() && (
            <div className="bg-gray-50 rounded-xl p-4 mb-4 max-h-40 overflow-y-auto">
              <p className="text-xs font-semibold text-gray-700 mb-2">
                ✨ Novedades en esta versión:
              </p>
              <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">
                {releaseNotes}
              </p>
            </div>
          )}

          {/* Buttons */}
          <div className="space-y-3 mt-6">
            {/* Botón principal de actualizar */}
            <button
              onClick={handleUpdate}
              className={`w-full py-2.5 px-4 rounded-xl font-semibold transition-all duration-150 shadow-sm hover:shadow-md active:scale-95 text-sm ${getButtonColor()} flex items-center justify-center gap-2`}
            >
              {getButtonIcon()}
              {getButtonText()}
            </button>

            {/* Botones secundarios solo si es requerida */}
            {isRequired && (
              <div className="flex gap-2">
                <button
                  onClick={handleRequestUpdateViaWhatsApp}
                  className="flex-1 py-2.5 px-4 rounded-xl font-semibold transition-all duration-150 shadow-sm hover:shadow-md active:scale-95 text-sm bg-green-500 hover:bg-green-600 text-white flex items-center justify-center gap-2"
                >
                  <MessageCircle size={18} />
                  Solicitar por WhatsApp
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 py-2.5 px-4 rounded-xl font-semibold transition-all duration-150 shadow-sm hover:shadow-md active:scale-95 text-sm bg-gray-500 hover:bg-gray-600 text-white flex items-center justify-center gap-2"
                >
                  <LogOut size={18} />
                  Cerrar sesión
                </button>
              </div>
            )}

            {/* Botón "Más tarde" solo si NO es requerida */}
            {!isRequired && onClose && (
              <button
                onClick={onClose}
                className="w-full py-2.5 px-4 rounded-xl font-semibold transition-all duration-150 shadow-sm hover:shadow-md active:scale-95 text-sm bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                Más tarde
              </button>
            )}
          </div>

          {/* Nota si es requerida */}
          {isRequired && (
            <div className="mt-4">
              <p className="text-xs text-red-600 text-center font-medium">
                * Necesitas actualizar para continuar usando la app
              </p>
              {/* BYPASS solo en desarrollo */}
              {isDevelopment && (
                <button
                  onClick={handleBypass}
                  className="text-xs text-gray-500 text-center mt-2 underline hover:text-gray-700 w-full"
                >
                  [DEV] Saltar verificación (solo localhost)
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
