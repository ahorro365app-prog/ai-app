"use client";

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import LoadingScreen from '@/components/LoadingScreen';
import { logger } from '@/lib/logger';

// Detectar si estamos en Capacitor de manera más robusta
const isCapacitor = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  // Múltiples formas de detectar Capacitor
  return !!(
    (window as any).Capacitor ||
    (window as any).Ionic ||
    (window as any).__CAPACITOR__ ||
    window.location.protocol === 'capacitor:' ||
    window.location.protocol === 'ionic:'
    // Removido: window.location.hostname === 'localhost' && window.location.port === ''
    // Esto causaba detección incorrecta en modo "device" de Chrome DevTools
  );
};

export default function Home() {
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(true);
  const hasRedirected = useRef(false); // Bandera para evitar múltiples redirecciones

  useEffect(() => {
    // Solo redirigir si estamos en la raíz y no hemos redirigido ya
    const currentPath = window.location.pathname;
    const isRoot = currentPath === '/' || currentPath === '/index.html';
    
    if (!isRoot) {
      logger.debug('✅ Ya estamos en una ruta específica, no redirigir:', currentPath);
      setIsRedirecting(false);
      return;
    }

    // Prevenir múltiples redirecciones
    if (hasRedirected.current) {
      logger.debug('⏭️ Ya se redirigió, evitando bucle');
      return;
    }

    // Redirección inmediata sin esperar React
    const redirectImmediately = () => {
      try {
        hasRedirected.current = true; // Marcar como redirigido ANTES de redirigir
        
        const savedUser = localStorage.getItem('currentUser');
        const targetPath = savedUser ? '/dashboard/' : '/sign-in/';
        
        logger.debug('🚀 Redirección desde raíz:', {
          hasUser: !!savedUser,
          targetPath,
          isCapacitor: isCapacitor(),
          currentPath: window.location.pathname
        });
        
        // Solo redirigir si todavía estamos en la raíz
        if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
          window.location.replace(targetPath);
        }
      } catch (error) {
        logger.error('❌ Error en redirección inmediata:', error);
        hasRedirected.current = false; // Permitir reintento si hay error
        // No redirigir en caso de error para evitar bucles
      }
    };

    // Intentar redirección inmediata
    redirectImmediately();
    
    // Fallback: si después de 500ms todavía estamos en la raíz, forzar de nuevo
    const fallbackTimer = setTimeout(() => {
      const stillAtRoot = window.location.pathname === '/' || window.location.pathname === '/index.html';
      if (stillAtRoot && !hasRedirected.current) {
        logger.warn('⚠️ Redirección falló, intentando de nuevo...');
        hasRedirected.current = true;
        try {
          const savedUser = localStorage.getItem('currentUser');
          const targetPath = savedUser ? '/dashboard/' : '/sign-in/';
          window.location.replace(targetPath);
        } catch (error) {
          logger.error('❌ Error en redirección fallback:', error);
          hasRedirected.current = false;
        }
      }
    }, 500);

    return () => {
      clearTimeout(fallbackTimer);
    };
  }, []);

  // Mostrar loading mientras se verifica la sesión
  return <LoadingScreen text={isRedirecting ? "Redirigiendo..." : undefined} />;
}
