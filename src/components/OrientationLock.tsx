"use client";

import { useEffect } from 'react';
import { ScreenOrientation } from '@capacitor/screen-orientation';
import { Capacitor } from '@capacitor/core';
import { logger } from '@/lib/logger';

export default function OrientationLock() {
  useEffect(() => {
    const lockOrientation = async () => {
      if (Capacitor.isNativePlatform()) {
        try {
          await ScreenOrientation.lock({ orientation: 'portrait' });
          logger.debug('✅ Orientación bloqueada en modo portrait');
        } catch (error) {
          logger.warn('⚠️ No se pudo bloquear la orientación:', error);
        }
      }
    };

    lockOrientation();
  }, []);

  return null; // Este componente no renderiza nada
}



