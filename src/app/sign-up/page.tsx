"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, User, Phone, Eye, EyeOff, Gift } from 'lucide-react';
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

export default function SignUpPage() {
  const router = useRouter();
  const { createUser } = useSupabase();
  const { setModalOpen } = useModal();
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [referralCode, setReferralCode] = useState(''); // Fase 2: Código de referido opcional
  const [selectedCountry, setSelectedCountry] = useState('BO'); // Bolivia por defecto
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorModal, setErrorModal] = useState<{ isOpen: boolean; message: string }>({
    isOpen: false,
    message: ''
  });
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Estados para validación de código de referido
  type ValidationState = 
    | { status: 'idle' }
    | { status: 'validating' }
    | { status: 'valid'; referidorNombre: string }
    | { status: 'invalid'; message: string }
    | { status: 'error'; message: string };

  const [validationState, setValidationState] = useState<ValidationState>({ status: 'idle' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validar que todos los campos estén completos
    if (name && password && phone) {
      const selectedCountryData = countries.find(c => c.code === selectedCountry);
      const fullPhone = `${selectedCountryData?.prefix}${phone}`;
      
            try {
              setIsLoading(true);

              const result = await createUser({
                nombre: name,
                telefono: fullPhone,
                contrasena: password,
                moneda: selectedCountry === 'BO' ? 'BOB' : 'USD', // Por defecto BOB para Bolivia
                codigoReferidoUsado: referralCode.trim() || undefined // Fase 2: Pasar código si existe
              });

              if (result.success) {
                setErrorModal({
            isOpen: true,
            message: '¡Cuenta creada exitosamente! Ahora puedes iniciar sesión.',
            type: 'success'
          });
          setModalOpen(true);
          // Redirigir después de 2 segundos
          setTimeout(() => {
            router.push('/sign-in');
          }, 2000);
        } else {
          setErrorModal({
            isOpen: true,
            message: result.error || 'Error desconocido al crear la cuenta.'
          });
          setModalOpen(true);
        }
      } catch (error) {
        logger.error('Error de registro:', error);
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
  };

  const getCurrentCountry = () => {
    return countries.find(c => c.code === selectedCountry);
  };

  // Función para validar código de referido
  const validateReferralCode = useCallback(async (code: string) => {
    if (!code || code.length !== 8) {
      setValidationState({ status: 'idle' });
      return;
    }

    setValidationState({ status: 'validating' });

    try {
      const response = await fetch('/api/referrals/validate-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: code.toUpperCase() }),
      });

      const data = await response.json();

      if (data.valid && data.referidorNombre) {
        setValidationState({
          status: 'valid',
          referidorNombre: data.referidorNombre,
        });
      } else {
        setValidationState({
          status: 'invalid',
          message: data.message || 'Código no encontrado',
        });
      }
    } catch (error: any) {
      logger.error('Error validando código:', error);
      setValidationState({
        status: 'error',
        message: 'Error al validar código',
      });
    }
  }, []);

  // Debounce: validar después de 1 segundo sin escribir
  useEffect(() => {
    if (!referralCode || referralCode.length !== 8) {
      setValidationState({ status: 'idle' });
      return;
    }

    const timeoutId = setTimeout(() => {
      validateReferralCode(referralCode);
    }, 1000); // 1 segundo

    return () => clearTimeout(timeoutId);
  }, [referralCode, validateReferralCode]);

  // Handler para onBlur (validar cuando sale del campo)
  const handleReferralCodeBlur = () => {
    if (referralCode && referralCode.length === 8) {
      validateReferralCode(referralCode);
    } else if (!referralCode) {
      setValidationState({ status: 'idle' });
    }
  };

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsCountryDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-600 via-pink-600 to-red-600 flex items-center justify-center p-4 overflow-hidden">
      <div className="w-full max-w-md">
        {/* Formulario */}
        <div className="bg-white rounded-3xl p-8 shadow-2xl">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Crear Cuenta</h2>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Nombre */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nombre
              </label>
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50 border-2 border-gray-200 focus-within:border-purple-500 transition-colors">
                <User size={20} className="text-gray-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tu nombre"
                  className="flex-1 bg-transparent text-gray-900 focus:outline-none"
                  autoFocus
                  suppressHydrationWarning
                />
              </div>
            </div>


            {/* Teléfono */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Teléfono (Método principal de acceso)
              </label>
              <div className="flex items-center gap-2">
                {/* Selector de país personalizado */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
                    className="px-2 py-3 rounded-xl bg-gray-50 border-2 border-gray-200 hover:border-purple-500 transition-colors text-gray-900 focus:outline-none w-20 text-sm cursor-pointer flex items-center justify-between"
                    title={getCurrentCountry()?.name}
                  >
                    <span>{getCurrentCountry()?.prefix}</span>
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
                            selectedCountry === country.code ? 'bg-purple-50 text-purple-600' : 'text-gray-900'
                          }`}
                        >
                          {country.name} {country.prefix}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {/* Campo de teléfono */}
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50 border-2 border-gray-200 focus-within:border-purple-500 transition-colors" style={{ maxWidth: '210px' }}>
                  <Phone size={20} className="text-gray-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))} // Solo números
                    placeholder="Número de teléfono"
                    className="flex-1 bg-transparent text-gray-900 focus:outline-none"
                    suppressHydrationWarning
                  />
                </div>
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Contraseña
              </label>
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50 border-2 border-gray-200 focus-within:border-purple-500 transition-colors">
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

            {/* Código de Referido (Opcional) */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Código de referido <span className="text-gray-400 font-normal text-xs">(opcional)</span>
              </label>
              <div className={`flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50 border-2 transition-colors ${
                validationState.status === 'validating' 
                  ? 'border-blue-400 focus-within:border-blue-500' 
                  : validationState.status === 'valid'
                  ? 'border-green-500 focus-within:border-green-600'
                  : validationState.status === 'invalid' || validationState.status === 'error'
                  ? 'border-yellow-400 focus-within:border-yellow-500'
                  : 'border-gray-200 focus-within:border-purple-500'
              }`}>
                <Gift size={20} className={
                  validationState.status === 'valid' 
                    ? 'text-green-600' 
                    : validationState.status === 'invalid' || validationState.status === 'error'
                    ? 'text-yellow-600'
                    : 'text-gray-400'
                } />
                <input
                  type="text"
                  value={referralCode}
                  onChange={(e) => {
                    const newValue = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                    setReferralCode(newValue);
                    // Limpiar validación cuando empieza a escribir
                    if (newValue.length < 8) {
                      setValidationState({ status: 'idle' });
                    }
                  }}
                  onBlur={handleReferralCodeBlur}
                  placeholder="ABC12345"
                  maxLength={8}
                  className="flex-1 bg-transparent text-gray-900 focus:outline-none font-mono text-sm"
                  suppressHydrationWarning
                />
                {validationState.status === 'validating' && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                )}
                {validationState.status === 'valid' && (
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {(validationState.status === 'invalid' || validationState.status === 'error') && (
                  <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                )}
              </div>
              
              {/* Mensaje de feedback */}
              {validationState.status !== 'idle' && (
                <div className={`mt-1 text-sm flex items-center gap-1 ${
                  validationState.status === 'validating'
                    ? 'text-blue-600'
                    : validationState.status === 'valid'
                    ? 'text-green-600'
                    : 'text-yellow-600'
                }`}>
                  {validationState.status === 'validating' && (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                      <span>Validando código...</span>
                    </>
                  )}
                  {validationState.status === 'valid' && (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Código válido - Referido por: {validationState.referidorNombre}</span>
                    </>
                  )}
                  {validationState.status === 'invalid' && (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <span>Código no encontrado. Puedes intentar de nuevo o continuar sin código</span>
                    </>
                  )}
                  {validationState.status === 'error' && (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Error al validar. Puedes continuar sin código</span>
                    </>
                  )}
                </div>
              )}
              
              {validationState.status === 'idle' && referralCode.length > 0 && referralCode.length < 8 && (
                <p className="text-xs text-gray-500 mt-1">
                  Si tienes un código de referido, ingrésalo aquí para obtener beneficios
                </p>
              )}
              {validationState.status === 'idle' && referralCode.length === 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  Si tienes un código de referido, ingrésalo aquí para obtener beneficios
                </p>
              )}
            </div>

            {/* Botón Registro */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-base hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Creando...
                </>
              ) : (
                'Crear Cuenta'
              )}
            </button>

          </form>

          {/* Link a login */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              ¿Ya tienes cuenta?{' '}
              <button
                onClick={() => router.push('/sign-in')}
                className="text-purple-600 font-semibold hover:underline"
              >
                Inicia sesión
              </button>
            </p>
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
          title={errorModal.message.includes('campos') ? "Campos requeridos" : errorModal.message.includes('exitosa') ? "¡Cuenta creada!" : "Error al crear cuenta"}
          message={errorModal.message}
          type={errorModal.message.includes('exitosa') ? 'success' : 'error'}
        />
    </div>
  );
}
