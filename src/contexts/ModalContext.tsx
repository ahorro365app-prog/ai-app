"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { logger } from '@/lib/logger';

interface ModalContextType {
  isAnyModalOpen: boolean;
  setModalOpen: (isOpen: boolean) => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: ReactNode }) {
  logger.debug('🚀 ModalProvider: Componente inicializado');
  const [isAnyModalOpen, setIsAnyModalOpen] = useState(false);
  logger.debug('📊 ModalProvider: Estado inicial configurado');

  const setModalOpen = useCallback((isOpen: boolean) => {
    logger.debug('ModalContext: setModalOpen called with:', isOpen);
    setIsAnyModalOpen(isOpen);
    logger.debug('ModalContext: isAnyModalOpen state updated to:', isOpen);
  }, []);

  useEffect(() => {
    logger.debug('ModalContext: isAnyModalOpen changed to:', isAnyModalOpen);
  }, [isAnyModalOpen]);

  return (
    <ModalContext.Provider value={{ isAnyModalOpen, setModalOpen }}>
      {children}
    </ModalContext.Provider>
  );
}

export function useModal() {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
}
