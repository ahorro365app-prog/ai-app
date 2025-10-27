"use client";

import { createContext, useContext, useState, ReactNode } from 'react';

interface VoiceData {
  transcriptionText: string;
  groqData: any;
  source: 'audio' | 'text';
}

interface VoiceContextType {
  voiceData: VoiceData | null;
  setVoiceData: (data: VoiceData | null) => void;
}

const VoiceContext = createContext<VoiceContextType | undefined>(undefined);

export function VoiceProvider({ children }: { children: ReactNode }) {
  const [voiceData, setVoiceData] = useState<VoiceData | null>(null);

  return (
    <VoiceContext.Provider value={{ voiceData, setVoiceData }}>
      {children}
    </VoiceContext.Provider>
  );
}

export function useVoice() {
  const context = useContext(VoiceContext);
  if (context === undefined) {
    throw new Error('useVoice must be used within a VoiceProvider');
  }
  return context;
}

