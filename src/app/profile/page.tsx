"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Globe, DollarSign, Calendar, Target, LogOut, Edit2, Save, X, Phone, CreditCard, LayoutGrid } from 'lucide-react';
import { useCurrency } from '@/hooks/useCurrency';
import { useSupabase } from '@/contexts/SupabaseContext';
import { useModal } from '@/contexts/ModalContext';

const COUNTRIES = [
  { code: 'BO', name: 'Bolivia', currency: 'BOB', symbol: 'Bs', flag: '🇧🇴', phoneCode: '+591' },
  { code: 'US', name: 'Estados Unidos', currency: 'USD', symbol: '$', flag: '🇺🇸', phoneCode: '+1' },
  { code: 'EU', name: 'Eurozona', currency: 'EUR', symbol: '€', flag: '🇪🇺', phoneCode: '+49' },
  { code: 'MX', name: 'México', currency: 'MXN', symbol: '$', flag: '🇲🇽', phoneCode: '+52' },
  { code: 'AR', name: 'Argentina', currency: 'ARS', symbol: '$', flag: '🇦🇷', phoneCode: '+54' },
  { code: 'CL', name: 'Chile', currency: 'CLP', symbol: '$', flag: '🇨🇱', phoneCode: '+56' },
  { code: 'PE', name: 'Perú', currency: 'PEN', symbol: 'S/', flag: '🇵🇪', phoneCode: '+51' },
  { code: 'CO', name: 'Colombia', currency: 'COP', symbol: '$', flag: '🇨🇴', phoneCode: '+57' },
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
  const { user, updateUser, deleteAllDebts, deleteAllGoals, debts, goals, logout } = useSupabase();
  const { setModalOpen } = useModal();

  const [selectedCountry, setSelectedCountry] = useState('BO');
  const [dailyBudget, setDailyBudget] = useState('');
  const [tempDailyBudget, setTempDailyBudget] = useState('');
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  
  // Estados para información personal
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [tempUserName, setTempUserName] = useState('');
  const [tempUserEmail, setTempUserEmail] = useState('');
  const [tempUserPhone, setTempUserPhone] = useState('');
  const [showNameModal, setShowNameModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);

  // Estados para habilitación de menús
  const [isDebtsEnabled, setIsDebtsEnabled] = useState(true);
  const [isGoalsEnabled, setIsGoalsEnabled] = useState(true);
  
  // Estados para modal de confirmación
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'debts' | 'goals' | null>(null);
  const [confirmData, setConfirmData] = useState<{
    name: string, 
    count: number,
    items: Array<{
      nombre: string;
      monto?: number;
      pagado?: number;
      restante?: number;
      objetivo?: number;
      ahorrado?: number;
      falta?: number;
    }>
  }>({name: '', count: 0, items: []});
  
  // Estados para gestión de suscripción
  const [userSubscription, setUserSubscription] = useState<'free' | 'premium'>('free');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [activationCode, setActivationCode] = useState('');

  // Cargar configuración guardada
  useEffect(() => {
    if (user) {
      // Usar datos de Supabase si están disponibles
      const countryCode = Object.keys(currencyMap).find(key => 
        currencyMap[key].code === user.moneda
      ) || 'BO';
      setSelectedCountry(countryCode);
      setDailyBudget(user.presupuesto_diario?.toString() || '');
      setUserName(user.nombre);
      setUserEmail(user.correo || '');
      setUserPhone(user.telefono || '');
      
      // Usar configuración de menús desde la base de datos
      setIsDebtsEnabled(user.deudas_habilitado);
      setIsGoalsEnabled(user.metas_habilitado);
      setUserSubscription((user.suscripcion as 'free' | 'premium') || 'free');
    }
  }, [user]);

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

  const handleSaveLocation = async () => {
    const country = COUNTRIES.find(c => c.code === selectedCountry);
    if (country) {
      const currencyConfig = currencyMap[country.code];
      
      if (user) {
        // Usar Supabase si hay usuario
        await updateUser({
          pais: country.name,
          moneda: currencyConfig.code
        });
      }
      
      // Actualizar el hook
      setCountry(country.code);
      setCurrency(currencyConfig);
      
      setShowLocationModal(false);
      setModalOpen(false);
      showToastMessage('✅ Ubicación y moneda actualizadas');
    }
  };

  const handleOpenBudgetModal = () => {
    setTempDailyBudget(dailyBudget);
    setShowBudgetModal(true);
    setModalOpen(true);
  };

  const handleSaveBudget = async () => {
    if (tempDailyBudget && parseFloat(tempDailyBudget) > 0) {
      if (user) {
        // Usar Supabase si hay usuario
        await updateUser({
          presupuesto_diario: parseFloat(tempDailyBudget)
        });
      }
      setDailyBudget(tempDailyBudget);
      setShowBudgetModal(false);
      setModalOpen(false);
      showToastMessage('✅ Presupuesto diario guardado');
    } else {
      showToastMessage('⚠️ Ingresa un presupuesto válido');
    }
  };

  const handleOpenNameModal = () => {
    setTempUserName(userName);
    setShowNameModal(true);
    setModalOpen(true);
  };

  const handleOpenEmailModal = () => {
    setTempUserEmail(userEmail);
    setShowEmailModal(true);
    setModalOpen(true);
  };

  const handleOpenPhoneModal = () => {
    // Extraer el número sin el prefijo del país usando prefijos conocidos
    const phoneWithoutPrefix = userPhone ? (() => {
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
      
      // Buscar el prefijo más largo que coincida
      for (const prefix of knownPrefixes.sort((a, b) => b.length - a.length)) {
        if (userPhone.startsWith(prefix)) {
          return userPhone.substring(prefix.length);
        }
      }
      
      // Fallback: usar detección automática
      const match = userPhone.match(/^(\+\d{2,3})(\d+)$/);
      return match ? match[2] : userPhone.replace(/^\+\d+/, '');
    })() : '';
    setTempUserPhone(phoneWithoutPrefix);
    setShowPhoneModal(true);
    setModalOpen(true);
  };

  const handleSaveName = async () => {
    if (tempUserName.trim()) {
      if (user) {
        // Usar Supabase si hay usuario
        await updateUser({
          nombre: tempUserName
        });
      }
      setUserName(tempUserName);
      setShowNameModal(false);
      setModalOpen(false);
      showToastMessage('✅ Nombre actualizado');
    } else {
      showToastMessage('⚠️ El nombre es obligatorio');
    }
  };

  const handleSaveEmail = async () => {
    if (user) {
      // Usar Supabase si hay usuario
      await updateUser({
        correo: tempUserEmail
      });
    }
    setUserEmail(tempUserEmail);
    setShowEmailModal(false);
    setModalOpen(false);
    showToastMessage('✅ Email actualizado');
  };

  const handleSavePhone = async () => {
    if (user && currentCountry) {
      // Agregar el prefijo del país al número
      const fullPhone = `${currentCountry.phoneCode}${tempUserPhone}`;
      
      // Usar Supabase si hay usuario
      await updateUser({
        telefono: fullPhone
      });
      
      setUserPhone(fullPhone);
      setShowPhoneModal(false);
      setModalOpen(false);
      showToastMessage('✅ Teléfono actualizado');
    }
  };

  const handleSignOut = () => {
    // Cerrar sesión correctamente
    logout();
    setShowLogoutModal(false);
    setModalOpen(false);
    // Redirigir al login
    window.location.href = '/sign-in';
  };

  const handleToggleDebts = async () => {
    const newValue = !isDebtsEnabled;
    
    // Si se está desactivando, mostrar modal de confirmación
    if (!newValue) {
      setConfirmAction('debts');
      setConfirmData({ 
        name: 'Deudas', 
        count: debts.length,
        items: debts.map(debt => ({
          nombre: debt.nombre,
          monto: debt.monto_total,
          pagado: debt.monto_pagado,
          restante: debt.monto_total - debt.monto_pagado
        }))
      });
      setShowConfirmModal(true);
      setModalOpen(true);
      return;
    }
    
    // Si se está activando, proceder normalmente
    try {
      await updateUser({ deudas_habilitado: newValue });
      setIsDebtsEnabled(newValue);
      showToastMessage('✅ Menú Deudas habilitado');
    } catch (error) {
      console.error('Error al actualizar configuración de deudas:', error);
      showToastMessage('❌ Error al actualizar configuración');
    }
  };

  const handleToggleGoals = async () => {
    const newValue = !isGoalsEnabled;
    
    // Si se está desactivando, mostrar modal de confirmación
    if (!newValue) {
      setConfirmAction('goals');
      setConfirmData({ 
        name: 'Metas', 
        count: goals.length,
        items: goals.map(goal => ({
          nombre: goal.nombre,
          objetivo: goal.monto_objetivo,
          ahorrado: goal.monto_actual,
          falta: goal.monto_objetivo - goal.monto_actual
        }))
      });
      setShowConfirmModal(true);
      setModalOpen(true);
      return;
    }
    
    // Si se está activando, proceder normalmente
    try {
      await updateUser({ metas_habilitado: newValue });
      setIsGoalsEnabled(newValue);
      showToastMessage('✅ Menú Metas habilitado');
    } catch (error) {
      console.error('Error al actualizar configuración de metas:', error);
      showToastMessage('❌ Error al actualizar configuración');
    }
  };

  // Funciones para manejar la confirmación
  const handleConfirmDisable = async () => {
    setShowConfirmModal(false);
    setModalOpen(false);
    
    try {
      if (confirmAction === 'debts') {
        // Eliminar todas las deudas de Supabase
        await deleteAllDebts();
        
        // Desactivar el menú de deudas
        await updateUser({ deudas_habilitado: false });
        setIsDebtsEnabled(false);
        
        showToastMessage('⚠️ Menú Deudas deshabilitado - Todas las deudas y comprobantes han sido eliminados');
      } else if (confirmAction === 'goals') {
        // Eliminar todas las metas de Supabase
        await deleteAllGoals();
        
        // Desactivar el menú de metas
        await updateUser({ metas_habilitado: false });
        setIsGoalsEnabled(false);
        
        showToastMessage('⚠️ Menú Metas deshabilitado - Todas las metas han sido eliminadas');
      }
      
      // Limpiar el estado del modal
      setConfirmAction(null);
      setConfirmData({ name: '', count: 0, items: [] });
      
    } catch (error) {
      console.error('Error al deshabilitar menú:', error);
      showToastMessage('❌ Error al deshabilitar menú. Inténtalo nuevamente.');
    }
  };

  const handleCancelDisable = () => {
    setShowConfirmModal(false);
    setModalOpen(false);
    setConfirmAction(null);
    setConfirmData({name: '', count: 0, items: []});
  };

  // Funciones para gestión de suscripción
  const handleActivatePremium = () => {
    // Códigos válidos para activación
    const validCodes = ['PREMIUM2024', 'PROMO50', 'VIP100', 'ADMIN123'];
    
    if (validCodes.includes(activationCode.toUpperCase())) {
      const subscription = {
        type: 'premium',
        activationCode: activationCode.toUpperCase(),
        startDate: new Date().toISOString(),
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        features: ['basic', 'advanced', 'export', 'sync', 'analytics']
      };
      
      setUserSubscription('premium');
      setShowUpgradeModal(false);
      setModalOpen(false);
      setActivationCode('');
      showToastMessage('🎉 ¡Felicidades! Has activado la versión Premium');
    } else {
      showToastMessage('❌ Código de activación inválido');
    }
  };

  const handleDowngradeToFree = () => {
    const subscription = {
      type: 'free',
      features: ['basic']
    };
    
    setUserSubscription('free');
    showToastMessage('⚠️ Has cambiado a la versión gratuita');
  };

  const currentCountry = COUNTRIES.find(c => c.code === selectedCountry);

  return (
    <div className="pt-[40px] px-4 pb-24">
      {/* Header */}
      <div className="mb-3" style={{ marginTop: 0 }}>
        <h1 className="text-xl font-bold text-gray-900 mb-1">Mi Perfil</h1>
        <p className="text-gray-600">Gestiona tu cuenta y preferencias</p>
      </div>

      {/* User Card */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-6 mb-6 text-white shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <User size={32} />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold">{userName || 'Usuario Demo'}</h2>
            <p className="text-blue-100 text-xs">{userEmail || 'demo@ahorro365.com'}</p>
            <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold">
              <Calendar size={12} />
              <span>Miembro desde {new Date().toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Información Personal */}
      <div className="bg-white rounded-3xl p-6 mb-4 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-4">
          <User size={20} className="text-green-600" />
          <h3 className="text-sm font-bold text-gray-900">Información Personal</h3>
        </div>
        <div className="space-y-3">
          {/* Campo Nombre - clickeable */}
          <button
            onClick={handleOpenNameModal}
            className="w-full flex items-center gap-3 p-3 bg-green-50 rounded-xl border border-green-200 hover:bg-green-100 hover:shadow-sm transition-all text-left"
          >
            <div className="flex-1">
              <p className="text-xs text-gray-600">Nombre</p>
              <p className="font-semibold text-gray-900">
                {userName || 'No configurado'}
              </p>
            </div>
            <Edit2 size={16} className="text-green-500" />
          </button>
          
          {/* Campo Email - clickeable */}
          <button
            onClick={handleOpenEmailModal}
            className="w-full flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-200 hover:bg-blue-100 hover:shadow-sm transition-all text-left"
          >
            <div className="flex-1">
              <p className="text-xs text-gray-600">Email</p>
              <p className="font-semibold text-gray-900">
                {userEmail || 'No configurado'}
              </p>
            </div>
            <Edit2 size={16} className="text-blue-500" />
          </button>
          
          {/* Campo Teléfono - clickeable */}
          <button
            onClick={handleOpenPhoneModal}
            className="w-full flex items-center gap-3 p-3 bg-purple-50 rounded-xl border border-purple-200 hover:bg-purple-100 hover:shadow-sm transition-all text-left"
          >
            <div className="flex-1">
              <p className="text-xs text-gray-600">Teléfono</p>
              <p className="font-semibold text-gray-900">
                {userPhone ? (() => {
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
                  
                  // Buscar el prefijo más largo que coincida
                  for (const prefix of knownPrefixes.sort((a, b) => b.length - a.length)) {
                    if (userPhone.startsWith(prefix)) {
                      const number = userPhone.substring(prefix.length);
                      return `${prefix} ${number}`;
                    }
                  }
                  
                  // Fallback: usar detección automática para prefijos no conocidos
                  const match = userPhone.match(/^(\+\d{2,3})(\d+)$/);
                  if (match) {
                    return `${match[1]} ${match[2]}`;
                  }
                  return userPhone;
                })() : 'No configurado'}
              </p>
            </div>
            <Edit2 size={16} className="text-purple-500" />
          </button>
        </div>
      </div>

      {/* Ubicación y Moneda */}
      <button
        onClick={() => {
          setShowLocationModal(true);
          setModalOpen(true);
        }}
        className="w-full bg-white rounded-3xl p-6 mb-4 shadow-sm border border-gray-100 hover:shadow-md transition-all text-left"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Globe size={20} className="text-blue-600" />
            <h3 className="text-sm font-bold text-gray-900">Ubicación y Moneda</h3>
          </div>
          <Edit2 size={18} className="text-gray-400" />
        </div>
        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
          <span className="text-4xl">{currentCountry?.flag}</span>
          <div>
            <p className="font-semibold text-gray-900">{currentCountry?.name}</p>
            <p className="text-xs text-gray-600">
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
            <h3 className="text-sm font-bold text-gray-900">Presupuesto Diario</h3>
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
              <p className="text-xs text-gray-600">Límite diario de gastos</p>
            </div>
          </div>
          
          {dailyBudget && parseFloat(dailyBudget) > 0 && (
            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl border border-blue-200">
              <Calendar size={24} className="text-blue-600" />
              <div className="flex-1">
                <p className="font-semibold text-gray-900">
                  {currency.symbol} {calculateMonthlyBudget().toFixed(2)}
                </p>
                <p className="text-xs text-gray-600">
                  Presupuesto hasta fin de mes ({new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() - new Date().getDate() + 1} días)
                </p>
              </div>
            </div>
          )}
        </div>
      </button>

      {/* Información de Suscripción */}
      <div className="bg-white rounded-3xl p-6 mb-4 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              userSubscription === 'premium' ? 'bg-gradient-to-r from-yellow-400 to-orange-500' : 'bg-gray-200'
            }`}>
              <span className="text-white text-xs font-bold">
                {userSubscription === 'premium' ? '👑' : '🔒'}
              </span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">
                {userSubscription === 'premium' ? 'Versión Premium' : 'Versión Gratuita'}
              </h3>
              <p className="text-xs text-gray-600">
                {userSubscription === 'premium' ? 'Tienes acceso a todas las funciones' : 'Funciones básicas disponibles'}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {userSubscription === 'free' ? (
              <button
                onClick={() => {
                  setShowUpgradeModal(true);
                  setModalOpen(true);
                }}
                className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs font-semibold rounded-xl hover:opacity-90 transition-all"
              >
                Actualizar
              </button>
            ) : (
              <button
                onClick={handleDowngradeToFree}
                className="px-4 py-2 bg-gray-500 text-white text-xs font-semibold rounded-xl hover:opacity-90 transition-all"
              >
                Degradar
              </button>
            )}
          </div>
        </div>
        
        {/* Características */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className={`flex items-center gap-2 ${userSubscription === 'premium' ? 'text-green-600' : 'text-gray-500'}`}>
            <span>{userSubscription === 'premium' ? '✅' : '❌'}</span>
            <span>Deudas y Metas</span>
          </div>
          <div className={`flex items-center gap-2 ${userSubscription === 'premium' ? 'text-green-600' : 'text-gray-500'}`}>
            <span>{userSubscription === 'premium' ? '✅' : '❌'}</span>
            <span>Historial Completo</span>
          </div>
          <div className={`flex items-center gap-2 ${userSubscription === 'premium' ? 'text-green-600' : 'text-gray-500'}`}>
            <span>{userSubscription === 'premium' ? '✅' : '❌'}</span>
            <span>Exportar Datos</span>
          </div>
          <div className={`flex items-center gap-2 ${userSubscription === 'premium' ? 'text-green-600' : 'text-gray-500'}`}>
            <span>{userSubscription === 'premium' ? '✅' : '❌'}</span>
            <span>Sincronización</span>
          </div>
        </div>
      </div>

      {/* Habilitación de Menús */}
      <div className="bg-white rounded-3xl p-6 mb-4 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-4">
          <LayoutGrid size={20} className="text-indigo-600" />
          <h3 className="text-sm font-bold text-gray-900">Menús Disponibles</h3>
        </div>
        <p className="text-xs text-gray-600 mb-4">Activa o desactiva los menús que deseas ver</p>
        
        <div className="space-y-3">
          {/* Toggle Deudas */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                isDebtsEnabled ? 'bg-red-100' : 'bg-gray-200'
              }`}>
                <CreditCard size={24} className={isDebtsEnabled ? 'text-red-600' : 'text-gray-400'} />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Deudas</p>
                <p className="text-xs text-gray-500">Gestiona tus préstamos</p>
              </div>
            </div>
            <button
              onClick={handleToggleDebts}
              className={`relative w-14 h-7 rounded-full transition-all ${
                isDebtsEnabled ? 'bg-red-500' : 'bg-gray-300'
              }`}
            >
              <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-all ${
                isDebtsEnabled ? 'right-1' : 'left-1'
              }`} />
            </button>
          </div>

          {/* Toggle Metas */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                isGoalsEnabled ? 'bg-purple-100' : 'bg-gray-200'
              }`}>
                <Target size={24} className={isGoalsEnabled ? 'text-purple-600' : 'text-gray-400'} />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Metas</p>
                <p className="text-xs text-gray-500">Ahorra para tus objetivos</p>
              </div>
            </div>
            <button
              onClick={handleToggleGoals}
              className={`relative w-14 h-7 rounded-full transition-all ${
                isGoalsEnabled ? 'bg-purple-500' : 'bg-gray-300'
              }`}
            >
              <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-all ${
                isGoalsEnabled ? 'right-1' : 'left-1'
              }`} />
            </button>
          </div>
        </div>
      </div>

      {/* Cerrar Sesión */}
      <button
        onClick={() => {
          setShowLogoutModal(true);
          setModalOpen(true);
        }}
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
                onClick={() => {
                  setShowLocationModal(false);
                  setModalOpen(false);
                }}
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
                <span className="text-xl font-bold text-purple-600">{currency.symbol}</span>
                <input
                  type="number"
                  value={tempDailyBudget}
                  onChange={(e) => setTempDailyBudget(e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="flex-1 bg-transparent text-xl font-bold text-gray-900 focus:outline-none modal-input"
                  autoFocus
                />
              </div>
            </div>

            {/* Botones */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowBudgetModal(false);
                  setModalOpen(false);
                }}
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

      {/* Modal de Edición de Nombre */}
      {showNameModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-scale-in">
            {/* Icono */}
            <div className="w-16 h-16 rounded-full bg-green-100 mx-auto mb-4 flex items-center justify-center">
              <User size={32} className="text-green-600" />
            </div>

            {/* Título */}
            <h3 className="text-2xl font-bold text-gray-900 text-center mb-2">
              Editar Nombre
            </h3>

            {/* Mensaje */}
            <p className="text-gray-600 text-center mb-6">
              Personaliza tu nombre de usuario
            </p>

            {/* Input */}
            <div className="mb-6">
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                Nombre <span className="text-red-500">*</span>
              </label>
                <input
                  type="text"
                  value={tempUserName}
                  onChange={(e) => setTempUserName(e.target.value)}
                  placeholder="Tu nombre"
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border-2 border-gray-200 focus:border-green-500 focus:outline-none text-gray-900 modal-input"
                  autoFocus
                />
            </div>

            {/* Botones */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowNameModal(false);
                  setModalOpen(false);
                }}
                className="flex-1 py-3.5 px-4 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveName}
                className="flex-1 py-3.5 px-4 rounded-xl bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edición de Email */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-scale-in">
            {/* Icono */}
            <div className="w-16 h-16 rounded-full bg-blue-100 mx-auto mb-4 flex items-center justify-center">
              <User size={32} className="text-blue-600" />
            </div>

            {/* Título */}
            <h3 className="text-2xl font-bold text-gray-900 text-center mb-2">
              Editar Email
            </h3>

            {/* Mensaje */}
            <p className="text-gray-600 text-center mb-6">
              Actualiza tu dirección de email
            </p>

            {/* Input */}
            <div className="mb-6">
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                Email
              </label>
                <input
                  type="email"
                  value={tempUserEmail}
                  onChange={(e) => setTempUserEmail(e.target.value)}
                  placeholder="tu@email.com"
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border-2 border-gray-200 focus:border-blue-500 focus:outline-none text-gray-900 modal-input"
                  autoFocus
                />
            </div>

            {/* Botones */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowEmailModal(false);
                  setModalOpen(false);
                }}
                className="flex-1 py-3.5 px-4 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEmail}
                className="flex-1 py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edición de Teléfono */}
      {showPhoneModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-scale-in">
            {/* Icono */}
            <div className="w-16 h-16 rounded-full bg-purple-100 mx-auto mb-4 flex items-center justify-center">
              <Phone size={32} className="text-purple-600" />
            </div>

            {/* Título */}
            <h3 className="text-2xl font-bold text-gray-900 text-center mb-2">
              Editar Teléfono
            </h3>

            {/* Mensaje */}
            <p className="text-gray-600 text-center mb-6">
              Ingresa tu número de celular
            </p>

            {/* Input */}
            <div className="mb-6">
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                Número de teléfono
              </label>
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-gray-50 border-2 border-gray-200 focus-within:border-purple-500 transition-colors">
                <span className="text-sm font-bold text-purple-600">{currentCountry?.phoneCode}</span>
                  <input
                    type="tel"
                    value={tempUserPhone}
                    onChange={(e) => setTempUserPhone(e.target.value)}
                    placeholder="12345678"
                    className="flex-1 bg-transparent text-gray-900 focus:outline-none modal-input"
                    autoFocus
                  />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Prefijo: {currentCountry?.phoneCode} ({currentCountry?.name})
              </p>
            </div>

            {/* Botones */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowPhoneModal(false);
                  setModalOpen(false);
                }}
                className="flex-1 py-3.5 px-4 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleSavePhone}
                className="flex-1 py-3.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg"
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
                onClick={() => {
                  setShowLogoutModal(false);
                  setModalOpen(false);
                }}
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

      {/* Modal de Confirmación para Deshabilitar Menú */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-scale-in">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-red-100 mx-auto mb-4 flex items-center justify-center">
                <X size={32} className="text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                ¿Deshabilitar {confirmData.name}?
              </h3>
            </div>

            {/* Información de Advertencia */}
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <X size={16} className="text-red-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-red-800 mb-1">Advertencia</h4>
                  <p className="text-xs text-red-700">
                    Se eliminarán <strong>todas</strong> las {confirmData.name.toLowerCase()} y toda su información asociada (historial de pagos, comprobantes, etc.) de la base de datos. Esta acción es irreversible.
                  </p>
                </div>
              </div>
            </div>

            {/* Resumen de Items */}
            {confirmData.count > 0 && (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6">
                <h4 className="font-semibold text-gray-800 mb-3 text-center">
                  Resumen de {confirmData.name} a eliminar ({confirmData.count})
                </h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {confirmData.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-white rounded-lg border border-gray-100">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 text-xs">{item.nombre}</p>
                        {confirmAction === 'debts' ? (
                          <p className="text-xs text-gray-500">
                            Total: {currency.symbol}{item.monto?.toLocaleString()} | 
                            Pagado: {currency.symbol}{item.pagado?.toLocaleString()} | 
                            Restante: {currency.symbol}{item.restante?.toLocaleString()}
                          </p>
                        ) : (
                          <p className="text-xs text-gray-500">
                            Objetivo: {currency.symbol}{item.objetivo?.toLocaleString()} | 
                            Ahorrado: {currency.symbol}{item.ahorrado?.toLocaleString()} | 
                            Falta: {currency.symbol}{item.falta?.toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Botones */}
            <div className="flex gap-3">
              <button
                onClick={handleCancelDisable}
                className="flex-1 py-3.5 px-4 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDisable}
                className="flex-1 py-3.5 px-4 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg"
              >
                Eliminar y Deshabilitar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Activación Premium */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-scale-in">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 mx-auto mb-4 flex items-center justify-center">
                <span className="text-white text-2xl">👑</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Activar Premium
              </h3>
              <p className="text-gray-600 text-xs">
                Ingresa tu código de activación para desbloquear todas las funciones premium.
              </p>
            </div>

            {/* Código de activación */}
            <div className="mb-6">
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                Código de Activación
              </label>
              <input
                type="text"
                value={activationCode}
                onChange={(e) => setActivationCode(e.target.value.toUpperCase())}
                placeholder="PREMIUM2024"
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border-2 border-gray-200 focus:border-yellow-500 focus:outline-none modal-input text-center font-mono text-sm"
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-2 text-center">
                Códigos válidos: PREMIUM2024, PROMO50, VIP100, ADMIN123
              </p>
            </div>

            {/* Características Premium */}
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-4 mb-6 border border-yellow-200">
              <h4 className="font-semibold text-gray-900 mb-3 text-center">✨ Funciones Premium</h4>
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2 text-green-700">
                  <span>✅</span>
                  <span>Deudas y Metas ilimitadas</span>
                </div>
                <div className="flex items-center gap-2 text-green-700">
                  <span>✅</span>
                  <span>Historial completo con comprobantes</span>
                </div>
                <div className="flex items-center gap-2 text-green-700">
                  <span>✅</span>
                  <span>Exportar datos a Excel/PDF</span>
                </div>
                <div className="flex items-center gap-2 text-green-700">
                  <span>✅</span>
                  <span>Sincronización en la nube</span>
                </div>
                <div className="flex items-center gap-2 text-green-700">
                  <span>✅</span>
                  <span>Análisis y reportes avanzados</span>
                </div>
              </div>
            </div>

            {/* Botones */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowUpgradeModal(false);
                  setModalOpen(false);
                }}
                className="flex-1 py-3.5 px-4 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleActivatePremium}
                className="flex-1 py-3.5 px-4 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg"
              >
                Activar Premium
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
