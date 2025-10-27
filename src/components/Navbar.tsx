"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, History, Mic, CreditCard, Target, Settings } from "lucide-react";
import { useEffect, useState } from "react";
import { useSupabase } from "@/contexts/SupabaseContext";
import { useVoiceRecording } from "@/hooks/useVoiceRecording";
import VoiceTransactionModal from "./VoiceTransactionModal";

interface NavbarProps {
  onOpenTransaction: () => void;
}

export default function Navbar({ onOpenTransaction }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useSupabase();
  const [isDebtsEnabled, setIsDebtsEnabled] = useState<boolean | null>(null);
  const [isGoalsEnabled, setIsGoalsEnabled] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Hook de grabación de voz
  const {
    state: voiceState,
    startRecording,
    stopRecording,
    getButtonState,
    handleMouseDown,
    handleMouseUp,
    handleMouseMove,
    handleMouseLeave,
    handleTouchStart,
    handleTouchEnd,
    handleTouchMove,
    handleTouchCancel,
    isRecording,
    isProcessing,
    hasError,
    duration,
    isPressed,
    isSwipeDetected,
    // Estados de transcripción
    isTranscribing,
    transcriptionText,
    transcriptionError,
    transcriptionComplete,
    clearTranscription,
    // Estados del modal
    showModal,
    modalTranscriptionText,
    modalGroqData,
    handleModalClose,
    handleModalSave,
    handleModalCancel
  } = useVoiceRecording();

  // Cargar configuración de menús habilitados
  useEffect(() => {
    if (user) {
      // Usar configuración desde la base de datos
      setIsDebtsEnabled(user.deudas_habilitado);
      setIsGoalsEnabled(user.metas_habilitado);
      setIsLoading(false);
    }
  }, [user]);

  // Manejar click del micrófono (ahora solo para estados de error)
  const handleMicClick = () => {
    if (hasError) {
      // Solo permitir click si hay error para reintentar
      startRecording();
    }
  };

  // Construir navItems dinámicamente basado en la configuración
  const regularNavItems = [
    { href: "/dashboard", label: "Panel", Icon: Home },
    { href: "/history", label: "Historial", Icon: History },
    ...(isDebtsEnabled === true ? [{ href: "/deudas", label: "Deudas", Icon: CreditCard }] : []),
    ...(isGoalsEnabled === true ? [{ href: "/metas", label: "Metas", Icon: Target }] : []),
    { href: "/profile", label: "Ajustes", Icon: Settings },
  ];

  // Posicionar el botón de voz según la cantidad de botones
  const totalRegularItems = regularNavItems.length;
  const isEven = totalRegularItems % 2 === 0;
  
  let navItems;
  if (isEven) {
    // Botones pares: micrófono al centro
    const midPoint = Math.floor(totalRegularItems / 2);
    navItems = [
      ...regularNavItems.slice(0, midPoint),
      { href: "#", label: "Voz", Icon: Mic, isVoice: true },
      ...regularNavItems.slice(midPoint),
    ];
  } else {
    // Botones impares: micrófono al principio
    navItems = [
      { href: "#", label: "Voz", Icon: Mic, isVoice: true },
      ...regularNavItems,
    ];
  }

  // Prefetch de todas las páginas al montar el componente
  useEffect(() => {
    if (!isLoading && isDebtsEnabled !== null && isGoalsEnabled !== null) {
      navItems.forEach((item) => {
        if (item.href !== "#") {
          router.prefetch(item.href);
        }
      });
    }
  }, [router, isLoading, isDebtsEnabled, isGoalsEnabled]);

  // No renderizar hasta que termine de cargar la configuración
  if (isLoading || isDebtsEnabled === null || isGoalsEnabled === null) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-white z-50 safe-bottom shadow-lg pt-0 pb-1">
        <ul className="flex items-center justify-around px-6 py-2 relative h-16">
          {/* Navbar vacío mientras carga para evitar flash */}
        </ul>
      </div>
    );
  }

  // Mantener tamaños consistentes como cuando hay 5 botones activos
  const totalItems = navItems.length;
  // Usar siempre los tamaños óptimos (como cuando hay 5 botones activos)
  const iconSize = 20;
  // Ajustar solo el espaciado del micrófono según la cantidad de elementos
  const spacing = totalItems >= 5 ? "mr-8 ml-8" : "mr-6 ml-6";

  return (
    <div className="bg-white safe-bottom shadow-lg pt-0 pb-1">
      <ul className="flex items-center justify-around px-6 py-2 relative">
        {navItems.map((item, index) => {
          const active = pathname === item.href;
          const Icon = item.Icon;
          
          // Botón de voz central (más grande y destacado)
          if ('isVoice' in item && item.isVoice) {
            return (
              <li key={item.label} className={`relative ${spacing}`}>
                {/* Ondas de grabación */}
                {isRecording && (
                  <>
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-20 h-20 rounded-full border-2 border-red-400 animate-ping opacity-60"></div>
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 rounded-full border-2 border-red-300 animate-ping opacity-40" style={{ animationDelay: '0.5s' }}></div>
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-28 h-28 rounded-full border-2 border-red-200 animate-ping opacity-20" style={{ animationDelay: '1s' }}></div>
                  </>
                )}
                
                <button
                  onClick={handleMicClick}
                  onMouseDown={handleMouseDown}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseLeave}
                  onTouchStart={handleTouchStart}
                  onTouchEnd={handleTouchEnd}
                  onTouchMove={handleTouchMove}
                  onTouchCancel={handleTouchCancel}
                  disabled={isProcessing}
                  className={`absolute -top-12 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all duration-200 ${
                    isProcessing
                      ? 'bg-gradient-to-r from-yellow-500 to-orange-500 animate-spin cursor-not-allowed'
                      : isRecording 
                        ? 'bg-gradient-to-r from-red-500 to-red-600 animate-pulse cursor-pointer' 
                        : hasError
                          ? 'bg-gradient-to-r from-red-600 to-red-700 cursor-pointer'
                          : isPressed
                            ? 'bg-gradient-to-r from-blue-700 to-purple-700 scale-95 cursor-pointer'
                            : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:scale-110 active:scale-95 cursor-pointer'
                  }`}
                  aria-label={
                    isProcessing ? "Procesando..." : 
                    isRecording ? "Mantén presionado para grabar" : 
                    hasError ? "Error - Reintentar" :
                    "Mantén presionado para grabar"
                  }
                >
                  <Mic size={24} className="text-white" />
                  
                  {/* Efecto de latido durante grabación */}
                  {isRecording && (
                    <div className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-75"></div>
                  )}
                </button>
              </li>
            );
          }

          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={`
                  flex flex-col items-center gap-1 py-2 px-1 rounded-xl transition-all
                  ${active 
                    ? "text-blue-600" 
                    : "text-gray-500 hover:text-gray-700"
                  }
                `}
              >
                <Icon size={iconSize} />
                <span className={`font-medium`} style={{ fontSize: '13px' }}>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
      
      {/* Indicadores de estado */}
      {isRecording && (
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium animate-pulse">
          🎤 Grabando... {duration}s
        </div>
      )}
      
      {isRecording && (
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-3 py-1 rounded-full text-xs font-medium">
          📱 Desliza para cancelar
        </div>
      )}
      
      {isProcessing && (
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-medium animate-pulse">
          ⚡ Procesando...
        </div>
      )}
      
      {hasError && (
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-medium">
          ❌ Error de micrófono
        </div>
      )}
      
      {isSwipeDetected && (
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-medium animate-pulse">
          🚫 Grabación cancelada
        </div>
      )}
      
      {/* Modal de transacción de voz */}
      {console.log('🎭 Navbar - showModal:', showModal, 'modalGroqData:', modalGroqData)}
      <VoiceTransactionModal
        isOpen={showModal}
        onClose={handleModalClose}
        transcriptionText={modalTranscriptionText}
        groqData={modalGroqData}
        onSave={handleModalSave}
        onCancel={handleModalCancel}
      />
    </div>
  );
}
