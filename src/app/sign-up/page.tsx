"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { UserPlus, Lock, User, Phone, Eye, EyeOff } from 'lucide-react';
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

export default function SignUpPage() {
  const router = useRouter();
  const { createUser } = useSupabase();
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('BO'); // Bolivia por defecto
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorModal, setErrorModal] = useState<{ isOpen: boolean; message: string }>({
    isOpen: false,
    message: ''
  });
  const dropdownRef = useRef<HTMLDivElement>(null);

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
                moneda: selectedCountry === 'BO' ? 'BOB' : 'USD' // Por defecto BOB para Bolivia
              });

              if (result.success) {
                setErrorModal({
            isOpen: true,
            message: '¡Cuenta creada exitosamente! Ahora puedes iniciar sesión.',
            type: 'success'
          });
          // Redirigir después de 2 segundos
          setTimeout(() => {
            router.push('/sign-in');
          }, 2000);
        } else {
          setErrorModal({
            isOpen: true,
            message: result.error || 'Error desconocido al crear la cuenta.'
          });
        }
      } catch (error) {
        console.error('Error de registro:', error);
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
  };

  const getCurrentCountry = () => {
    return countries.find(c => c.code === selectedCountry);
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
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-white rounded-full mx-auto mb-4 flex items-center justify-center shadow-2xl">
            <UserPlus size={40} className="text-purple-600" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Ahorro365</h1>
          <p className="text-purple-100">Crea tu cuenta gratis</p>
        </div>

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
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50 border-2 border-gray-200 focus-within:border-purple-500 transition-colors flex-1">
                  <Phone size={20} className="text-gray-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))} // Solo números
                    placeholder="Número de teléfono"
                    className="flex-1 bg-transparent text-gray-900 focus:outline-none"
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

            {/* Botón Registro */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-lg hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
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
          onClose={() => setErrorModal({ isOpen: false, message: '' })}
          title={errorModal.message.includes('campos') ? "Campos requeridos" : errorModal.message.includes('exitosa') ? "¡Cuenta creada!" : "Error al crear cuenta"}
          message={errorModal.message}
          type={errorModal.message.includes('exitosa') ? 'success' : 'error'}
        />
    </div>
  );
}
