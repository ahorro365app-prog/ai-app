"use client";

import { useEffect } from 'react';
import { ScreenOrientation } from '@capacitor/screen-orientation';
import { Capacitor } from '@capacitor/core';

export default function OrientationLock() {
  useEffect(() => {
    const lockOrientation = async () => {
      if (Capacitor.isNativePlatform()) {
        try {
          await ScreenOrientation.lock({ orientation: 'portrait' });
          console.log('✅ Orientación bloqueada en modo portrait');
        } catch (error) {
          console.warn('⚠️ No se pudo bloquear la orientación:', error);
        }
      }
    };

    lockOrientation();
  }, []);

  return null; // Este componente no renderiza nada
}



