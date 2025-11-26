"use client";

import { useState, useEffect } from 'react';
import { detectPlatform, Platform } from '@/lib/platformDetection';

// Versión desde package.json (se inyecta en build time o desde env)
// Para Android, se puede leer desde version.properties (0.0.23)
// Para iOS, se puede leer desde Info.plist
const PACKAGE_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || '0.1.0';

interface AppVersionInfo {
  version: string;
  platform: Platform;
  deviceId?: string;
}

/**
 * Hook para obtener la versión actual de la app y la plataforma
 * 
 * Nota: Para obtener la versión nativa de Android/iOS, se necesita:
 * - Instalar @capacitor/app: npm install @capacitor/app
 * - O leer desde version.properties (Android) / Info.plist (iOS)
 * Por ahora, usa la versión de package.json/env como fallback
 */
export function useAppVersion(): AppVersionInfo {
  const [versionInfo, setVersionInfo] = useState<AppVersionInfo>({
    version: PACKAGE_VERSION,
    platform: 'web',
  });

  useEffect(() => {
    const getVersion = async () => {
      const platform = detectPlatform();

      // Si es web, usar versión de package.json o env
      if (platform === 'web') {
        setVersionInfo({
          version: PACKAGE_VERSION,
          platform: 'web',
        });
        return;
      }

      // Si es Android o iOS, intentar obtener versión desde Capacitor App
      // Si el plugin no está instalado, usar fallback
      // NOTA: Por ahora, deshabilitamos la importación de Capacitor para evitar errores de build
      // Si necesitas usar Capacitor, instala @capacitor/app: npm install @capacitor/app
      // y descomenta el código siguiente
      
      // Verificar si Capacitor está disponible antes de intentar importar
      // Esto evita errores de webpack en tiempo de build
      const isCapacitorAvailable = 
        typeof window !== 'undefined' && 
        (window as any).Capacitor &&
        (platform === 'android' || platform === 'ios');
      
      if (!isCapacitorAvailable) {
        // No es un entorno Capacitor, usar fallback
        setVersionInfo({
          version: PACKAGE_VERSION,
          platform,
        });
        return;
      }

      // Código deshabilitado temporalmente para evitar errores de build
      // Si necesitas usar Capacitor, descomenta esto y asegúrate de instalar @capacitor/app
      /*
      try {
        // @ts-ignore - Módulo opcional, puede no estar instalado
        const capacitorApp = await import('@capacitor/app');
        
        if (capacitorApp && capacitorApp.App) {
          const appInfo = await capacitorApp.App.getInfo();
          
          setVersionInfo({
            version: appInfo.version || PACKAGE_VERSION,
            platform,
            deviceId: appInfo.id,
          });
          return;
        }
      } catch (error) {
        // El módulo no está disponible, continuar con fallback
        logger.debug('@capacitor/app no disponible, usando versión de package.json');
      }
      */
      
      // Usar fallback si Capacitor no está disponible o no está instalado
      setVersionInfo({
        version: PACKAGE_VERSION,
        platform,
      });
    };

    getVersion();
  }, []);

  return versionInfo;
}

/**
 * Obtiene la versión de la app de forma síncrona (solo para web)
 * Para plataformas nativas, usar useAppVersion hook
 */
export function getAppVersionSync(): string {
  return PACKAGE_VERSION;
}
