"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

interface ModalContextType {
  isAnyModalOpen: boolean;
  setModalOpen: (isOpen: boolean) => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [isAnyModalOpen, setIsAnyModalOpen] = useState(false);

  const setModalOpen = useCallback((isOpen: boolean) => {
    console.log('ModalContext: setModalOpen called with:', isOpen);
    setIsAnyModalOpen(isOpen);
    console.log('ModalContext: isAnyModalOpen state updated to:', isOpen);
  }, []);

  useEffect(() => {
    console.log('ModalContext: isAnyModalOpen changed to:', isAnyModalOpen);
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
