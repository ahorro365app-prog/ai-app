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

  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState('BO');
  const [dailyBudget, setDailyBudget] = useState('');
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Cargar configuración guardada
  useEffect(() => {
    const savedCountry = localStorage.getItem('userCountry') || 'BO';
    setSelectedCountry(savedCountry);

    const savedBudget = localStorage.getItem('dailyBudget') || '';
    setDailyBudget(savedBudget);
  }, []);

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
      
      setIsEditingLocation(false);
      alert('✅ Ubicación y moneda actualizadas');
    }
  };

  const handleSaveBudget = () => {
    if (dailyBudget && parseFloat(dailyBudget) > 0) {
      localStorage.setItem('dailyBudget', dailyBudget);
      setIsEditingBudget(false);
      alert('✅ Presupuesto diario guardado');
    } else {
      alert('⚠️ Ingresa un presupuesto válido');
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
      <div className="bg-white rounded-3xl p-6 mb-4 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Globe size={20} className="text-blue-600" />
            <h3 className="text-lg font-bold text-gray-900">Ubicación y Moneda</h3>
          </div>
          {!isEditingLocation && (
            <button
              onClick={() => setIsEditingLocation(true)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Edit2 size={18} className="text-gray-600" />
            </button>
          )}
        </div>

        {isEditingLocation ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Selecciona tu país
              </label>
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border-2 border-gray-200 focus:border-blue-500 focus:outline-none text-gray-900"
              >
                {COUNTRIES.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.name} - {country.currency} ({country.symbol})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setIsEditingLocation(false)}
                className="flex-1 py-3 px-4 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
              >
                <X size={18} />
                Cancelar
              </button>
              <button
                onClick={handleSaveLocation}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold hover:opacity-90 transition-all flex items-center justify-center gap-2"
              >
                <Save size={18} />
                Guardar
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
            <DollarSign size={24} className="text-blue-600" />
            <div>
              <p className="font-semibold text-gray-900">{currentCountry?.name}</p>
              <p className="text-sm text-gray-600">
                {currentCountry?.currency} ({currentCountry?.symbol})
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Presupuesto Diario */}
      <div className="bg-white rounded-3xl p-6 mb-4 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Target size={20} className="text-purple-600" />
            <h3 className="text-lg font-bold text-gray-900">Presupuesto Diario</h3>
          </div>
          {!isEditingBudget && (
            <button
              onClick={() => setIsEditingBudget(true)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Edit2 size={18} className="text-gray-600" />
            </button>
          )}
        </div>

        {isEditingBudget ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                ¿Cuánto deseas gastar por día?
              </label>
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-gray-50 border-2 border-gray-200 focus-within:border-blue-500">
                <span className="text-2xl font-bold text-gray-400">{currency.symbol}</span>
                <input
                  type="number"
                  value={dailyBudget}
                  onChange={(e) => setDailyBudget(e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="flex-1 bg-transparent text-2xl font-bold text-gray-900 focus:outline-none"
                  autoFocus
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setIsEditingBudget(false)}
                className="flex-1 py-3 px-4 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
              >
                <X size={18} />
                Cancelar
              </button>
              <button
                onClick={handleSaveBudget}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold hover:opacity-90 transition-all flex items-center justify-center gap-2"
              >
                <Save size={18} />
                Guardar
              </button>
            </div>
          </div>
        ) : (
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
        )}
      </div>

      {/* Cerrar Sesión */}
      <button
        onClick={() => setShowLogoutModal(true)}
        className="w-full p-4 rounded-3xl bg-gradient-to-r from-red-500 to-red-600 text-white font-bold hover:opacity-90 transition-all flex items-center justify-center gap-3 shadow-lg"
      >
        <LogOut size={24} />
        Cerrar sesión
      </button>

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
    </div>
  );
}
