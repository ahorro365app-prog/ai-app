"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { LogIn, Mail, Lock, Phone, Eye, EyeOff } from 'lucide-react';
import { useSupabase } from '@/contexts/SupabaseContext';
import ErrorModal from '@/components/ErrorModal';

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
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cargar datos guardados al iniciar
  useEffect(() => {
    const savedPhone = localStorage.getItem('savedPhone');
    const savedPassword = localStorage.getItem('savedPassword');
    const savedCountry = localStorage.getItem('savedCountry');
    const savedRemember = localStorage.getItem('rememberPassword') === 'true';

          if (savedRemember && savedPhone && savedPassword) {
            setPhone(savedPhone);
            setPassword(savedPassword);
            setRememberPassword(true);
            if (savedCountry) {
              setSelectedCountry(savedCountry);
            }
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
                // Limpiar datos anteriores antes de guardar nuevos
                localStorage.removeItem('savedPhone');
                localStorage.removeItem('savedPassword');
                localStorage.removeItem('savedCountry');
                localStorage.removeItem('rememberPassword');

                // Guardar datos solo si se marca "recordar contraseña"
                if (rememberPassword) {
                  localStorage.setItem('savedPhone', phone);
                  localStorage.setItem('savedPassword', password);
                  localStorage.setItem('savedCountry', selectedCountry);
                  localStorage.setItem('rememberPassword', 'true');
                }

                router.push('/dashboard');
              } else {
            setErrorModal({
              isOpen: true,
              message: result.error || 'Credenciales incorrectas.'
            });
          }
        } catch (error) {
          console.error('Error de autenticación:', error);
          setErrorModal({
            isOpen: true,
            message: 'Error inesperado. Verifica tu conexión e intenta nuevamente.'
          });
        } finally {
          setIsLoading(false);
        }
      } else {
        setErrorModal({
          isOpen: true,
          message: 'Por favor completa todos los campos antes de continuar.'
        });
      }
    } else {
      setErrorModal({
        isOpen: true,
        message: 'Login con email no implementado aún. Usa el teléfono.'
      });
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
    <div className="fixed inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 flex items-center justify-center p-4 overflow-hidden">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-white rounded-full mx-auto mb-4 flex items-center justify-center shadow-2xl">
            <LogIn size={40} className="text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Ahorro365</h1>
          <p className="text-blue-100">Gestiona tus finanzas con IA</p>
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
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50 border-2 border-gray-200 focus-within:border-blue-500 transition-colors flex-1">
                  <Phone size={20} className="text-gray-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))} // Solo números
                    placeholder="Número de teléfono"
                    className="flex-1 bg-transparent text-gray-900 focus:outline-none"
                    autoFocus
                  />
                </div>
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Contraseña
              </label>
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50 border-2 border-gray-200 focus-within:border-blue-500 transition-colors">
                <Lock size={20} className="text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="flex-1 bg-transparent text-gray-900 focus:outline-none"
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
            />
            <label htmlFor="rememberPassword" className="text-sm text-gray-600 cursor-pointer select-none">
              Recordar contraseña
            </label>
          </div>

            {/* Botón Login */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-lg hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
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
        </div>

      </div>

      {/* Modal de Error */}
      <ErrorModal
        isOpen={errorModal.isOpen}
        onClose={() => setErrorModal({ isOpen: false, message: '' })}
        title={errorModal.message.includes('campos') ? "Campos requeridos" : "Error al iniciar sesión"}
        message={errorModal.message}
        type="error"
      />
    </div>
  );
}
