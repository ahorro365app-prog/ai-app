"use client";

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { LogIn, Mail, Lock, Phone, Eye, EyeOff, MessageCircle, KeyRound, X } from 'lucide-react';
import { useSupabase } from '@/contexts/SupabaseContext';
import { useModal } from '@/contexts/ModalContext';
import ErrorModal from '@/components/ErrorModal';
import { logger } from '@/lib/logger';

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

export default function SignInPage() {
  const router = useRouter();
  const { signInWithPhone } = useSupabase();
  const { setModalOpen } = useModal();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('BO'); // Bolivia por defecto
  const [loginMethod, setLoginMethod] = useState<'phone' | 'email'>('phone'); // Teléfono por defecto
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberPassword, setRememberPassword] = useState(false);
  const [errorModal, setErrorModal] = useState<{ isOpen: boolean; message: string }>({
    isOpen: false,
    message: ''
  });
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [recoveryPhone, setRecoveryPhone] = useState('');
  const [recoveryCountry, setRecoveryCountry] = useState('BO');
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryStep, setRecoveryStep] = useState<'phone' | 'code' | 'password'>('phone');
  const [isRecoveryCountryDropdownOpen, setIsRecoveryCountryDropdownOpen] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [codeResendTimer, setCodeResendTimer] = useState(0);
  const [canResendCode, setCanResendCode] = useState(true);
  const [lastCodeSentAt, setLastCodeSentAt] = useState<number | null>(null);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [recoveryToken, setRecoveryToken] = useState<string | null>(null);
  const recoveryDropdownRef = useRef<HTMLDivElement>(null);

  // Función para formatear segundos a MM:SS
  const formatTimer = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cargar datos guardados al iniciar
  useEffect(() => {
    // ⚠️ SEGURIDAD: NO guardar contraseñas en localStorage
    // Solo guardar teléfono y país si el usuario quiere "recordar"
    const savedPhone = localStorage.getItem('savedPhone');
    const savedCountry = localStorage.getItem('savedCountry');
    const savedRemember = localStorage.getItem('rememberPhone') === 'true';

    if (savedRemember && savedPhone) {
      setPhone(savedPhone);
      setRememberPassword(true);
      if (savedCountry) {
        setSelectedCountry(savedCountry);
      }
    }
    
    // Limpiar contraseñas antiguas que puedan estar guardadas (migración)
    if (localStorage.getItem('savedPassword')) {
      localStorage.removeItem('savedPassword');
      localStorage.removeItem('rememberPassword');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (loginMethod === 'phone') {
      if (phone && password) {
        const selectedCountryData = countries.find(c => c.code === selectedCountry);
        const fullPhone = `${selectedCountryData?.prefix}${phone}`;
        
            try {
              setIsLoading(true);

              const result = await signInWithPhone(fullPhone, password);

              if (result.success) {
                // ⚠️ SEGURIDAD: NO guardar contraseñas en localStorage
                // Limpiar datos anteriores (incluyendo contraseñas antiguas)
                localStorage.removeItem('savedPhone');
                localStorage.removeItem('savedPassword'); // Limpiar si existe (migración)
                localStorage.removeItem('savedCountry');
                localStorage.removeItem('rememberPassword'); // Limpiar si existe (migración)

                // Guardar solo teléfono y país si se marca "recordar"
                // NUNCA guardar contraseñas por seguridad
                if (rememberPassword) {
                  localStorage.setItem('savedPhone', phone);
                  localStorage.setItem('savedCountry', selectedCountry);
                  localStorage.setItem('rememberPhone', 'true');
                } else {
                  // Si no quiere recordar, limpiar todo
                  localStorage.removeItem('savedPhone');
                  localStorage.removeItem('savedCountry');
                  localStorage.removeItem('rememberPhone');
                }

                router.push('/dashboard');
              } else {
                // Determinar el tipo de error específico
                let errorMessage = result.error || 'Credenciales incorrectas.';
                let errorTitle = 'Error al iniciar sesión';
                
                if (result.error?.includes('conexión') || result.error?.includes('internet')) {
                  errorTitle = 'Problema de conexión';
                  errorMessage = 'No se pudo conectar al servidor. Verifica tu conexión a internet e intenta nuevamente.';
                } else if (result.error?.includes('Credenciales incorrectas')) {
                  errorTitle = 'Credenciales incorrectas';
                  errorMessage = 'El número de teléfono o la contraseña no son correctos. Verifica tus datos e intenta nuevamente.';
                }
                
                setErrorModal({
                  isOpen: true,
                  message: errorMessage
                });
                setModalOpen(true);
              }
        } catch (error) {
          logger.error('Error de autenticación:', error);
          setErrorModal({
            isOpen: true,
            message: 'Error inesperado. Verifica tu conexión e intenta nuevamente.'
          });
          setModalOpen(true);
        } finally {
          setIsLoading(false);
        }
      } else {
        setErrorModal({
          isOpen: true,
          message: 'Por favor completa todos los campos antes de continuar.'
        });
        setModalOpen(true);
      }
    } else {
      setErrorModal({
        isOpen: true,
        message: 'Login con email no implementado aún. Usa el teléfono.'
      });
      setModalOpen(true);
    }
  };

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsCountryDropdownOpen(false);
      }
      if (recoveryDropdownRef.current && !recoveryDropdownRef.current.contains(event.target as Node)) {
        setIsRecoveryCountryDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Timer para reenvío de código (persistente)
  useEffect(() => {
    if (codeResendTimer > 0) {
      const timer = setTimeout(() => {
        setCodeResendTimer(codeResendTimer - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (codeResendTimer === 0 && lastCodeSentAt !== null && codeSent) {
      // Cuando el timer llega a 0, permitir reenvío
      setCanResendCode(true);
      // Si estamos en el paso 1, permitir enviar nuevo código (el anterior expiró)
      if (recoveryStep === 'phone') {
        setCodeSent(false);
        setLastCodeSentAt(null);
      }
    }
  }, [codeResendTimer, lastCodeSentAt, codeSent, recoveryStep]);

  // Verificar si puede reenviar código al volver al paso 1
  useEffect(() => {
    if (recoveryStep === 'phone' && lastCodeSentAt !== null) {
      const elapsed = Math.floor((Date.now() - lastCodeSentAt) / 1000);
      const CODE_EXPIRATION_TIME = 600; // 10 minutos = 600 segundos
      const remaining = CODE_EXPIRATION_TIME - elapsed;
      
      if (remaining > 0) {
        setCodeResendTimer(remaining);
        setCanResendCode(false);
      } else {
        setCodeResendTimer(0);
        setCanResendCode(true);
      }
    }
  }, [recoveryStep, lastCodeSentAt]);

  // Función para enviar código de verificación (FASE 2 - Generación y almacenamiento)
  const handleSendVerificationCode = async () => {
    if (!recoveryPhone) {
      setErrorModal({
        isOpen: true,
        message: 'Por favor ingresa tu número de teléfono.'
      });
      setModalOpen(true);
      return;
    }

    // Si ya se envió un código, simplemente volver al paso 2 sin generar uno nuevo
    if (codeSent && lastCodeSentAt !== null) {
      setRecoveryStep('code');
      return;
    }

    // Prevenir envío múltiple de códigos (solo si no hay código enviado)
    if (!canResendCode && codeResendTimer > 0) {
      setErrorModal({
        isOpen: true,
        message: `Debes esperar ${codeResendTimer} segundos antes de solicitar un nuevo código.`
      });
      setModalOpen(true);
      return;
    }

    setIsRecovering(true);
    
    try {
      // Construir número completo con código de país
      const selectedCountryData = countries.find(c => c.code === recoveryCountry);
      const fullPhone = `${selectedCountryData?.prefix}${recoveryPhone}`;

      // FASE 2: Llamar al endpoint para generar y guardar el código
      const response = await fetch('/api/password-recovery/send-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: fullPhone,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        // Si el código está guardado pero WhatsApp falló, permitir continuar
        if (data.codeSaved && !data.isTokenExpired) {
          // El código está guardado, el usuario puede continuar aunque WhatsApp falló
          setCodeSent(true);
          setRecoveryStep('code');
          setCodeResendTimer(600); // 10 minutos = 600 segundos
          setCanResendCode(false);
          setLastCodeSentAt(Date.now());
          setFailedAttempts(0); // Resetear intentos fallidos al enviar nuevo código
          
          // Mostrar advertencia pero permitir continuar
          setErrorModal({
            isOpen: true,
            message: '⚠️ El código fue generado pero no se pudo enviar por WhatsApp. Puedes intentar ingresar el código si lo recibiste, o intentar de nuevo más tarde.'
          });
          setModalOpen(true);
          setIsRecovering(false);
          return;
        }
        
        // Error crítico o token expirado
        const errorMessage = data.message || 'Error al generar el código de recuperación';
        setErrorModal({
          isOpen: true,
          message: errorMessage
        });
        setModalOpen(true);
        setIsRecovering(false);
        return;
      }

      // Código generado y enviado exitosamente
      setCodeSent(true);
      setRecoveryStep('code');
      setCodeResendTimer(600); // 10 minutos = 600 segundos
      setCanResendCode(false);
      setLastCodeSentAt(Date.now());
      setFailedAttempts(0); // Resetear intentos fallidos al enviar nuevo código
      
      logger.debug('✅ Código de recuperación generado y enviado:', {
        whatsappSent: data.whatsappSent,
        expiresIn: data.expiresIn
      });

    } catch (error) {
      logger.error('Error generando código de recuperación:', error);
      setErrorModal({
        isOpen: true,
        message: 'Error de conexión. Verifica tu internet e intenta nuevamente.'
      });
      setModalOpen(true);
    } finally {
      setIsRecovering(false);
    }
  };

  // Límite de intentos para verificación de código
  const MAX_ATTEMPTS = 3;

  // Función para validar código (FASE 4 - Validación real)
  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setErrorModal({
        isOpen: true,
        message: 'Por favor ingresa el código de 6 dígitos.'
      });
      setModalOpen(true);
      return;
    }

    // Verificar límite de intentos
    if (failedAttempts >= MAX_ATTEMPTS) {
      setErrorModal({
        isOpen: true,
        message: `Has excedido el límite de ${MAX_ATTEMPTS} intentos. El código ha sido invalidado. Solicita un nuevo código.`
      });
      setModalOpen(true);
      // Invalidar código y resetear
      setCodeSent(false);
      setCodeResendTimer(0);
      setLastCodeSentAt(null);
      setFailedAttempts(0);
      setRecoveryStep('phone');
      return;
    }

    setIsRecovering(true);

    try {
      const selectedCountryData = countries.find(c => c.code === recoveryCountry);
      const fullPhone = `${selectedCountryData?.prefix}${recoveryPhone}`;

      const response = await fetch('/api/password-recovery/verify-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: fullPhone,
          code: verificationCode,
        }),
      });

      const data = await response.json();

      if (data.success && data.verified) {
        // Código válido - avanzar al paso de nueva contraseña
        setRecoveryToken(data.recoveryToken);
        setFailedAttempts(0); // Resetear intentos fallidos
        setRecoveryStep('password');
        logger.info('✅ Código de recuperación verificado exitosamente');
      } else {
        // Código inválido
        const newFailedAttempts = failedAttempts + 1;
        setFailedAttempts(newFailedAttempts);
        
        const remainingAttempts = MAX_ATTEMPTS - newFailedAttempts;
        const errorMessage = remainingAttempts > 0
          ? `Código incorrecto. Te quedan ${remainingAttempts} intento${remainingAttempts !== 1 ? 's' : ''}.`
          : `Has excedido el límite de ${MAX_ATTEMPTS} intentos. El código ha sido invalidado. Solicita un nuevo código.`;

        setErrorModal({
          isOpen: true,
          message: errorMessage
        });
        setModalOpen(true);

        // Si se excedió el límite, invalidar código
        if (remainingAttempts === 0) {
          setCodeSent(false);
          setCodeResendTimer(0);
          setLastCodeSentAt(null);
          setRecoveryStep('phone');
        }

        // Limpiar campo de código para nuevo intento
        setVerificationCode('');
      }
    } catch (error: any) {
      logger.error('❌ Error verificando código de recuperación:', error);
      setErrorModal({
        isOpen: true,
        message: 'Error al verificar el código. Por favor intenta nuevamente.'
      });
      setModalOpen(true);
    } finally {
      setIsRecovering(false);
    }
  };

  // Función para cambiar contraseña (FASE 5 - Implementación real)
  const handleChangePassword = async () => {
    if (!newPassword || !confirmNewPassword) {
      setErrorModal({
        isOpen: true,
        message: 'Por favor completa todos los campos.'
      });
      setModalOpen(true);
      return;
    }

    if (newPassword.length < 6) {
      setErrorModal({
        isOpen: true,
        message: 'La contraseña debe tener al menos 6 caracteres.'
      });
      setModalOpen(true);
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setErrorModal({
        isOpen: true,
        message: 'Las contraseñas no coinciden.'
      });
      setModalOpen(true);
      return;
    }

    // Verificar que tenemos el recoveryToken (debe existir si pasamos por Fase 4)
    if (!recoveryToken) {
      setErrorModal({
        isOpen: true,
        message: 'Error: No se encontró el token de recuperación. Por favor, inicia el proceso nuevamente.'
      });
      setModalOpen(true);
      return;
    }

    setIsRecovering(true);

    try {
      const response = await fetch('/api/password-recovery/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recoveryToken,
          newPassword,
          confirmPassword: confirmNewPassword,
        }),
      });

      const data = await response.json();

      if (data.success && data.passwordChanged) {
        // Contraseña actualizada exitosamente
        setShowForgotPasswordModal(false);
        setModalOpen(false);
        // Resetear todo solo cuando se completa exitosamente
        resetRecoveryModal();
        setErrorModal({
          isOpen: true,
          message: '✅ Contraseña actualizada exitosamente. Ya puedes iniciar sesión con tu nueva contraseña.'
        });
        setModalOpen(true);
        logger.info('✅ Contraseña recuperada exitosamente');
      } else {
        // Error al cambiar contraseña
        const errorMessage = data.message || 'Error al actualizar la contraseña. Por favor intenta nuevamente.';
        setErrorModal({
          isOpen: true,
          message: errorMessage
        });
        setModalOpen(true);
      }
    } catch (error: any) {
      logger.error('❌ Error cambiando contraseña:', error);
      setErrorModal({
        isOpen: true,
        message: 'Error de conexión. Verifica tu internet e intenta nuevamente.'
      });
      setModalOpen(true);
    } finally {
      setIsRecovering(false);
    }
  };

  // Función para reenviar código
  const handleResendCode = () => {
    if (!canResendCode || codeResendTimer > 0) {
      setErrorModal({
        isOpen: true,
        message: `Debes esperar ${formatTimer(codeResendTimer)} antes de reenviar el código.`
      });
      setModalOpen(true);
      return;
    }
    
    // Limpiar código anterior e invalidarlo
    setVerificationCode('');
    setCodeSent(false);
    handleSendVerificationCode();
  };

  // Función centralizada para resetear el estado del modal de recuperación
  const resetRecoveryModal = () => {
    setRecoveryPhone('');
    setVerificationCode('');
    setNewPassword('');
    setConfirmNewPassword('');
    setRecoveryStep('phone');
    setCodeSent(false);
    setCodeResendTimer(0);
    setCanResendCode(true);
    setLastCodeSentAt(null);
    setFailedAttempts(0);
    setRecoveryToken(null);
    setIsRecovering(false);
  };

  // Manejar apertura del modal - mantener estado si hay código activo
  useEffect(() => {
    if (showForgotPasswordModal) {
      // Verificar si hay un código activo usando el estado actual
      if (lastCodeSentAt !== null) {
        const elapsed = Math.floor((Date.now() - lastCodeSentAt) / 1000);
        const CODE_EXPIRATION_TIME = 600; // 10 minutos = 600 segundos
        
        if (elapsed < CODE_EXPIRATION_TIME && codeSent) {
          // Código aún válido, mantener estado y redirigir al paso 2
          const remaining = CODE_EXPIRATION_TIME - elapsed;
          setCodeResendTimer(remaining);
          setRecoveryStep('code');
          // NO resetear - mantener el estado
        } else {
          // Código expirado o no hay código, resetear todo
          resetRecoveryModal();
        }
      } else {
        // No hay código activo, resetear normalmente
        resetRecoveryModal();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showForgotPasswordModal]);

  // Cerrar modal con ESC
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showForgotPasswordModal) {
        setShowForgotPasswordModal(false);
        setModalOpen(false);
        // NO resetear aquí - mantener el estado del código si está activo
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showForgotPasswordModal]);

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 overflow-hidden" style={{ background: 'linear-gradient(to bottom, #1f003b, #5f0064)' }}>
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="w-32 h-32 mx-auto mb-1 flex items-center justify-center">
            <Image
              src="/logo-login.png"
              alt="Ahorro365 Logo"
              width={128}
              height={128}
              className="object-contain drop-shadow-2xl"
              priority
              onError={(e) => {
                // Fallback a icono si el logo no se encuentra
                logger.warn('Logo de login no encontrado, usando icono por defecto');
                const target = e.target as HTMLImageElement;
                if (target) {
                  target.style.display = 'none';
                  const fallback = target.nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = 'flex';
                }
              }}
            />
            <div className="w-20 h-20 bg-white rounded-full hidden items-center justify-center shadow-2xl">
              <LogIn size={40} className="text-blue-600" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Ahorro365</h1>
          <p className="text-blue-100 text-lg">Gestiona tus finanzas con IA</p>
        </div>

        {/* Formulario */}
        <div className="bg-white rounded-3xl p-8 shadow-2xl">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Iniciar Sesión</h2>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Teléfono */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Teléfono
              </label>
              <div className="flex items-center gap-2">
                {/* Selector de país personalizado */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
                    className="px-2 py-3 rounded-xl bg-gray-50 border-2 border-gray-200 hover:border-blue-500 transition-colors text-gray-900 focus:outline-none w-20 text-sm cursor-pointer flex items-center justify-between"
                    title={countries.find(c => c.code === selectedCountry)?.name}
                  >
                    <span>{countries.find(c => c.code === selectedCountry)?.prefix}</span>
                    <svg className={`w-3 h-3 text-gray-400 transition-transform ${isCountryDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {/* Dropdown personalizado */}
                  {isCountryDropdownOpen && (
                    <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-xl border-2 border-gray-200 shadow-lg z-10 max-h-48 overflow-y-auto">
                      {countries.map(country => (
                        <button
                          key={country.code}
                          type="button"
                          onClick={() => {
                            setSelectedCountry(country.code);
                            setIsCountryDropdownOpen(false);
                          }}
                          className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors ${
                            selectedCountry === country.code ? 'bg-blue-50 text-blue-600' : 'text-gray-900'
                          }`}
                        >
                          {country.name} {country.prefix}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {/* Campo de teléfono */}
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50 border-2 border-gray-200 focus-within:border-blue-500 transition-colors" style={{ maxWidth: '210px' }}>
                  <Phone size={20} className="text-gray-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))} // Solo números
                    placeholder="Número de teléfono"
                    className="flex-1 bg-transparent text-gray-900 focus:outline-none"
                    autoFocus
                    suppressHydrationWarning
                  />
                </div>
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Contraseña
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPasswordModal(true);
                    setModalOpen(true);
                  }}
                  className="text-xs text-blue-600 hover:underline font-medium"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50 border-2 border-gray-200 focus-within:border-blue-500 transition-colors">
                <Lock size={20} className="text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="flex-1 bg-transparent text-gray-900 focus:outline-none"
                  suppressHydrationWarning
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

          {/* Recordar contraseña */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="rememberPassword"
              checked={rememberPassword}
              onChange={(e) => setRememberPassword(e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
              suppressHydrationWarning
            />
            <label htmlFor="rememberPassword" className="text-sm text-gray-600 cursor-pointer select-none">
              Recordar teléfono
            </label>
          </div>

            {/* Botón Login */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-base hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Iniciando...
                </>
              ) : (
                'Ingresar'
              )}
            </button>

          </form>

          {/* Link a registro */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              ¿No tienes cuenta?{' '}
              <button
                onClick={() => router.push('/sign-up')}
                className="text-blue-600 font-semibold hover:underline"
              >
                Regístrate
              </button>
            </p>
          </div>

          {/* Contacto WhatsApp */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <button
              onClick={() => {
                const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_SUPPORT || '+59161600190';
                const message = encodeURIComponent('Hola, necesito ayuda con el inicio de sesión');
                window.open(`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${message}`, '_blank');
              }}
              className="w-full py-2 px-3 rounded-lg bg-green-50 hover:bg-green-100 text-green-700 text-sm font-medium hover:opacity-80 transition-all flex items-center justify-center gap-1.5 border border-green-200"
            >
              <MessageCircle size={16} />
              <span>Contactar por WhatsApp</span>
            </button>
          </div>
        </div>

      </div>

      {/* Modal de Error */}
      <ErrorModal
        isOpen={errorModal.isOpen}
        onClose={() => {
          setErrorModal({ isOpen: false, message: '' });
          setModalOpen(false);
        }}
        title={
          errorModal.message.includes('✅') ? "Éxito" :
          errorModal.message.includes('campos') ? "Campos requeridos" :
          errorModal.message.includes('conexión') || errorModal.message.includes('internet') ? "Problema de conexión" :
          errorModal.message.includes('Credenciales incorrectas') ? "Credenciales incorrectas" :
          errorModal.message.includes('inesperado') ? "Error inesperado" :
          "Error al iniciar sesión"
        }
        message={errorModal.message}
        type={errorModal.message.includes('✅') ? "success" : "error"}
      />

      {/* Modal de Recuperar Contraseña - FASE 1: Estructura UI */}
      {showForgotPasswordModal && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
          onClick={(e) => {
            // Cerrar al hacer clic fuera del modal
            if (e.target === e.currentTarget) {
              setShowForgotPasswordModal(false);
              setModalOpen(false);
              // NO resetear aquí - mantener el estado del código si está activo
            }
          }}
        >
          <div 
            className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <KeyRound size={24} className="text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Recuperar Contraseña</h3>
                  <p className="text-xs text-gray-500">
                    {recoveryStep === 'phone' && 'Paso 1: Ingresa tu teléfono'}
                    {recoveryStep === 'code' && 'Paso 2: Ingresa el código'}
                    {recoveryStep === 'password' && 'Paso 3: Nueva contraseña'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowForgotPasswordModal(false);
                  setModalOpen(false);
                  // NO resetear aquí - mantener el estado del código si está activo
                }}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-xl hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            {/* Indicador de pasos */}
            <div className="flex items-center justify-center gap-2 mb-6">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
                recoveryStep === 'phone' ? 'bg-blue-600 text-white' : 
                recoveryStep === 'code' || recoveryStep === 'password' ? 'bg-green-500 text-white' : 
                'bg-gray-200 text-gray-500'
              }`}>
                1
              </div>
              <div className={`h-1 w-12 ${
                recoveryStep === 'code' || recoveryStep === 'password' ? 'bg-green-500' : 'bg-gray-200'
              }`}></div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
                recoveryStep === 'code' ? 'bg-blue-600 text-white' : 
                recoveryStep === 'password' ? 'bg-green-500 text-white' : 
                'bg-gray-200 text-gray-500'
              }`}>
                2
              </div>
              <div className={`h-1 w-12 ${
                recoveryStep === 'password' ? 'bg-green-500' : 'bg-gray-200'
              }`}></div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
                recoveryStep === 'password' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                3
              </div>
            </div>

            {/* Paso 1: Ingresar teléfono */}
            {recoveryStep === 'phone' && (
              <>
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Teléfono
                  </label>
                  <div className="flex items-center gap-2">
                    {/* Selector de país */}
                    <div className="relative" ref={recoveryDropdownRef}>
                      <button
                        type="button"
                        onClick={() => {
                          // Bloquear si hay código activo
                          if (codeSent && codeResendTimer > 0) return;
                          setIsRecoveryCountryDropdownOpen(!isRecoveryCountryDropdownOpen);
                        }}
                        disabled={codeSent && codeResendTimer > 0}
                        className={`px-2 py-3 rounded-xl border-2 transition-colors text-gray-900 focus:outline-none w-20 text-sm flex items-center justify-between ${
                          codeSent && codeResendTimer > 0
                            ? 'bg-gray-100 border-gray-300 cursor-not-allowed opacity-60'
                            : 'bg-gray-50 border-gray-200 hover:border-blue-500 cursor-pointer'
                        }`}
                        title={countries.find(c => c.code === recoveryCountry)?.name}
                      >
                        <span>{countries.find(c => c.code === recoveryCountry)?.prefix}</span>
                        <svg className={`w-3 h-3 text-gray-400 transition-transform ${isRecoveryCountryDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      
                      {isRecoveryCountryDropdownOpen && !(codeSent && codeResendTimer > 0) && (
                        <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-xl border-2 border-gray-200 shadow-lg z-10 max-h-48 overflow-y-auto">
                          {countries.map(country => (
                            <button
                              key={country.code}
                              type="button"
                              onClick={() => {
                                setRecoveryCountry(country.code);
                                setIsRecoveryCountryDropdownOpen(false);
                              }}
                              className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors ${
                                recoveryCountry === country.code ? 'bg-blue-50 text-blue-600' : 'text-gray-900'
                              }`}
                            >
                              {country.name} {country.prefix}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    {/* Campo de teléfono */}
                    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-colors flex-1 ${
                      codeSent && codeResendTimer > 0
                        ? 'bg-gray-100 border-gray-300'
                        : 'bg-gray-50 border-gray-200 focus-within:border-blue-500'
                    }`}>
                      <Phone size={20} className={codeSent && codeResendTimer > 0 ? "text-gray-300" : "text-gray-400"} />
                      <input
                        type="tel"
                        value={recoveryPhone}
                        onChange={(e) => {
                          // Bloquear edición si hay código activo
                          if (codeSent && codeResendTimer > 0) return;
                          setRecoveryPhone(e.target.value.replace(/\D/g, ''));
                        }}
                        placeholder="Número de teléfono"
                        disabled={codeSent && codeResendTimer > 0}
                        className={`flex-1 bg-transparent text-gray-900 focus:outline-none ${
                          codeSent && codeResendTimer > 0 ? 'cursor-not-allowed opacity-60' : ''
                        }`}
                        autoFocus={!codeSent || codeResendTimer === 0}
                      />
                      {codeSent && codeResendTimer > 0 && (
                        <Lock size={16} className="text-gray-400" title="Campo bloqueado - código activo" />
                      )}
                    </div>
                  </div>
                  {codeSent && codeResendTimer > 0 ? (
                    <div className="mt-2">
                      <p className="text-xs text-amber-600 font-medium">
                        🔒 El número está bloqueado porque ya se envió un código. Espera {formatTimer(codeResendTimer)} o completa el proceso.
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 mt-2">
                      Te enviaremos un código de verificación por WhatsApp
                    </p>
                  )}
                </div>

                {/* Botón Enviar Código */}
                  <button
                    onClick={handleSendVerificationCode}
                    disabled={isRecovering || !recoveryPhone}
                    className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isRecovering ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Enviando...
                      </>
                    ) : codeSent && codeResendTimer > 0 ? (
                      'Continuar con Código'
                    ) : (
                      'Enviar Código'
                    )}
                  </button>
                  {codeSent && codeResendTimer > 0 && (
                    <p className="text-xs text-center text-gray-500 mt-2">
                      Código enviado. Puedes reenviar en {formatTimer(codeResendTimer)}
                    </p>
                  )}
                  {codeSent && codeResendTimer === 0 && (
                    <p className="text-xs text-center text-gray-500 mt-2">
                      El código anterior expiró. Puedes solicitar uno nuevo.
                    </p>
                  )}
              </>
            )}

            {/* Paso 2: Ingresar código */}
            {recoveryStep === 'code' && (
              <>
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Código de verificación
                  </label>
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50 border-2 border-gray-200 focus-within:border-blue-500 transition-colors">
                    <input
                      type="text"
                      value={verificationCode}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                        setVerificationCode(value);
                      }}
                      placeholder="000000"
                      className="flex-1 bg-transparent text-gray-900 focus:outline-none text-center text-2xl font-mono tracking-widest"
                      autoFocus
                      maxLength={6}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Ingresa el código de 6 dígitos que recibiste por WhatsApp
                  </p>
                  {failedAttempts > 0 && (
                    <div className="mt-2 p-2 rounded-lg bg-amber-50 border border-amber-200">
                      <p className="text-xs text-amber-700 font-medium">
                        ⚠️ Intentos fallidos: {failedAttempts}/3
                        {failedAttempts < 3 && (
                          <span className="ml-1">({3 - failedAttempts} intento{3 - failedAttempts !== 1 ? 's' : ''} restante{3 - failedAttempts !== 1 ? 's' : ''})</span>
                        )}
                      </p>
                    </div>
                  )}
                  {codeSent && (
                    <div className="mt-3 flex items-center justify-between">
                      <p className="text-xs text-gray-600">
                        ¿No recibiste el código?
                      </p>
                      <button
                        onClick={handleResendCode}
                        disabled={codeResendTimer > 0}
                        className="text-xs text-blue-600 hover:underline font-medium disabled:text-gray-400 disabled:cursor-not-allowed"
                      >
                        {codeResendTimer > 0 ? `Reenviar en ${formatTimer(codeResendTimer)}` : 'Reenviar código'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Botones */}
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setRecoveryStep('phone');
                      // NO limpiar codeSent ni resetear timer - mantener el estado del código enviado
                      // Solo limpiar el código ingresado para que pueda intentar de nuevo
                      setVerificationCode('');
                    }}
                    disabled={isRecovering}
                    className="flex-1 py-3.5 px-4 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-all disabled:opacity-50"
                  >
                    Volver
                  </button>
                  <button
                    onClick={handleVerifyCode}
                    disabled={isRecovering || verificationCode.length !== 6}
                    className="flex-1 py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isRecovering ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Verificando...
                      </>
                    ) : (
                      'Verificar Código'
                    )}
                  </button>
                </div>
              </>
            )}

            {/* Paso 3: Nueva contraseña */}
            {recoveryStep === 'password' && (
              <>
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Nueva contraseña
                    </label>
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50 border-2 border-gray-200 focus-within:border-blue-500 transition-colors">
                      <Lock size={20} className="text-gray-400" />
                      <input
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                        className="flex-1 bg-transparent text-gray-900 focus:outline-none"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Confirmar nueva contraseña
                    </label>
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50 border-2 border-gray-200 focus-within:border-blue-500 transition-colors">
                      <Lock size={20} className="text-gray-400" />
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        placeholder="Confirma tu contraseña"
                        className="flex-1 bg-transparent text-gray-900 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Botones */}
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setRecoveryStep('code');
                      setNewPassword('');
                      setConfirmNewPassword('');
                    }}
                    disabled={isRecovering}
                    className="flex-1 py-3.5 px-4 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-all disabled:opacity-50"
                  >
                    Volver
                  </button>
                  <button
                    onClick={handleChangePassword}
                    disabled={isRecovering || !newPassword || !confirmNewPassword}
                    className="flex-1 py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isRecovering ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Actualizando...
                      </>
                    ) : (
                      'Actualizar Contraseña'
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
