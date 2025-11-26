"use client";

import { useState, useEffect, useCallback } from 'react';
import { X, Phone, CheckCircle, Clock, AlertCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { useSupabase } from '@/contexts/SupabaseContext';
import { useModal } from '@/contexts/ModalContext';
import { validatePhoneNumber, formatPhoneNumber } from '@/lib/referralUtils';
import { logger } from '@/lib/logger';

interface PhoneChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type Step = 'enter_phone' | 'confirm' | 'verify_code' | 'success';

export default function PhoneChangeModal({
  isOpen,
  onClose,
  onSuccess
}: PhoneChangeModalProps) {
  const { 
    user, 
    checkCanChangePhone, 
    initiatePhoneChange, 
    verifyPhoneChange, 
    cancelPhoneChange 
  } = useSupabase();
  const { setModalOpen } = useModal();
  
  const [step, setStep] = useState<Step>('enter_phone');
  const [newPhone, setNewPhone] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [canChange, setCanChange] = useState<{ canChange: boolean; reason?: string; daysRemaining?: number } | null>(null);
  const [pendingPhone, setPendingPhone] = useState<string>(''); // Guardar el teléfono pendiente para mostrarlo

  // Clave para localStorage basada en el nuevo teléfono
  const getStorageKey = useCallback((phone: string) => {
    if (!phone) return null;
    const cleanedPhone = phone.replace(/\D/g, '');
    return `phone_change_verification_${cleanedPhone}`;
  }, []);

  // Función para guardar código en localStorage
  const saveCodeToStorage = useCallback((phone: string, expiresAt: string) => {
    const key = getStorageKey(phone);
    if (!key) return;
    try {
      localStorage.setItem(key, JSON.stringify({
        expiresAt,
        phone,
        savedAt: new Date().toISOString()
      }));
      logger.debug('💾 Guardado en localStorage:', { key, expiresAt });
    } catch (error) {
      logger.error('❌ Error guardando en localStorage:', error);
    }
  }, [getStorageKey]);

  // Función para cargar código desde localStorage
  const loadCodeFromStorage = useCallback((phone: string): { expiresAt: string; phone: string } | null => {
    const key = getStorageKey(phone);
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
        logger.debug('⏰ Código expirado, limpiando localStorage');
        return null;
      }
      logger.debug('📂 Código cargado desde localStorage:', { key, expiresAt: data.expiresAt });
      return data;
    } catch (error) {
      logger.error('❌ Error cargando desde localStorage:', error);
      return null;
    }
  }, [getStorageKey]);

  // Función para limpiar código de localStorage
  const clearCodeFromStorage = useCallback((phone: string) => {
    const key = getStorageKey(phone);
    if (key) {
      try {
        localStorage.removeItem(key);
        logger.debug('🗑️ localStorage limpiado:', key);
      } catch (error) {
        logger.error('❌ Error limpiando localStorage:', error);
      }
    }
  }, [getStorageKey]);

  // Función para calcular tiempo restante desde fecha de expiración
  const calculateTimeRemaining = useCallback((expiresAt: string): number => {
    const expiresAtDate = new Date(expiresAt);
    const now = new Date();
    const diff = Math.floor((expiresAtDate.getTime() - now.getTime()) / 1000);
    return Math.max(0, diff);
  }, []);

  // Mapeo de países con sus prefijos
  const countries = [
    { code: 'BO', name: 'Bolivia', prefix: '+591' },
    { code: 'AR', name: 'Argentina', prefix: '+54' },
    { code: 'BR', name: 'Brasil', prefix: '+55' },
    { code: 'CL', name: 'Chile', prefix: '+56' },
    { code: 'CO', name: 'Colombia', prefix: '+57' },
    { code: 'EC', name: 'Ecuador', prefix: '+593' },
    { code: 'PE', name: 'Perú', prefix: '+51' },
    { code: 'PY', name: 'Paraguay', prefix: '+595' },
    { code: 'UY', name: 'Uruguay', prefix: '+598' },
    { code: 'VE', name: 'Venezuela', prefix: '+58' },
    { code: 'MX', name: 'México', prefix: '+52' },
    { code: 'ES', name: 'España', prefix: '+34' },
    { code: 'US', name: 'Estados Unidos', prefix: '+1' },
  ];

  // Extraer código de país del teléfono actual
  const getCountryPrefix = (): string => {
    if (!user?.telefono) return '+591'; // Default
    
    // Buscar el prefijo más largo que coincida
    const sortedPrefixes = countries
      .map(c => c.prefix)
      .sort((a, b) => b.length - a.length);
    
    for (const prefix of sortedPrefixes) {
      if (user.telefono.startsWith(prefix)) {
        return prefix;
      }
    }
    
    // Si no encuentra, intentar extraer del formato +XXX
    const match = user.telefono.match(/^(\+\d{1,3})/);
    if (match) {
      return match[1];
    }
    
    return '+591'; // Fallback
  };

  const countryPrefix = getCountryPrefix();

  // Notificar al contexto cuando el modal se abre o cierra
  useEffect(() => {
    setModalOpen(isOpen);
  }, [isOpen, setModalOpen]);

  // Función memoizada para verificar si puede cambiar teléfono
  // NOTA: Esta función ya no se usa en el useEffect para evitar bucles
  // Se mantiene por si se necesita en otro lugar
  const checkCanChangeStatus = useCallback(async () => {
    if (!user) return;
    
    const result = await checkCanChangePhone();
    setCanChange(result);
    
    if (!result.canChange && user.whatsapp_verificado) {
      // Si no puede cambiar y está verificado, mostrar error
      setError(result.reason || 'No puedes cambiar el teléfono en este momento');
    }
  }, [user, checkCanChangePhone]);

  // Función para buscar código pendiente en localStorage
  const findPendingCodeInStorage = useCallback((): { phone: string; expiresAt: string } | null => {
    try {
      // Buscar todas las claves que empiecen con phone_change_verification_
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('phone_change_verification_')) {
          keys.push(key);
        }
      }
      
      // Buscar el código activo más reciente
      let latestCode: { phone: string; expiresAt: string } | null = null;
      let latestTime = 0;
      
      for (const key of keys) {
        try {
          const stored = localStorage.getItem(key);
          if (!stored) continue;
          
          const data = JSON.parse(stored);
          const expiresAtDate = new Date(data.expiresAt);
          
          // Verificar que no haya expirado
          if (expiresAtDate <= new Date()) {
            // Código expirado, limpiar
            localStorage.removeItem(key);
            continue;
          }
          
          // Encontrar el más reciente
          const savedAtTime = new Date(data.savedAt || data.expiresAt).getTime();
          if (savedAtTime > latestTime) {
            latestTime = savedAtTime;
            latestCode = { phone: data.phone, expiresAt: data.expiresAt };
          }
        } catch (error) {
          logger.error('❌ Error procesando clave de localStorage:', key, error);
        }
      }
      
      return latestCode;
    } catch (error) {
      logger.error('❌ Error buscando en localStorage:', error);
      return null;
    }
  }, []);

  // Resetear estado cuando se abre el modal
  useEffect(() => {
    if (!isOpen) return;
    
    let isMounted = true;
    
    // Función interna para verificar estado
    const initializeModal = async () => {
      // Buscar código pendiente directamente en localStorage
      const pendingCode = findPendingCodeInStorage();
      
      if (pendingCode) {
        const timeRemaining = calculateTimeRemaining(pendingCode.expiresAt);
        if (timeRemaining > 0 && isMounted) {
          // Restaurar estado del código pendiente
          setPendingPhone(pendingCode.phone);
          setStep('verify_code');
          setCountdown(timeRemaining);
          
          // Extraer número local del teléfono completo
          const cleanedPhone = pendingCode.phone.replace(/\D/g, '');
          // Buscar prefijo más largo que coincida
          const sortedPrefixes = countries
            .map(c => c.prefix)
            .sort((a, b) => b.length - a.length);
          
          let localNumber = cleanedPhone;
          for (const prefix of sortedPrefixes) {
            const prefixDigits = prefix.replace(/\D/g, '');
            if (cleanedPhone.startsWith(prefixDigits)) {
              localNumber = cleanedPhone.substring(prefixDigits.length);
              break;
            }
          }
          
          setNewPhone(localNumber);
          logger.debug('✅ Estado restaurado desde localStorage:', { 
            phone: pendingCode.phone, 
            timeRemaining,
            localNumber 
          });
          
          // Verificar si puede cambiar (solo una vez, solo si está montado)
          if (user && isMounted) {
            try {
              const result = await checkCanChangePhone();
              if (isMounted) {
                setCanChange(result);
              }
            } catch (error) {
              logger.error('❌ Error verificando si puede cambiar:', error);
            }
          }
          return;
        } else {
          // Código expirado, limpiar
          clearCodeFromStorage(pendingCode.phone);
        }
      }
      
      // No hay código pendiente o expiró, resetear todo
      if (isMounted) {
        setStep('enter_phone');
        setNewPhone('');
        setVerificationCode('');
        setError('');
        setCountdown(0);
        setCanChange(null);
        setPendingPhone('');
        
        // Verificar si puede cambiar (solo una vez, solo si está montado)
        if (user) {
          try {
            const result = await checkCanChangePhone();
            if (isMounted) {
              setCanChange(result);
            }
          } catch (error) {
            logger.error('❌ Error verificando si puede cambiar:', error);
          }
        }
      }
    };
    
    initializeModal();
    
    return () => {
      isMounted = false;
    };
  }, [isOpen]); // Solo isOpen como dependencia para evitar bucles

  // Preservar newPhone cuando cambia el step (no limpiarlo al avanzar)
  // Solo limpiar cuando se cierra el modal completamente

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && step === 'verify_code' && pendingPhone) {
      // Código expirado, limpiar localStorage
      clearCodeFromStorage(pendingPhone);
      logger.debug('⏰ Código expirado, limpiando localStorage');
    }
  }, [countdown, step, pendingPhone, clearCodeFromStorage]);

  const handleContinue = async () => {
    setError('');
    
    // Validar que haya ingresado un número
    if (!newPhone.trim()) {
      setError('Por favor ingresa un número de teléfono');
      return;
    }

    // Combinar prefijo de país con número local
    const cleanedPhone = newPhone.replace(/\D/g, '');
    const fullPhone = `${countryPrefix}${cleanedPhone}`;
    
    // Validar formato del teléfono completo
    if (!validatePhoneNumber(fullPhone)) {
      setError('Formato de teléfono inválido');
      return;
    }

    // Verificar que sea diferente al actual
    if (fullPhone === user?.telefono) {
      setError('El nuevo número debe ser diferente al actual');
      return;
    }

    // Avanzar a confirmación
    setStep('confirm');
  };

  const handleConfirm = async () => {
    setError('');
    setLoading(true);

    try {
      // Combinar prefijo de país con número local
      const cleanedPhone = newPhone.replace(/\D/g, '');
      const fullPhone = `${countryPrefix}${cleanedPhone}`;
      const formattedPhone = formatPhoneNumber(fullPhone);

      const result = await initiatePhoneChange(formattedPhone);

      if (result.success) {
        // Guardar el teléfono pendiente para mostrarlo en el paso de verificación
        setPendingPhone(formattedPhone);
        setStep('verify_code');
        
        // Calcular countdown desde expiresAt si está disponible, sino usar 600 segundos
        let initialCountdown = 600; // 10 minutos por defecto
        if (result.expiresAt) {
          initialCountdown = calculateTimeRemaining(result.expiresAt);
          // Guardar en localStorage
          saveCodeToStorage(formattedPhone, result.expiresAt);
        } else if (result.expiresIn) {
          initialCountdown = result.expiresIn;
          // Calcular expiresAt desde expiresIn
          const expiresAt = new Date(Date.now() + result.expiresIn * 1000).toISOString();
          saveCodeToStorage(formattedPhone, expiresAt);
        } else {
          // Fallback: calcular expiresAt desde 10 minutos
          const expiresAt = new Date(Date.now() + 600 * 1000).toISOString();
          saveCodeToStorage(formattedPhone, expiresAt);
        }
        
        setCountdown(initialCountdown);
        // Sanitizar teléfono para logs
        const sanitizedPhone = formattedPhone ? `${formattedPhone.substring(0, 3)}***${formattedPhone.substring(formattedPhone.length - 2)}` : 'null';
        logger.debug('✅ Código enviado, guardado en localStorage:', { phone: sanitizedPhone, countdown: initialCountdown });
      } else {
        setError(result.error || 'Error al iniciar cambio de teléfono');
        setStep('enter_phone');
      }
    } catch (err: any) {
      setError(err.message || 'Error al iniciar cambio de teléfono');
      setStep('enter_phone');
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

    try {
      const result = await verifyPhoneChange(verificationCode);

      if (result.success) {
        // Limpiar localStorage al verificar exitosamente
        if (pendingPhone) {
          clearCodeFromStorage(pendingPhone);
        }
        setStep('success');
        setTimeout(() => {
          setModalOpen(false);
          onSuccess();
          onClose();
        }, 2000);
      } else {
        setError(result.error || 'Código inválido');
      }
    } catch (err: any) {
      setError(err.message || 'Error al verificar código');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    // NO cancelar el proceso pendiente, solo cerrar el modal
    // El cambio queda pendiente y el usuario puede continuar después
    setModalOpen(false);
    onClose();
  };

  const handleResendCode = async () => {
    if (countdown > 0) return;
    
    setError('');
    setLoading(true);
    // Combinar prefijo de país con número local
    const cleanedPhone = newPhone.replace(/\D/g, '');
    const fullPhone = `${countryPrefix}${cleanedPhone}`;
    const formattedPhone = formatPhoneNumber(fullPhone);

    try {
      const result = await initiatePhoneChange(formattedPhone);

      if (result.success) {
        // Calcular countdown desde expiresAt si está disponible
        let newCountdown = 600; // 10 minutos por defecto
        if (result.expiresAt) {
          newCountdown = calculateTimeRemaining(result.expiresAt);
          saveCodeToStorage(formattedPhone, result.expiresAt);
        } else if (result.expiresIn) {
          newCountdown = result.expiresIn;
          const expiresAt = new Date(Date.now() + result.expiresIn * 1000).toISOString();
          saveCodeToStorage(formattedPhone, expiresAt);
        } else {
          const expiresAt = new Date(Date.now() + 600 * 1000).toISOString();
          saveCodeToStorage(formattedPhone, expiresAt);
        }
        
        setCountdown(newCountdown);
        setVerificationCode('');
        setError('');
        // Sanitizar teléfono para logs
        const sanitizedPhone = formattedPhone ? `${formattedPhone.substring(0, 3)}***${formattedPhone.substring(formattedPhone.length - 2)}` : 'null';
        logger.debug('✅ Código reenviado, actualizado localStorage:', { phone: sanitizedPhone, countdown: newCountdown });
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

  const formatPhoneDisplay = (phone: string) => {
    if (!phone) return '';
    
    // Limpiar el teléfono para trabajar solo con dígitos y el +
    const cleaned = phone.replace(/\s/g, '');
    
    const knownPrefixes = [
      '+591', '+54', '+52', '+34', '+1', '+44', '+55', '+57', '+51', '+56', '+58', '+593', '+595', '+598'
    ];
    
    // Buscar el prefijo más largo que coincida
    for (const prefix of knownPrefixes.sort((a, b) => b.length - a.length)) {
      if (cleaned.startsWith(prefix)) {
        const number = cleaned.substring(prefix.length);
        // Formatear número con espacios cada 4 dígitos
        // Dividir en grupos de 4 y unir con espacios
        const formattedNumber = number.match(/.{1,4}/g)?.join(' ') || number;
        return `${prefix} ${formattedNumber}`;
      }
    }
    
    // Si no encuentra prefijo conocido, intentar extraer código de país genérico
    const match = cleaned.match(/^(\+\d{1,3})(\d+)$/);
    if (match) {
      const number = match[2];
      // Formatear número con espacios cada 4 dígitos
      const formattedNumber = number.match(/.{1,4}/g)?.join(' ') || number;
      return `${match[1]} ${formattedNumber}`;
    }
    
    return phone;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {step === 'enter_phone' && 'Cambiar Teléfono'}
            {step === 'confirm' && 'Confirmar Cambio'}
            {step === 'verify_code' && 'Verificar Nuevo Teléfono'}
            {step === 'success' && '✅ Teléfono Cambiado'}
          </h2>
          {step !== 'success' && (
            <button
              onClick={handleCancel}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={24} className="text-gray-500" />
            </button>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
            <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Step 1: Ingreso de Nuevo Número */}
        {step === 'enter_phone' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Teléfono actual
              </label>
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-200">
                <Phone size={20} className="text-gray-400" />
                <span className="text-lg font-semibold text-gray-900">
                  {user?.telefono ? formatPhoneDisplay(user.telefono) : 'No configurado'}
                </span>
                {user?.whatsapp_verificado && (
                  <span className="ml-auto px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full flex items-center gap-1">
                    <CheckCircle size={12} />
                    Verificado
                  </span>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nuevo teléfono
              </label>
              <div className="flex items-center gap-2">
                {/* Código de país fijo */}
                <div className="px-4 py-3 bg-gray-100 border-2 border-gray-200 rounded-xl text-lg font-semibold text-gray-700 flex-shrink-0">
                  {countryPrefix}
                </div>
                {/* Input solo para el número local */}
                <input
                  type="tel"
                  value={newPhone}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    // Limitar a 10 dígitos (típico para números locales)
                    if (value.length <= 10) {
                      setNewPhone(value);
                      setError('');
                    }
                  }}
                  placeholder="70123456"
                  className="flex-1 px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none text-lg font-semibold text-gray-900 modal-input"
                  disabled={loading}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                ⚠️ Debes verificar el nuevo número antes de que se aplique el cambio
              </p>
            </div>

            {canChange && !canChange.canChange && user?.whatsapp_verificado && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
                <p className="text-sm text-yellow-800">
                  ⏳ {canChange.reason}
                </p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleCancel}
                className="flex-1 py-3 px-4 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleContinue}
                disabled={loading || !newPhone.trim() || (canChange && !canChange.canChange && user?.whatsapp_verificado)}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                Continuar
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Confirmación Antes de Enviar Código */}
        {step === 'confirm' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                📱 Teléfono actual
              </label>
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-200">
                <Phone size={20} className="text-gray-400" />
                <span className="text-lg font-semibold text-gray-900">
                  {user?.telefono ? formatPhoneDisplay(user.telefono) : 'No configurado'}
                </span>
                <CheckCircle size={16} className="text-green-600 ml-auto" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                ➡️ Nuevo teléfono
              </label>
              <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-xl border border-purple-200">
                <Phone size={20} className="text-purple-600" />
                <span className="text-lg font-semibold text-purple-900">
                  {countryPrefix} {newPhone.replace(/\D/g, '')}
                </span>
              </div>
            </div>

            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
              <p className="text-sm font-semibold text-yellow-900 mb-2">⚠️ IMPORTANTE:</p>
              <ul className="text-xs text-yellow-800 space-y-1 list-disc list-inside">
                <li>Se enviará un código de verificación al nuevo número</li>
                <li>El cambio se aplicará solo después de verificar el código</li>
                <li>No podrás cambiar de nuevo hasta dentro de 30 días</li>
              </ul>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setStep('enter_phone')}
                className="flex-1 py-3 px-4 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
              >
                <ArrowLeft size={18} />
                Atrás
              </button>
              <button
                onClick={handleConfirm}
                disabled={loading}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Enviando...' : 'Sí, Confirmar'}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Verificación del Código */}
        {step === 'verify_code' && (
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">
                Hemos enviado un código de verificación a:
              </p>
              <p className="text-lg font-bold text-gray-900">
                {pendingPhone ? formatPhoneDisplay(pendingPhone) : formatPhoneDisplay(countryPrefix + newPhone.replace(/\D/g, ''))}
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Ingresa el código de 6 dígitos
              </label>
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setVerificationCode(value);
                  setError('');
                }}
                placeholder="000000"
                className="w-full px-4 py-4 bg-white border-2 border-purple-300 rounded-xl focus:border-purple-500 focus:bg-purple-50 focus:outline-none focus:ring-2 focus:ring-purple-200 text-3xl font-bold text-center tracking-widest text-gray-900 placeholder:text-gray-300"
                disabled={loading}
                maxLength={6}
                autoFocus
              />
            </div>

            <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
              {countdown > 0 ? (
                <>
                  <Clock size={16} />
                  <span>Reenviar código en {formatCountdown(countdown)}</span>
                </>
              ) : (
                <button
                  onClick={handleResendCode}
                  disabled={loading}
                  className="text-purple-600 hover:text-purple-700 font-semibold"
                >
                  Reenviar código
                </button>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              {/* NO hay botón Cancelar para evitar bucle de solicitar-cancelar */}
              <button
                onClick={handleVerifyCode}
                disabled={loading || verificationCode.length !== 6}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Verificando...' : 'Verificar'}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Confirmación Exitosa */}
        {step === 'success' && (
          <div className="space-y-4 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle size={32} className="text-green-600" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900 mb-2">
                Teléfono Cambiado Exitosamente
              </p>
              <p className="text-sm text-gray-600 mb-4">
                Tu nuevo teléfono es:
              </p>
              <p className="text-xl font-bold text-purple-600">
                {countryPrefix} {newPhone.replace(/\D/g, '')}
              </p>
            </div>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
              <p className="text-xs text-blue-800">
                ⏳ Podrás cambiar de nuevo en 30 días
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

