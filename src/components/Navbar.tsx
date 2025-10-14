"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, History, Mic, CreditCard, Target, Settings } from "lucide-react";
import { useEffect, useState } from "react";
import { useSupabase } from "@/contexts/SupabaseContext";

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
  
  // Estados para grabación de audio
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);

  // Cargar configuración de menús habilitados
  useEffect(() => {
    if (user) {
      // Usar configuración desde la base de datos
      setIsDebtsEnabled(user.deudas_habilitado);
      setIsGoalsEnabled(user.metas_habilitado);
      setIsLoading(false);
    }
  }, [user]);

  // Funciones para grabación de audio
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        // Aquí puedes procesar el audio grabado
        console.log('Audio grabado:', audioUrl);
        
        // Detener todas las pistas de audio
        stream.getTracks().forEach(track => track.stop());
        
        // Limpiar chunks
        setAudioChunks([]);
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setAudioChunks(chunks);
    } catch (error) {
      console.error('Error al acceder al micrófono:', error);
      alert('No se pudo acceder al micrófono. Verifica los permisos.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
    }
  };

  const handleMicClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
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

  // Ajustar tamaño según cantidad de elementos
  const totalItems = navItems.length;
  const iconSize = totalItems <= 5 ? 22 : 20;
  const textSize = totalItems <= 5 ? "text-xs" : "text-[10px]";
  const spacing = totalItems <= 5 ? "mr-6 ml-6" : "mr-3 ml-3";

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white z-50 safe-bottom shadow-lg pt-0 pb-1">
      <ul className="flex items-center justify-around px-6 py-2 relative">
        {navItems.map((item, index) => {
          const active = pathname === item.href;
          const Icon = item.Icon;
          
          // Botón de voz central (más grande y destacado)
          if (item.isVoice) {
            return (
              <li key={item.label} className={`relative ${spacing}`}>
                <button
                  onClick={handleMicClick}
                  className={`absolute -top-12 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all ${
                    isRecording 
                      ? 'bg-gradient-to-r from-red-500 to-red-600 animate-pulse' 
                      : 'bg-gradient-to-r from-blue-600 to-purple-600'
                  }`}
                  aria-label={isRecording ? "Detener grabación" : "Iniciar grabación"}
                >
                  <Mic size={28} className="text-white" />
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
                <span className={`${textSize} font-medium`}>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
      
      {/* Indicador de grabación */}
      {isRecording && (
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-medium animate-pulse">
          🎤 Grabando...
        </div>
      )}
    </div>
  );
}
