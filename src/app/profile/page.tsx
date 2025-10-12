"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Globe, DollarSign, Calendar, Target, LogOut, Edit2, Save, X } from 'lucide-react';
import { useCurrency } from '@/hooks/useCurrency';

const COUNTRIES = [
  { code: 'BO', name: 'Bolivia', currency: 'BOB', symbol: 'Bs', flag: '🇧🇴' },
  { code: 'US', name: 'Estados Unidos', currency: 'USD', symbol: '$', flag: '🇺🇸' },
  { code: 'EU', name: 'Eurozona', currency: 'EUR', symbol: '€', flag: '🇪🇺' },
  { code: 'MX', name: 'México', currency: 'MXN', symbol: '$', flag: '🇲🇽' },
  { code: 'AR', name: 'Argentina', currency: 'ARS', symbol: '$', flag: '🇦🇷' },
  { code: 'CL', name: 'Chile', currency: 'CLP', symbol: '$', flag: '🇨🇱' },
  { code: 'PE', name: 'Perú', currency: 'PEN', symbol: 'S/', flag: '🇵🇪' },
  { code: 'CO', name: 'Colombia', currency: 'COP', symbol: '$', flag: '🇨🇴' },
];

const currencyMap: Record<string, { code: string; symbol: string; name: string; locale: string }> = {
  'BO': { code: 'BOB', symbol: 'Bs', name: 'Boliviano', locale: 'es-BO' },
  'US': { code: 'USD', symbol: '$', name: 'Dólar estadounidense', locale: 'en-US' },
  'EU': { code: 'EUR', symbol: '€', name: 'Euro', locale: 'es-ES' },
  'MX': { code: 'MXN', symbol: '$', name: 'Peso mexicano', locale: 'es-MX' },
  'AR': { code: 'ARS', symbol: '$', name: 'Peso argentino', locale: 'es-AR' },
  'CL': { code: 'CLP', symbol: '$', name: 'Peso chileno', locale: 'es-CL' },
  'PE': { code: 'PEN', symbol: 'S/', name: 'Sol peruano', locale: 'es-PE' },
  'CO': { code: 'COP', symbol: '$', name: 'Peso colombiano', locale: 'es-CO' },
};

export default function ProfilePage() {
  const router = useRouter();
  const { currency, setCountry, setCurrency } = useCurrency();

  const [selectedCountry, setSelectedCountry] = useState('BO');
  const [dailyBudget, setDailyBudget] = useState('');
  const [tempDailyBudget, setTempDailyBudget] = useState('');
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Cargar configuración guardada
  useEffect(() => {
    const savedCountry = localStorage.getItem('userCountry') || 'BO';
    setSelectedCountry(savedCountry);

    const savedBudget = localStorage.getItem('dailyBudget') || '';
    setDailyBudget(savedBudget);
  }, []);

  // Auto-ocultar toast después de 3 segundos
  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => {
        setShowToast(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  // Función para mostrar toast
  const showToastMessage = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
  };

  // Calcular días restantes del mes desde que se guardó el presupuesto
  const calculateMonthlyBudget = () => {
    if (!dailyBudget || parseFloat(dailyBudget) === 0) return 0;
    
    const today = new Date();
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const currentDay = today.getDate();
    const daysRemaining = lastDayOfMonth - currentDay + 1; // +1 para incluir el día actual
    
    return parseFloat(dailyBudget) * daysRemaining;
  };

  const handleSaveLocation = () => {
    const country = COUNTRIES.find(c => c.code === selectedCountry);
    if (country) {
      const currencyConfig = currencyMap[country.code];
      
      // Guardar en localStorage
      localStorage.setItem('userCountry', country.code);
      localStorage.setItem('userCurrency', JSON.stringify(currencyConfig));
      
      // Actualizar el hook
      setCountry(country.code);
      setCurrency(currencyConfig);
      
      setShowLocationModal(false);
      showToastMessage('✅ Ubicación y moneda actualizadas');
    }
  };

  const handleOpenBudgetModal = () => {
    setTempDailyBudget(dailyBudget);
    setShowBudgetModal(true);
  };

  const handleSaveBudget = () => {
    if (tempDailyBudget && parseFloat(tempDailyBudget) > 0) {
      localStorage.setItem('dailyBudget', tempDailyBudget);
      setDailyBudget(tempDailyBudget);
      setShowBudgetModal(false);
      showToastMessage('✅ Presupuesto diario guardado');
    } else {
      showToastMessage('⚠️ Ingresa un presupuesto válido');
    }
  };

  const handleSignOut = () => {
    // Redirigir al login (sin borrar datos)
    window.location.href = '/sign-in';
  };

  const currentCountry = COUNTRIES.find(c => c.code === selectedCountry);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4 pb-24">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Mi Perfil</h1>
        <p className="text-gray-600">Gestiona tu cuenta y preferencias</p>
      </div>

      {/* User Card */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-6 mb-6 text-white shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <User size={32} />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold">Usuario Demo</h2>
            <p className="text-blue-100 text-sm">demo@ahorro365.com</p>
            <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold">
              <Calendar size={12} />
              <span>Miembro desde {new Date().toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Ubicación y Moneda */}
      <button
        onClick={() => setShowLocationModal(true)}
        className="w-full bg-white rounded-3xl p-6 mb-4 shadow-sm border border-gray-100 hover:shadow-md transition-all text-left"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Globe size={20} className="text-blue-600" />
            <h3 className="text-lg font-bold text-gray-900">Ubicación y Moneda</h3>
          </div>
          <Edit2 size={18} className="text-gray-400" />
        </div>
        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
          <span className="text-4xl">{currentCountry?.flag}</span>
          <div>
            <p className="font-semibold text-gray-900">{currentCountry?.name}</p>
            <p className="text-sm text-gray-600">
              {currentCountry?.currency} ({currentCountry?.symbol})
            </p>
          </div>
        </div>
      </button>

      {/* Presupuesto Diario */}
      <button
        onClick={handleOpenBudgetModal}
        className="w-full bg-white rounded-3xl p-6 mb-4 shadow-sm border border-gray-100 hover:shadow-md transition-all text-left"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Target size={20} className="text-purple-600" />
            <h3 className="text-lg font-bold text-gray-900">Presupuesto Diario</h3>
          </div>
          <Edit2 size={18} className="text-gray-400" />
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-xl border border-purple-200">
            <Target size={24} className="text-purple-600" />
            <div className="flex-1">
              <p className="font-semibold text-gray-900">
                {dailyBudget ? `${currency.symbol} ${parseFloat(dailyBudget).toFixed(2)}` : 'No configurado'}
              </p>
              <p className="text-sm text-gray-600">Límite diario de gastos</p>
            </div>
          </div>
          
          {dailyBudget && parseFloat(dailyBudget) > 0 && (
            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl border border-blue-200">
              <Calendar size={24} className="text-blue-600" />
              <div className="flex-1">
                <p className="font-semibold text-gray-900">
                  {currency.symbol} {calculateMonthlyBudget().toFixed(2)}
                </p>
                <p className="text-sm text-gray-600">
                  Presupuesto hasta fin de mes ({new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() - new Date().getDate() + 1} días)
                </p>
              </div>
            </div>
          )}
        </div>
      </button>

      {/* Cerrar Sesión */}
      <button
        onClick={() => setShowLogoutModal(true)}
        className="w-full p-4 rounded-3xl bg-gradient-to-r from-red-500 to-red-600 text-white font-bold hover:opacity-90 transition-all flex items-center justify-center gap-3 shadow-lg"
      >
        <LogOut size={24} />
        Cerrar sesión
      </button>

      {/* Modal de Ubicación y Moneda */}
      {showLocationModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl animate-scale-in max-h-[85vh] flex flex-col">
            {/* Icono */}
            <div className="w-16 h-16 rounded-full bg-blue-100 mx-auto mb-4 flex items-center justify-center flex-shrink-0">
              <Globe size={32} className="text-blue-600" />
            </div>

            {/* Título */}
            <h3 className="text-2xl font-bold text-gray-900 text-center mb-2 flex-shrink-0">
              Ubicación y Moneda
            </h3>

            {/* Mensaje */}
            <p className="text-gray-600 text-center mb-4 flex-shrink-0">
              Selecciona tu país para configurar la moneda
            </p>

            {/* Grid de países - scrolleable */}
            <div className="flex-1 overflow-y-auto mb-4 scrollbar-hide">
              <div className="grid grid-cols-3 gap-2">
                {COUNTRIES.map((country) => (
                  <button
                    key={country.code}
                    type="button"
                    onClick={() => setSelectedCountry(country.code)}
                    className={`
                      flex flex-col items-center justify-center p-3 rounded-2xl transition-all
                      ${selectedCountry === country.code
                        ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-xl scale-105 ring-4 ring-blue-200'
                        : 'bg-white text-gray-900 hover:bg-gray-50 border-2 border-gray-200 hover:border-blue-300 hover:shadow-md'
                      }
                    `}
                  >
                    <span className="text-3xl mb-1">{country.flag}</span>
                    <p className={`text-xs font-bold text-center ${selectedCountry === country.code ? 'text-white' : 'text-gray-900'}`}>
                      {country.name}
                    </p>
                    <p className={`text-[10px] text-center ${selectedCountry === country.code ? 'text-blue-100' : 'text-gray-500'}`}>
                      {country.symbol}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Botones - fijos al fondo */}
            <div className="flex gap-3 flex-shrink-0 pt-2 border-t border-gray-100">
              <button
                onClick={() => setShowLocationModal(false)}
                className="flex-1 py-3.5 px-4 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveLocation}
                className="flex-1 py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Presupuesto Diario */}
      {showBudgetModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-scale-in">
            {/* Icono */}
            <div className="w-16 h-16 rounded-full bg-purple-100 mx-auto mb-4 flex items-center justify-center">
              <Target size={32} className="text-purple-600" />
            </div>

            {/* Título */}
            <h3 className="text-2xl font-bold text-gray-900 text-center mb-2">
              Presupuesto Diario
            </h3>

            {/* Mensaje */}
            <p className="text-gray-600 text-center mb-6">
              ¿Cuánto deseas gastar por día?
            </p>

            {/* Input de presupuesto */}
            <div className="mb-6">
              <div className="flex items-center gap-2 px-6 py-4 rounded-2xl bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200 focus-within:border-purple-500 transition-colors">
                <span className="text-3xl font-bold text-purple-600">{currency.symbol}</span>
                <input
                  type="number"
                  value={tempDailyBudget}
                  onChange={(e) => setTempDailyBudget(e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="flex-1 bg-transparent text-3xl font-bold text-gray-900 focus:outline-none"
                  autoFocus
                />
              </div>
            </div>

            {/* Botones */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowBudgetModal(false)}
                className="flex-1 py-3.5 px-4 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveBudget}
                className="flex-1 py-3.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Cierre de Sesión */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-scale-in">
            {/* Icono */}
            <div className="w-16 h-16 rounded-full bg-red-100 mx-auto mb-4 flex items-center justify-center">
              <LogOut size={32} className="text-red-600" />
            </div>

            {/* Título */}
            <h3 className="text-2xl font-bold text-gray-900 text-center mb-2">
              ¿Cerrar sesión?
            </h3>

            {/* Mensaje */}
            <p className="text-gray-600 text-center mb-6">
              Podrás volver a ingresar cuando quieras. Tus datos se mantendrán guardados.
            </p>

            {/* Botones */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 py-3.5 px-4 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleSignOut}
                className="flex-1 py-3.5 px-4 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast de Notificación */}
      {showToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
          <div className="bg-gray-900 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-sm">
            <span>{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
}
