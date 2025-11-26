"use client";

import { useState, useEffect } from 'react';
import { useAppVersion } from './useAppVersion';
import { useSupabase } from './useSupabase';
import { checkAppVersion, VersionCheckResponse } from '@/lib/versionCheck';

interface UseVersionCheckResult {
  versionCheck: VersionCheckResponse | null;
  isLoading: boolean;
  error: string | null;
  shouldShowModal: boolean;
}

/**
 * Hook para verificar la versión de la app al iniciar
 * Retorna información sobre si necesita actualización
 */
export function useVersionCheck(): UseVersionCheckResult {
  const { version, platform } = useAppVersion();
  const { user } = useSupabase();
  const [versionCheck, setVersionCheck] = useState<VersionCheckResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const verifyVersion = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Generar un deviceId simple si no hay usuario
        const deviceId = typeof window !== 'undefined' 
          ? localStorage.getItem('deviceId') || `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
          : undefined;

        // Guardar deviceId si no existe
        if (deviceId && typeof window !== 'undefined' && !localStorage.getItem('deviceId')) {
          localStorage.setItem('deviceId', deviceId);
        }

        const result = await checkAppVersion(
          version,
          platform,
          user?.id,
          deviceId
        );

        if (isMounted) {
          setVersionCheck(result);
          setIsLoading(false);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Error verificando versión');
          setIsLoading(false);
        }
      }
    };

    // Solo verificar si tenemos versión y plataforma
    if (version && platform) {
      verifyVersion();
    } else {
      setIsLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [version, platform, user?.id]);

  // Determinar si se debe mostrar el modal
  // BYPASS: En desarrollo (localhost), no bloquear si es actualización requerida
  const isDevelopment = typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || 
     window.location.hostname === '127.0.0.1' ||
     window.location.hostname.includes('localhost'));

  const shouldShowModal = versionCheck
    ? versionCheck.shouldUpdate && 
      (isDevelopment 
        ? versionCheck.status === 'update_recommended' // En desarrollo, solo mostrar recomendadas
        : versionCheck.isRequired || versionCheck.status === 'update_recommended') // En producción, mostrar ambas
    : false;

  return {
    versionCheck,
    isLoading,
    error,
    shouldShowModal,
  };
}
