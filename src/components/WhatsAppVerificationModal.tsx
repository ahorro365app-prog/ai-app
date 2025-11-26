"use client";

import { useState, useEffect } from 'react';
import { X, Phone, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useSupabase } from '@/contexts/SupabaseContext';
import { useModal } from '@/contexts/ModalContext';
import { validatePhoneNumber, formatPhoneNumber } from '@/lib/referralUtils';
import { logger } from '@/lib/logger';

interface WhatsAppVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerify: () => void;
}

export default function WhatsAppVerificationModal({
  isOpen,
  onClose,
  onVerify
}: WhatsAppVerificationModalProps) {
  const { sendWhatsAppVerificationCode, verifyWhatsAppCode, user } = useSupabase();
  const { setModalOpen } = useModal();
  
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [codeSent, setCodeSent] = useState(false);

  // Clave para localStorage basada en el teléfono del usuario
  const getStorageKey = () => {
    const phone = user?.telefono || phoneNumber;
    if (!phone) return null;
    const cleanedPhone = phone.replace(/\D/g, '');
    return `whatsapp_verification_${cleanedPhone}`;
  };

  // Función para guardar código en localStorage
  const saveCodeToStorage = (expiresAt: string) => {
    const key = getStorageKey();
    if (!key) return;
    try {
      localStorage.setItem(key, JSON.stringify({
        expiresAt,
        phone: user?.telefono || phoneNumber,
        savedAt: new Date().toISOString()
      }));
    } catch (error) {
      logger.error('Error guardando en localStorage:', error);
    }
  };

  // Función para cargar código desde localStorage
  const loadCodeFromStorage = (): { expiresAt: string; phone: string } | null => {
    const key = getStorageKey();
    if (!key) return null;
    try {
      const stored = localStorage.getItem(key);
      if (!stored) return null;
      const data = JSON.parse(stored);
      // Verificar que el código no haya expirado
      const expiresAtDate = new Date(data.expiresAt);
      if (expiresAtDate <= new Date()) {
        // Código expirado, limpiar localStorage
        localStorage.removeItem(key);
        return null;
      }
      return data;
    } catch (error) {
      logger.error('Error cargando desde localStorage:', error);
      return null;
    }
  };

  // Función para limpiar código de localStorage
  const clearCodeFromStorage = () => {
    const key = getStorageKey();
    if (key) {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        logger.error('Error limpiando localStorage:', error);
      }
    }
  };

  // Función para calcular tiempo restante desde fecha de expiración
  const calculateTimeRemaining = (expiresAt: string): number => {
    const expiresAtDate = new Date(expiresAt);
    const now = new Date();
    const diff = Math.floor((expiresAtDate.getTime() - now.getTime()) / 1000);
    return Math.max(0, diff);
  };

  // Notificar al contexto cuando el modal se abre o cierra
  useEffect(() => {
    setModalOpen(isOpen);
  }, [isOpen, setModalOpen]);

  // Restaurar estado desde localStorage cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      setPhoneNumber(user?.telefono || '');
      setError('');
      
      // Intentar restaurar código desde localStorage
      const storedCode = loadCodeFromStorage();
      if (storedCode) {
        const timeRemaining = calculateTimeRemaining(storedCode.expiresAt);
        if (timeRemaining > 0) {
          // Hay código activo, restaurar estado
          setCodeSent(true);
          setStep('code');
          setCountdown(timeRemaining);
          logger.debug('✅ Código restaurado desde localStorage:', {
            timeRemaining,
            expiresAt: storedCode.expiresAt
          });
        } else {
          // Código expirado, limpiar
          clearCodeFromStorage();
          setCodeSent(false);
          setStep('phone');
          setCountdown(0);
        }
      } else {
        // No hay código guardado, estado inicial
        setStep('phone');
        setCodeSent(false);
        setCountdown(0);
      }
      
      setVerificationCode('');
    }
  }, [isOpen, user]);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSendCode = async () => {
    setError('');
    
    // Validar número de teléfono (ya viene del usuario, solo validar formato)
    const cleanedPhone = phoneNumber.replace(/\D/g, '');
    if (!validatePhoneNumber(cleanedPhone)) {
      setError('El número de teléfono no es válido. Por favor edítalo en tu perfil.');
      return;
    }

    setLoading(true);
    const formattedPhone = formatPhoneNumber(cleanedPhone);
    
    try {
      const result = await sendWhatsAppVerificationCode(formattedPhone);
      
      if (result.success) {
        setCodeSent(true);
        setStep('code');
        
        // Si hay código activo, usar la información del servidor
        if (result.hasActiveCode && result.expiresAt) {
          const timeRemaining = calculateTimeRemaining(result.expiresAt);
          setCountdown(timeRemaining);
          saveCodeToStorage(result.expiresAt);
          logger.debug('✅ Código activo encontrado, usando información del servidor:', {
            expiresIn: result.expiresIn,
            timeRemaining
          });
        } else if (result.expiresAt) {
          // Código nuevo generado, guardar en localStorage
          setCountdown(result.expiresIn || 600);
          saveCodeToStorage(result.expiresAt);
          logger.debug('✅ Código nuevo generado, guardado en localStorage');
        } else {
          // Fallback: 10 minutos si no hay información de expiración
          const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
          setCountdown(600);
          saveCodeToStorage(expiresAt);
        }
      } else {
        // Si el código está guardado pero WhatsApp falló, dar mensaje más útil
        if (result.codeSaved) {
          setError(
            result.error || 
            'El código se generó pero no se pudo enviar por WhatsApp. Verifica la configuración del servidor o intenta de nuevo.'
          );
        } else {
          setError(result.error || 'Error al enviar código');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Error al enviar código');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    setError('');
    
    if (verificationCode.length !== 6) {
      setError('El código debe tener 6 dígitos');
      return;
    }

    setLoading(true);
    const cleanedPhone = phoneNumber.replace(/\D/g, '');
    const formattedPhone = formatPhoneNumber(cleanedPhone);
    
    try {
      const result = await verifyWhatsAppCode(formattedPhone, verificationCode);
      
      if (result.success) {
        // Limpiar localStorage al verificar exitosamente
        clearCodeFromStorage();
        setModalOpen(false);
        onVerify();
        onClose();
      } else {
        setError(result.error || 'Código inválido');
      }
    } catch (err: any) {
      setError(err.message || 'Error al verificar código');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (countdown > 0) return;
    
    setError('');
    setLoading(true);
    const cleanedPhone = phoneNumber.replace(/\D/g, '');
    const formattedPhone = formatPhoneNumber(cleanedPhone);
    
    try {
      const result = await sendWhatsAppVerificationCode(formattedPhone);
      
      if (result.success) {
        // Si hay código activo, usar la información del servidor
        if (result.hasActiveCode && result.expiresAt) {
          const timeRemaining = calculateTimeRemaining(result.expiresAt);
          setCountdown(timeRemaining);
          saveCodeToStorage(result.expiresAt);
        } else if (result.expiresAt) {
          // Código nuevo generado
          setCountdown(result.expiresIn || 600);
          saveCodeToStorage(result.expiresAt);
        } else {
          // Fallback: 10 minutos
          const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
          setCountdown(600);
          saveCodeToStorage(expiresAt);
        }
        setVerificationCode('');
        setError('');
      } else {
        setError(result.error || 'Error al reenviar código');
      }
    } catch (err: any) {
      setError(err.message || 'Error al reenviar código');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {step === 'phone' ? 'Verificar WhatsApp' : 'Ingresa el código'}
          </h2>
          <button
            onClick={() => {
              setModalOpen(false);
              onClose();
            }}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={24} className="text-gray-500" />
          </button>
        </div>

                                     {step === 'phone' ? (
             /* Paso 1: Mostrar número de teléfono (solo lectura) */
             <div className="space-y-4">
               <div>
                 <label className="block text-sm font-semibold text-gray-700 mb-3">
                   Número de teléfono
                 </label>
                 <div className="flex items-center gap-2">
                   <Phone size={20} className="text-gray-400" />
                   <span className="text-lg font-semibold text-gray-900">
                     {(() => {
                       // Lista de prefijos conocidos para separación correcta
                       const knownPrefixes = [
                         '+591', // Bolivia
                         '+54',  // Argentina
                         '+52',  // México
                         '+34',  // España
                         '+1',   // Estados Unidos/Canadá
                         '+44',  // Reino Unido
                         '+55',  // Brasil
                         '+57',  // Colombia
                         '+51',  // Perú
                         '+56',  // Chile
                         '+58',  // Venezuela
                         '+593', // Ecuador
                         '+595', // Paraguay
                         '+598', // Uruguay
                       ];
                       
                       if (!phoneNumber) return 'No configurado';
                       
                       // Buscar el prefijo más largo que coincida
                       for (const prefix of knownPrefixes.sort((a, b) => b.length - a.length)) {
                         if (phoneNumber.startsWith(prefix)) {
                           const number = phoneNumber.substring(prefix.length);
                           return (
                             <>
                               <span className="text-gray-600">{prefix}</span>
                               <span className="ml-2">{number}</span>
                             </>
                           );
                         }
                       }
                       
                       // Fallback: usar detección automática
                       const match = phoneNumber.match(/^(\+\d{2,3})(\d+)$/);
                       if (match) {
                         return (
                           <>
                             <span className="text-gray-600">{match[1]}</span>
                             <span className="ml-2">{match[2]}</span>
                           </>
                         );
                       }
                       
                       return phoneNumber;
                     })()}
                   </span>
                 </div>
                <p className="text-xs text-gray-500 mt-3">
                  Te enviaremos un código de 6 dígitos por WhatsApp
                </p>
                
                {/* Advertencia sobre restricción de cambio después de verificar */}
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
                  <div className="flex items-start gap-2">
                    <AlertCircle size={16} className="text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-yellow-900 mb-1">
                        ⚠️ Importante
                      </p>
                      <p className="text-xs text-yellow-800">
                        Una vez verificado, no podrás cambiar tu número fácilmente. 
                        Solo podrás cambiarlo después de verificar el nuevo número y 
                        deberás esperar 30 días entre cambios.
                      </p>
                    </div>
                  </div>
                </div>
               </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 rounded-xl border border-red-200">
                  <AlertCircle size={16} className="text-red-600" />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <button
                onClick={handleSendCode}
                disabled={loading || !phoneNumber.trim()}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Enviando...' : 'Enviar código'}
              </button>
            </div>
        ) : (
                     /* Paso 2: Ingresar código de verificación */
           <div className="space-y-4">
             <div>
               <label className="block text-sm font-semibold text-gray-700 mb-3">
                 Código de verificación (6 dígitos)
               </label>
               <input
                 type="text"
                 value={verificationCode}
                 onChange={(e) => {
                   const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                   setVerificationCode(value);
                 }}
                 placeholder="000000"
                 className="w-full text-center text-3xl font-bold tracking-[0.5em] text-gray-900 focus:outline-none bg-transparent"
                 autoFocus
                 maxLength={6}
               />
              <div className="flex items-center justify-center mt-3">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Clock size={14} />
                  <span>
                    {countdown > 0 ? `Expira en ${formatCountdown(countdown)}` : 'Código expirado'}
                  </span>
                </div>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 rounded-xl border border-red-200">
                <AlertCircle size={16} className="text-red-600" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setModalOpen(false);
                  onClose();
                }}
                className="flex-1 py-3.5 px-4 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleVerifyCode}
                disabled={loading || verificationCode.length !== 6}
                className="flex-1 py-3.5 px-4 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Verificando...' : 'Verificar'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
