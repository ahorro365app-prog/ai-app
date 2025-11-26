"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { logger } from '@/lib/logger';

interface NotificationToast {
  id: string;
  title: string;
  body: string;
  timestamp: Date;
}

interface NotificationToastContextType {
  showToast: (title: string, body: string) => void;
  toasts: NotificationToast[];
  removeToast: (id: string) => void;
}

const NotificationToastContext = createContext<NotificationToastContextType | undefined>(undefined);

export function NotificationToastProvider({ children }: { children: ReactNode }) {
  logger.debug('🚀 NotificationToastProvider: Componente inicializado');
  const [toasts, setToasts] = useState<NotificationToast[]>([]);
  logger.debug('📊 NotificationToastProvider: Estado inicial configurado');

  const showToast = useCallback((title: string, body: string) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const newToast: NotificationToast = {
      id,
      title,
      body,
      timestamp: new Date(),
    };

    setToasts((prev) => [...prev, newToast]);

    // Remover automáticamente después de 10 segundos
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 10000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <NotificationToastContext.Provider value={{ showToast, toasts, removeToast }}>
      {children}
      <NotificationToastContainer />
    </NotificationToastContext.Provider>
  );
}

function NotificationToastContainer() {
  const { toasts, removeToast } = useNotificationToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-[60px] right-4 z-[9999] space-y-3 max-w-sm">
      {toasts.map((toast) => (
        <NotificationToast
          key={toast.id}
          toast={toast}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
}

function NotificationToast({ toast, onClose }: { toast: NotificationToast; onClose: () => void }) {
  return (
    <div
      className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-4 rounded-2xl shadow-2xl animate-in slide-in-from-right-full duration-300 border-2 border-white/20 backdrop-blur-sm"
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <h4 className="font-bold text-base mb-1">{toast.title}</h4>
          <p className="text-sm opacity-90">{toast.body}</p>
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 text-white/80 hover:text-white transition-colors text-xl leading-none"
          aria-label="Cerrar notificación"
        >
          ×
        </button>
      </div>
    </div>
  );
}

export function useNotificationToast() {
  const context = useContext(NotificationToastContext);
  if (context === undefined) {
    throw new Error('useNotificationToast must be used within NotificationToastProvider');
  }
  return context;
}

