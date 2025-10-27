"use client";

import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';

interface StatusBarContextType {
  setStatusBarConfig: (config: StatusBarConfig) => void;
}

interface StatusBarConfig {
  backgroundColor: string;
  style: Style;
}

const StatusBarContext = createContext<StatusBarContextType | undefined>(undefined);

export function StatusBarProvider({ children }: { children: ReactNode }) {
  const [currentConfig, setCurrentConfig] = useState<StatusBarConfig>({
    backgroundColor: '#ffffff', // Blanco por defecto
    style: Style.Dark
  });

  const setStatusBarConfig = useCallback((config: StatusBarConfig) => {
    if (Capacitor.isNativePlatform()) {
      const updateStatusBar = async () => {
        try {
          await StatusBar.setBackgroundColor({ color: config.backgroundColor });
          await StatusBar.setStyle({ style: config.style });
          setCurrentConfig(config);
        } catch (error) {
          console.log('Status bar not available:', error);
        }
      };

      updateStatusBar();
    } else {
      // En desarrollo web, solo actualizamos el estado local
      setCurrentConfig(config);
    }
  }, []);

  // Configuración inicial
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      const initStatusBar = async () => {
        try {
          await StatusBar.setBackgroundColor({ color: currentConfig.backgroundColor });
          await StatusBar.setStyle({ style: currentConfig.style });
        } catch (error) {
          console.log('Status bar not available:', error);
        }
      };

      initStatusBar();
    } else {
      // En desarrollo web, no hacer nada
      console.log('Status bar context initialized for web development');
    }
  }, []);

  return (
    <StatusBarContext.Provider value={{ setStatusBarConfig }}>
      {children}
    </StatusBarContext.Provider>
  );
}

export function useStatusBar() {
  const context = useContext(StatusBarContext);
  if (context === undefined) {
    throw new Error('useStatusBar must be used within a StatusBarProvider');
  }
  return context;
}
