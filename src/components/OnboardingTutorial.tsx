"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { MessageCircle, Mic, Type, BarChart3, History, ChevronLeft, ChevronRight, Gift } from 'lucide-react';
import { useModal } from '@/contexts/ModalContext';
import { logger } from '@/lib/logger';

interface OnboardingTutorialProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const SLIDES = [
  {
    id: 1,
    title: '¡Bienvenido a Ahorro365!',
    subtitle: 'Soy tu compañero inteligente para llevar tus finanzas sin estrés 💜',
    icon: BarChart3,
    iconColor: 'text-purple-600',
    iconBg: 'bg-purple-100',
    useLogo: true, // Usar logo en lugar de icono
    content: (
      <div className="space-y-4">
        <p className="text-gray-700 text-center">
          Te ayudo a registrar tus gastos e ingresos de forma rápida y sencilla: puedes hablarme, escribirme o usar WhatsApp… ¡como tú prefieras!
        </p>
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4">
          <p className="text-sm text-gray-600 text-center">
            💡 Nuestra IA y yo nos encargamos de organizar y categorizar todo automáticamente, para que tengas claridad total sin complicarte.
          </p>
        </div>
      </div>
    )
  },
  {
    id: 2,
    title: 'Registra desde WhatsApp',
    subtitle: 'La forma más rápida y cómoda de guardar tus transacciones 💜',
    icon: MessageCircle,
    iconColor: 'text-green-600',
    iconBg: 'bg-green-100',
    content: (
      <div className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-start gap-3 bg-white rounded-xl p-3 border border-gray-200">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
              <span className="text-green-600 text-lg">🎤</span>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900 text-sm">1. Envíame un audio</p>
              <p className="text-gray-600 text-xs mt-1">"Pagué 50 de supermercado"</p>
            </div>
          </div>
          <div className="flex items-start gap-3 bg-white rounded-xl p-3 border border-gray-200">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <span className="text-blue-600 text-lg">💬</span>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900 text-sm">2. O mándame un texto</p>
              <p className="text-gray-600 text-xs mt-1">"Gasté 30 en almuerzo"</p>
            </div>
          </div>
          <div className="flex items-start gap-3 bg-white rounded-xl p-3 border border-gray-200">
            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
              <span className="text-purple-600 text-lg">✨</span>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900 text-sm">3. Yo y la IA hacemos el resto</p>
              <p className="text-gray-600 text-xs mt-1">Organizo y clasifico tu transacción y la guardo automáticamente en tu cuenta.</p>
            </div>
          </div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
          <p className="text-xs text-yellow-800 text-center">
            ⚠️ Asegúrate de estar registrado con el mismo número desde el que me escribirás. 💜
          </p>
        </div>
      </div>
    )
  },
  {
    id: 3,
    title: 'O puedes usar el micrófono de la app para hablarme',
    subtitle: 'Así te ayudo a registrar tus transacciones sin escribir nada.',
    icon: Mic,
    iconColor: 'text-white',
    iconBg: 'bg-gradient-to-r from-blue-600 to-purple-600',
    useMicButton: true, // Usar el mismo diseño del botón de la barra
    content: (
      <div className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-start gap-3 bg-white rounded-xl p-3 border border-gray-200">
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
              <span className="text-red-600 text-lg">👆</span>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900 text-sm">1. Mantén presionado el micrófono</p>
              <p className="text-gray-600 text-xs mt-1">Lo encontrarás en la barra inferior de navegación.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 bg-white rounded-xl p-3 border border-gray-200">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <span className="text-blue-600 text-lg">🎤</span>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900 text-sm">2. Dime tu transacción</p>
              <p className="text-gray-600 text-xs mt-1">Por ejemplo: "Pagué 50 de supermercado"</p>
            </div>
          </div>
          <div className="flex items-start gap-3 bg-white rounded-xl p-3 border border-gray-200">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
              <span className="text-green-600 text-lg">✅</span>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900 text-sm">3. Confirma y listo</p>
              <p className="text-gray-600 text-xs mt-1">La IA y yo nos encargamos de categorizarlo automáticamente por ti.</p>
            </div>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 4,
    title: 'O si prefieres, simplemente escríbeme tus transacciones.',
    subtitle: '',
    icon: Type,
    iconColor: 'text-white',
    iconBg: 'bg-gradient-to-r from-green-500 to-emerald-500',
    useTextButton: true, // Usar el mismo diseño del botón de texto del dashboard
    content: (
      <div className="space-y-4">
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <p className="text-sm font-semibold text-gray-900 mb-2">Ejemplo:</p>
          <p className="text-sm text-gray-700 italic">
            "Gasté 30 en almuerzo y recibí 200 de salario"
          </p>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <span className="text-green-600">✓</span>
            <span>Puedes enviarme varias transacciones en un solo mensaje</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <span className="text-green-600">✓</span>
            <span>Yo, junto con la IA, detecto automáticamente qué es gasto y qué es ingreso</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <span className="text-green-600">✓</span>
            <span>Solo necesito que el mensaje no pase de 100 caracteres</span>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 5,
    title: 'Ve tu resumen diario',
    subtitle: 'Yo te muestro tus finanzas en tiempo real 💜',
    icon: BarChart3,
    iconColor: 'text-purple-600',
    iconBg: 'bg-purple-100',
    content: (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-green-50 rounded-xl p-3 text-center border border-green-200">
            <p className="text-xs text-green-700 mb-1">Ingresos</p>
            <p className="text-sm font-bold text-green-600">+Bs 200</p>
          </div>
          <div className="bg-red-50 rounded-xl p-3 text-center border border-red-200">
            <p className="text-xs text-red-700 mb-1">Gastos</p>
            <p className="text-sm font-bold text-red-600">-Bs 50</p>
          </div>
          <div className="bg-blue-50 rounded-xl p-3 text-center border border-blue-200">
            <p className="text-xs text-blue-700 mb-1">Balance</p>
            <p className="text-sm font-bold text-blue-600">+Bs 150</p>
          </div>
        </div>
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-3">
          <p className="text-xs text-gray-700 text-center">
            📊 Puedo enseñarte tus estadísticas del día directamente en tu dashboard
          </p>
        </div>
      </div>
    )
  },
  {
    id: 6,
    title: 'Revisa tu historial',
    subtitle: 'Aquí guardo todas tus transacciones, siempre organizadas para ti',
    icon: History,
    iconColor: 'text-indigo-600',
    iconBg: 'bg-indigo-100',
    content: (
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <span className="text-indigo-600">📅</span>
            <span>Las ordeno por fecha automáticamente</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <span className="text-indigo-600">🔍</span>
            <span>Puedes filtrarlas por tipo, categoría o método de pago</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <span className="text-indigo-600">📊</span>
            <span>También te muestro resúmenes diarios de tus gastos e ingresos</span>
          </div>
        </div>
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3">
          <p className="text-xs text-indigo-800 text-center">
            Y si necesitas cambiar algo, puedes editar o eliminar deslizando hacia la izquierda
          </p>
        </div>
      </div>
    )
  },
  {
    id: 7,
    title: '¡Tienes 14 días gratis desde ahora!',
    subtitle: 'Disfruta de todos los beneficios sin costo 💜',
    icon: Gift,
    iconColor: 'text-yellow-600',
    iconBg: 'bg-yellow-100',
    content: (
      <div className="space-y-4">
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-4 border border-yellow-200">
          <p className="text-sm font-semibold text-gray-900 mb-2 text-center">
            🎁 ¡A partir de este momento tienes 14 días gratis!
          </p>
          <p className="text-xs text-gray-700 text-center">
            Puedes usar todas las funciones de la app sin ningún costo durante estos días.
          </p>
        </div>
        <div className="space-y-3">
          <div className="flex items-start gap-3 bg-white rounded-xl p-3 border border-gray-200">
            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
              <span className="text-purple-600 text-lg">👥</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900 mb-1">Gana otros 14 días más invitando amigos</p>
              <p className="text-xs text-gray-600">
                Si invitas a 5 personas con tu código personal y todas verifican su número de WhatsApp, te regalo otros 14 días gratis.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 bg-white rounded-xl p-3 border border-gray-200">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
              <span className="text-green-600 text-lg">✓</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900 mb-1">Primero verifica tu número por WhatsApp</p>
              <p className="text-xs text-gray-600">
                Para poder invitar a tus amigos, primero necesitas verificar tu número de teléfono por WhatsApp en tu perfil.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 bg-white rounded-xl p-3 border border-gray-200">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <span className="text-blue-600 text-lg">🔐</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900 mb-1">Tus invitados también deben verificar</p>
              <p className="text-xs text-gray-600">
                Para que cuenten en tu invitación, tus amigos también tienen que verificar su número de WhatsApp.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }
];

export default function OnboardingTutorial({ isOpen, onClose, onComplete }: OnboardingTutorialProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { setModalOpen } = useModal();

  // Ocultar Navbar cuando el tutorial está abierto
  useEffect(() => {
    if (isOpen) {
      setModalOpen(true);
    } else {
      setModalOpen(false);
    }
    
    // Cleanup: asegurar que se restaure cuando el componente se desmonte
    return () => {
      setModalOpen(false);
    };
  }, [isOpen, setModalOpen]);

  if (!isOpen) return null;

  const currentSlideData = SLIDES[currentSlide];
  const Icon = currentSlideData.icon;
  const isFirstSlide = currentSlide === 0;
  const isLastSlide = currentSlide === SLIDES.length - 1;

  const handleNext = () => {
    if (isLastSlide) {
      handleComplete();
    } else {
      setCurrentSlide(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (!isFirstSlide) {
      setCurrentSlide(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    onComplete();
    setCurrentSlide(0); // Reset para la próxima vez
  };


  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl animate-scale-in relative overflow-hidden">
        {/* Contenido del slide */}
        <div className="p-6 pt-6">
          {/* Icono o Logo */}
          <div className={`flex justify-center ${currentSlideData.useLogo ? 'mb-3' : 'mb-6'}`}>
            {currentSlideData.useLogo ? (
              // Usar logo para el primer slide
              <div className="w-32 h-32 flex items-center justify-center">
                <Image
                  src="/logo.png"
                  alt="Ahorro365 Logo"
                  width={128}
                  height={128}
                  className="object-contain"
                  priority
                  onError={(e) => {
                    // Fallback a icono si el logo no se encuentra
                    logger.warn('Logo no encontrado, usando icono por defecto');
                    const target = e.target as HTMLImageElement;
                    if (target) {
                      target.style.display = 'none';
                      const fallback = target.nextElementSibling as HTMLElement;
                      if (fallback) fallback.style.display = 'flex';
                    }
                  }}
                />
                <div className={`w-20 h-20 rounded-full ${currentSlideData.iconBg} flex items-center justify-center hidden`}>
                  <Icon size={40} className={currentSlideData.iconColor} />
                </div>
              </div>
            ) : currentSlideData.useMicButton ? (
              // Usar el mismo diseño del botón de micrófono de la barra de navegación
              <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center shadow-2xl">
                <Icon size={40} className="text-white" />
              </div>
            ) : currentSlideData.useTextButton ? (
              // Usar el mismo diseño del botón de texto del dashboard
              <div className="w-20 h-20 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center shadow-2xl">
                <Icon size={40} className="text-white" />
              </div>
            ) : (
              // Usar icono para los demás slides
              <div className={`w-20 h-20 rounded-full ${currentSlideData.iconBg} flex items-center justify-center`}>
                <Icon size={40} className={currentSlideData.iconColor} />
              </div>
            )}
          </div>

          {/* Título y subtítulo */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {currentSlideData.title}
            </h2>
            <p className="text-sm text-gray-600">
              {currentSlideData.subtitle}
            </p>
          </div>

          {/* Contenido */}
          <div className="mb-6 min-h-[200px]">
            {currentSlideData.content}
          </div>

          {/* Indicadores de progreso */}
          <div className="flex justify-center gap-2 mb-6">
            {SLIDES.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all ${
                  index === currentSlide
                    ? 'bg-purple-600 w-8'
                    : 'bg-gray-300 w-2'
                }`}
              />
            ))}
          </div>

          {/* Botones de navegación */}
          <div className="flex gap-3">
            {!isFirstSlide && (
              <button
                onClick={handlePrevious}
                className="flex-1 py-3 px-4 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
              >
                <ChevronLeft size={20} />
                Anterior
              </button>
            )}
            <button
              onClick={handleNext}
              className={`flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold hover:opacity-90 transition-all flex items-center justify-center gap-2 ${
                isFirstSlide ? 'w-full' : ''
              }`}
            >
              {isLastSlide ? 'Comenzar' : (
                <>
                  Siguiente
                  <ChevronRight size={20} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

