"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { User as UserIcon, Globe, DollarSign, Calendar, Target, LogOut, Edit2, Save, X, Phone, CreditCard, LayoutGrid, CheckCircle, Copy, Bell, Eye, EyeOff, Lock } from 'lucide-react';
import { useCurrency } from '@/hooks/useCurrency';
import { useSupabase, type User } from '@/contexts/SupabaseContext';
import { useModal } from '@/contexts/ModalContext';
import WhatsAppVerificationModal from '@/components/WhatsAppVerificationModal';
import PhoneChangeModal from '@/components/PhoneChangeModal';
import { LifeBuoy } from 'lucide-react';
import { logger } from '@/lib/logger';
import { Capacitor } from '@capacitor/core';
import { getApiBaseUrl } from '@/lib/apiConfig';

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
  const { user, updateUser, deleteAllDebts, deleteAllGoals, debts, goals, logout, checkCanChangePhone, fetchUserData, signInWithPhone } = useSupabase();
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
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [showPhoneChangeModal, setShowPhoneChangeModal] = useState(false);
  const [phoneChangeInfo, setPhoneChangeInfo] = useState<{ canChange: boolean; daysRemaining?: number } | null>(null);

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
  const [userSubscription, setUserSubscription] = useState<'free' | 'smart' | 'pro' | 'caducado'>('free');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Estados para modales de verificación WhatsApp
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [whatsappCodePending, setWhatsappCodePending] = useState<{ timeRemaining: number; expiresAt: string } | null>(null);
  
  // Estados para cambio de teléfono pendiente
  const [phoneChangePending, setPhoneChangePending] = useState<{ phone: string; timeRemaining: number; expiresAt: string } | null>(null);

  // Función para verificar si hay cambio de teléfono pendiente en localStorage
  const checkPendingPhoneChange = useCallback(() => {
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
      
      if (latestCode) {
        const expiresAtDate = new Date(latestCode.expiresAt);
        const now = new Date();
        const timeRemaining = Math.max(0, Math.floor((expiresAtDate.getTime() - now.getTime()) / 1000));
        
        if (timeRemaining > 0) {
          setPhoneChangePending({
            phone: latestCode.phone,
            timeRemaining,
            expiresAt: latestCode.expiresAt
          });
          // Sanitizar teléfono para logs
          const sanitizedPhone = latestCode.phone ? `${latestCode.phone.substring(0, 3)}***${latestCode.phone.substring(latestCode.phone.length - 2)}` : 'null';
          logger.debug('✅ Cambio de teléfono pendiente encontrado:', { phone: sanitizedPhone, timeRemaining });
        } else {
          // Código expirado
          setPhoneChangePending(null);
        }
      } else {
        setPhoneChangePending(null);
      }
    } catch (error) {
      logger.error('❌ Error verificando cambio de teléfono pendiente:', error);
      setPhoneChangePending(null);
    }
  }, []);

  // Función para verificar si hay código pendiente en localStorage
  const checkPendingCode = useCallback(() => {
    if (!user?.telefono) {
      setWhatsappCodePending(null);
      return;
    }

    try {
      const cleanedPhone = user.telefono.replace(/\D/g, '');
      const storageKey = `whatsapp_verification_${cleanedPhone}`;
      const stored = localStorage.getItem(storageKey);
      
      if (!stored) {
        setWhatsappCodePending(null);
        return;
      }

      const data = JSON.parse(stored);
      const expiresAtDate = new Date(data.expiresAt);
      const now = new Date();
      const timeRemaining = Math.floor((expiresAtDate.getTime() - now.getTime()) / 1000);

      if (timeRemaining > 0) {
        setWhatsappCodePending({ timeRemaining, expiresAt: data.expiresAt });
      } else {
        // Código expirado, limpiar
        localStorage.removeItem(storageKey);
        setWhatsappCodePending(null);
      }
    } catch (error) {
      logger.error('Error verificando código pendiente:', error);
      setWhatsappCodePending(null);
    }
  }, [user?.telefono]);

  // Función para formatear tiempo restante
  const formatTimeRemaining = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatPhoneChangeTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Verificar código pendiente al cargar y cuando cambia el usuario
  useEffect(() => {
    checkPendingCode();
    checkPendingPhoneChange();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.telefono]); // Solo cuando cambia el teléfono del usuario

  // Actualizar tiempo restante cada segundo si hay código pendiente de WhatsApp
  useEffect(() => {
    if (!whatsappCodePending) return;

    const interval = setInterval(() => {
      checkPendingCode();
    }, 1000);

    return () => clearInterval(interval);
  }, [whatsappCodePending, checkPendingCode]);

  // Actualizar tiempo restante cada segundo si hay cambio de teléfono pendiente
  useEffect(() => {
    if (!phoneChangePending) return;

    const interval = setInterval(() => {
      // Actualizar solo el tiempo restante sin llamar a checkPendingPhoneChange
      // para evitar bucles infinitos
      setPhoneChangePending(prev => {
        if (!prev) return null;
        
        const now = new Date().getTime();
        const expiresAt = new Date(prev.expiresAt).getTime();
        const timeRemaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
        
        if (timeRemaining <= 0) {
          // Tiempo expirado, limpiar
          return null;
        }
        
        return {
          ...prev,
          timeRemaining
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [phoneChangePending]);

  // Verificar cuando se cierra el modal de WhatsApp
  const handleWhatsAppModalClose = async () => {
    setShowWhatsAppModal(false);
    setModalOpen(false);
    // Verificar código pendiente después de cerrar
    setTimeout(() => checkPendingCode(), 100);
    
    // Refrescar datos del usuario después de cerrar el modal
    try {
      await fetchUserData();
    } catch (error) {
      logger.error('Error refrescando datos después de verificación:', error);
    }
    // Mostrar toast de éxito si se verificó
    if (user?.whatsapp_verificado) {
      setShowToast(true);
      setToastMessage('✅ WhatsApp verificado correctamente');
    }
  };

  // Estados para preferencias de notificaciones
  const [notificationPreferences, setNotificationPreferences] = useState({
    push_enabled: true,
    transaction_enabled: true,
    reminder_enabled: true,
    marketing_enabled: true,
    timezone: null as string | null,
  });
  const [loadingPreferences, setLoadingPreferences] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [showMenusModal, setShowMenusModal] = useState(false);

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
      setUserSubscription((user.suscripcion as 'free' | 'smart' | 'pro' | 'caducado') || 'free');
    }
  }, [user]);

  useEffect(() => {
    const refreshUser = async () => {
      try {
        await fetchUserData();
      } catch (error) {
        logger.error('Error refrescando datos del usuario:', error);
      }
    };

    refreshUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cargar preferencias de notificaciones
  useEffect(() => {
    const loadNotificationPreferences = async () => {
      if (!user?.id) return;

      try {
        // Construir URL correcta para web y móvil
        let apiUrl: string;
        const isNativePlatform = typeof window !== 'undefined' && 
          typeof (window as any).Capacitor !== 'undefined' &&
          Capacitor.isNativePlatform();
        
        if (isNativePlatform) {
          // En móvil, usar función centralizada para obtener URL del API
          const baseUrl = getApiBaseUrl();
          apiUrl = `${baseUrl}/api/notifications/preferences?userId=${user.id}`;
        } else {
          // En web, usar ruta relativa
          apiUrl = `/api/notifications/preferences?userId=${user.id}`;
        }

        const response = await fetch(apiUrl);
        const data = await response.json();
        
        if (data.success && data.preferences) {
          setNotificationPreferences({
            push_enabled: data.preferences.push_enabled ?? true,
            transaction_enabled: data.preferences.transaction_enabled ?? true,
            reminder_enabled: data.preferences.reminder_enabled ?? true,
            marketing_enabled: data.preferences.marketing_enabled ?? true,
            timezone: data.preferences.timezone ?? null,
          });
        }
      } catch (error) {
        logger.error('Error cargando preferencias de notificaciones:', error);
      }
    };

    loadNotificationPreferences();
  }, [user?.id]);

  // Función para actualizar preferencias de notificaciones
  const updateNotificationPreference = async (key: string, value: boolean) => {
    if (!user?.id) return;

    setLoadingPreferences(true);
    const previousPreferences = { ...notificationPreferences };
    
    try {
      const updatedPreferences = { ...notificationPreferences, [key]: value };
      setNotificationPreferences(updatedPreferences);

      // Construir URL correcta para web y móvil
      let apiUrl: string;
      
      // Detectar si estamos en una app nativa (Android/iOS)
      // Usar Capacitor.isNativePlatform() para detección precisa
      const isNativePlatform = typeof window !== 'undefined' && 
        typeof (window as any).Capacitor !== 'undefined' &&
        Capacitor.isNativePlatform();
      
      if (isNativePlatform) {
        // En móvil (app nativa), usar la URL del servidor remoto
        // Usar función centralizada para obtener URL del API
        const baseUrl = getApiBaseUrl();
        apiUrl = `${baseUrl}/api/notifications/preferences?userId=${user.id}`;
        logger.debug('Actualizando preferencias desde móvil, URL:', apiUrl);
      } else {
        // En web (localhost o producción web), usar ruta relativa
        // Esto evita problemas de CSP y usa el endpoint local
        apiUrl = `/api/notifications/preferences?userId=${user.id}`;
        logger.debug('Actualizando preferencias desde web, URL:', apiUrl);
      }

      logger.debug('Enviando petición PUT a:', apiUrl, { key, value });

      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value }),
      });

      logger.debug('Respuesta recibida:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
      });

      // Verificar si la respuesta es JSON válido
      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        logger.error('Respuesta no es JSON:', text);
        throw new Error(`Respuesta inválida del servidor: ${response.status} ${response.statusText}`);
      }

      logger.debug('Datos recibidos:', data);
      
      if (!response.ok || !data.success) {
        // Revertir cambio si falla
        setNotificationPreferences(previousPreferences);
        const errorMessage = data.message || `Error ${response.status}: ${response.statusText}`;
        logger.error('Error al actualizar preferencias:', {
          status: response.status,
          data,
          errorMessage,
        });
        showToastMessage(`❌ Error al actualizar preferencias: ${errorMessage}`);
      } else {
        showToastMessage('✅ Preferencias actualizadas');
      }
    } catch (error) {
      logger.error('Error actualizando preferencias:', error);
      setNotificationPreferences(previousPreferences);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      showToastMessage(`❌ Error al actualizar preferencias: ${errorMessage}`);
    } finally {
      setLoadingPreferences(false);
    }
  };

  // Auto-ocultar toast después de 3 segundos
  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => {
        setShowToast(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  const daysUntilExpiration = useMemo(() => {
    if (!user?.fecha_expiracion_suscripcion) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expiration = new Date(user.fecha_expiracion_suscripcion);
    if (Number.isNaN(expiration.getTime())) {
      return null;
    }
    expiration.setHours(0, 0, 0, 0);

    return Math.ceil((expiration.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }, [user?.fecha_expiracion_suscripcion]);

  const expirationStyles = useMemo(() => {
    if (daysUntilExpiration === null) {
      return {
        container: 'mb-3 p-3 bg-gray-50 rounded-xl border border-gray-200',
        icon: 'text-gray-500',
        label: 'text-gray-600',
        value: 'text-gray-900',
      };
    }

    if (daysUntilExpiration <= 1) {
      return {
        container: 'mb-3 p-3 bg-red-50 rounded-xl border border-red-200',
        icon: 'text-red-500',
        label: 'text-red-600',
        value: 'text-red-800',
      };
    }

    if (daysUntilExpiration <= 7) {
      return {
        container: 'mb-3 p-3 bg-orange-50 rounded-xl border border-orange-200',
        icon: 'text-orange-500',
        label: 'text-orange-600',
        value: 'text-orange-700',
      };
    }

    return {
      container: 'mb-3 p-3 bg-blue-50 rounded-xl border border-blue-200',
      icon: 'text-blue-500',
      label: 'text-blue-600',
      value: 'text-blue-900',
    };
  }, [daysUntilExpiration]);

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

  const handleOpenPhoneModal = async () => {
    // No permitir editar teléfono si hay código de verificación pendiente
    if (whatsappCodePending) {
      showToastMessage('⏳ Completa la verificación de WhatsApp antes de editar el teléfono');
      return;
    }

    // No permitir cambiar teléfono si hay cambio pendiente
    if (phoneChangePending) {
      showToastMessage('⏳ Debes completar el cambio pendiente primero');
      return;
    }

    // Si el teléfono está verificado, usar el proceso especial de cambio
    if (user?.whatsapp_verificado) {
      const result = await checkCanChangePhone();
      setPhoneChangeInfo({ canChange: result.canChange, daysRemaining: result.daysRemaining });
      
      if (!result.canChange) {
        // Mostrar mensaje de cooldown
        showToastMessage(`⏳ ${result.reason || 'No puedes cambiar el teléfono en este momento'}`);
        return;
      }
      
      // Abrir modal de cambio de teléfono
      setShowPhoneChangeModal(true);
      setModalOpen(true);
      return;
    }

    // Si no está verificado, usar edición simple
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

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      showToastMessage('⚠️ Completa todos los campos');
      return;
    }

    if (newPassword.length < 6) {
      showToastMessage('⚠️ La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (newPassword !== confirmPassword) {
      showToastMessage('⚠️ Las contraseñas no coinciden');
      return;
    }

    try {
      // Verificar contraseña actual
      const { success: loginSuccess } = await signInWithPhone(user?.telefono || '', currentPassword);
      
      if (!loginSuccess) {
        showToastMessage('❌ Contraseña actual incorrecta');
        return;
      }

      // Actualizar contraseña
      if (user) {
        await updateUser({
          contrasena: newPassword
        });
      }

      // Limpiar campos
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordModal(false);
      setModalOpen(false);
      showToastMessage('✅ Contraseña actualizada exitosamente');
    } catch (error) {
      logger.error('Error cambiando contraseña:', error);
      showToastMessage('❌ Error al actualizar contraseña');
    }
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
      logger.error('Error al actualizar configuración de deudas:', error);
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
      logger.error('Error al actualizar configuración de metas:', error);
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
      logger.error('Error al deshabilitar menú:', error);
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
            <UserIcon size={32} />
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
          <UserIcon size={20} className="text-green-600" />
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
          
                     {/* Campo Teléfono - editable */}
            <div className="w-full flex items-center gap-2 p-3 bg-purple-50 rounded-xl border border-purple-200">
          <button
            onClick={phoneChangePending ? () => setShowPhoneChangeModal(true) : handleOpenPhoneModal}
            disabled={!!whatsappCodePending}
            className={`flex-1 flex items-center gap-3 rounded-lg p-2 -m-2 transition-all text-left ${
              whatsappCodePending
                ? 'opacity-50 cursor-not-allowed' 
                : 'hover:bg-purple-100'
            }`}
            title={
              whatsappCodePending 
                ? 'Completa la verificación de WhatsApp antes de editar el teléfono'
                : phoneChangePending
                ? 'Completa el cambio de teléfono pendiente'
                : 'Editar teléfono'
            }
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
              {user?.whatsapp_verificado ? (
                phoneChangePending ? (
                  <span className="text-xs text-purple-600 font-semibold">
                    Completar cambio ({formatPhoneChangeTime(phoneChangePending.timeRemaining)})
                  </span>
                ) : (
                  <span className="text-xs text-purple-600 font-semibold">Cambiar</span>
                )
              ) : (
            <Edit2 size={16} className={whatsappCodePending ? "text-gray-400" : "text-purple-500"} />
              )}
          </button>
            
            {/* Estado de verificación */}
            {user?.whatsapp_verificado && (
              <div className="flex items-center gap-2 px-2 py-1 bg-green-50 border border-green-200 text-green-700 text-xs font-semibold rounded-full whitespace-nowrap">
                <CheckCircle size={12} />
                <span>WhatsApp verificado</span>
              </div>
            )}
            
            {/* Botón Verificar WhatsApp / Ingresar código (solo si no está verificado y hay teléfono) */}
              {userPhone && !user?.whatsapp_verificado && (userSubscription === 'free' || userSubscription === 'smart') && (
                <button
                  onClick={() => setShowWhatsAppModal(true)}
                  className="px-3 py-1.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-xs font-semibold rounded-lg hover:opacity-90 transition-all flex items-center gap-1.5 whitespace-nowrap"
                  title={whatsappCodePending ? "Ingresar código de verificación" : "Verificar WhatsApp"}
                >
                  <CheckCircle size={14} />
                  <span>
                    {whatsappCodePending 
                      ? `Ingresar el código (${formatTimeRemaining(whatsappCodePending.timeRemaining)})`
                      : 'Verificar por WhatsApp'
                    }
                  </span>
                </button>
              )}
              
              {/* Badge de verificado */}
            </div>
          
          {/* Campo Contraseña - clickeable */}
          <button
            onClick={() => {
              setShowPasswordModal(true);
              setModalOpen(true);
            }}
            className="w-full flex items-center gap-3 p-3 bg-red-50 rounded-xl border border-red-200 hover:bg-red-100 hover:shadow-sm transition-all text-left"
          >
            <div className="flex-1">
              <p className="text-xs text-gray-600">Contraseña</p>
              <p className="font-semibold text-gray-900">
                ••••••••
              </p>
            </div>
            <Lock size={16} className="text-red-500" />
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
              userSubscription === 'pro' ? 'bg-gradient-to-r from-purple-500 to-pink-500' :
              userSubscription === 'smart' ? 'bg-gradient-to-r from-blue-500 to-cyan-500' :
              userSubscription === 'caducado' ? 'bg-gradient-to-r from-gray-400 to-gray-600' :
              'bg-gradient-to-r from-gray-300 to-gray-400'
            }`}>
              <span className="text-white text-xs font-bold">
                {userSubscription === 'pro' ? '👑' :
                 userSubscription === 'smart' ? '✨' :
                 userSubscription === 'caducado' ? '⏰' : '🎁'}
              </span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">
                {(() => {
                  const planNames: Record<string, string> = {
                    'free': 'Free (14 días)',
                    'smart': 'Smart (14 días)',
                    'pro': 'Pro ($2.99/mes)',
                    'caducado': 'Caducado (3 transacciones/día)'
                  };
                  return planNames[userSubscription] || 'Plan Free';
                })()}
              </h3>
              <p className="text-xs text-gray-600">
                {(() => {
                  if (userSubscription === 'caducado') return 'Límite: 3 transacciones/día';
                  if (userSubscription === 'free') return '1 deuda, 1 meta, 10 transacciones/día';
                  if (userSubscription === 'smart') return '1 deuda, 1 meta, 10 transacciones/día';
                  if (userSubscription === 'pro') return '5 deudas, 5 metas, 20 transacciones/día';
                  return 'Funciones básicas disponibles';
                })()}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
              <button
                onClick={() => {
                if (userSubscription === 'pro') {
                  router.push('/billing/pay');
                } else {
                  // Abrir modal de actualización
                  setShowUpgradeModal(true);
                  setModalOpen(true);
                }
              }}
              className={`px-4 py-2 ${
                userSubscription === 'pro'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600'
                  : 'bg-gradient-to-r from-purple-500 to-pink-500'
              } text-white text-xs font-semibold rounded-xl hover:opacity-90 transition-all`}
            >
              {userSubscription === 'pro' ? 'Renovar Pro' : 'Actualizar'}
              </button>
          </div>
        </div>
        
        {/* Fecha de expiración */}
        {user?.fecha_expiracion_suscripcion && (
          <div className={expirationStyles.container}>
            <div className="flex items-center gap-2">
              <Calendar size={16} className={expirationStyles.icon} />
              <div className="flex-1">
                <p className={`text-xs font-semibold ${expirationStyles.label}`}>Expira el</p>
                <p className={`text-sm font-semibold ${expirationStyles.value}`}>
                  {new Date(user.fecha_expiracion_suscripcion).toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Referidos verificados (Free, Smart, Caducado o Pro si nunca ganó Smart) */}
        {(
          (
            (['free', 'smart', 'caducado'] as const).includes(userSubscription) ||
            (userSubscription === 'pro' && (user as any)?.ha_ganado_smart === false)
          ) &&
          user?.referidos_verificados !== undefined
        ) && (
          <div className="mb-3 p-3 bg-green-50 rounded-xl border border-green-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <UserIcon size={16} className="text-green-600" />
                <p className="text-xs font-semibold text-gray-900">Referidos verificados</p>
              </div>
              <p className="text-sm font-bold text-green-600">
                {user.referidos_verificados || 0}/5
              </p>
            </div>
            <div className="w-full bg-green-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all"
                style={{ width: `${Math.min((user.referidos_verificados || 0) * 20, 100)}%` }}
              />
            </div>
            {user.referidos_verificados !== undefined && user.referidos_verificados < 5 && (
              <p className="text-xs text-gray-600 mt-2">
                {5 - (user.referidos_verificados || 0)} más para ganar 14 días Smart
              </p>
            )}
            {user.referidos_verificados !== undefined && user.referidos_verificados >= 5 && (
              <p className="text-xs text-green-600 mt-2 font-semibold">
                ¡Ya ganaste 14 días Smart! 🎉
              </p>
            )}
          </div>
        )}
        
        {/* Mostrar código de referido si está verificado */}
        {user?.whatsapp_verificado && user?.codigo_referido && (
          <div className="mb-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <UserIcon size={16} className="text-green-600" />
                <p className="text-xs font-semibold text-gray-900">Tu código de referido</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2 bg-white border border-green-300 rounded-lg text-sm font-mono font-bold text-gray-900 text-center">
                {user.codigo_referido}
              </code>
              <button
                onClick={async () => {
                  if (user.codigo_referido) {
                    try {
                      await navigator.clipboard.writeText(user.codigo_referido);
                      showToastMessage('✅ Código copiado al portapapeles');
                    } catch (error) {
                      logger.error('Error copiando código:', error);
                    }
                  }
                }}
                className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all"
                title="Copiar código"
              >
                <Copy size={16} />
              </button>
          </div>
            <p className="text-xs text-gray-600 mt-2">
              Comparte este código con tus amigos para que se registren y ambos ganen beneficios
            </p>
        </div>
        )}
        
        {/* Botón de referir (aparece siempre después de verificar WhatsApp) */}
        {user?.whatsapp_verificado && (
          <button
            onClick={() => router.push('/referrals')}
            className="w-full mb-3 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2"
          >
            <UserIcon size={16} />
            <span>Referir amigos</span>
          </button>
        )}
        
        {/* Mensaje si no está verificado */}
        {!user?.whatsapp_verificado && (
          <p className="text-xs text-gray-500 text-center mb-3">
            Verifica tu WhatsApp para poder referir amigos y ganar 14 días Smart
          </p>
        )}
        
        {/* Características del plan */}
        <div className="grid grid-cols-2 gap-2 text-xs pt-3 border-t border-gray-200">
          <div className={`flex items-center gap-2 ${
            userSubscription === 'pro' || userSubscription === 'smart' ? 'text-green-600' : 'text-gray-500'
          }`}>
            <span>{userSubscription === 'pro' || userSubscription === 'smart' ? '✅' : '❌'}</span>
            <span>Deudas y Metas</span>
          </div>
          <div className={`flex items-center gap-2 ${
            userSubscription === 'pro' || userSubscription === 'smart' ? 'text-green-600' : 'text-gray-500'
          }`}>
            <span>{userSubscription === 'pro' || userSubscription === 'smart' ? '✅' : '❌'}</span>
            <span>Transacciones</span>
          </div>
          <div className={`flex items-center gap-2 ${
            userSubscription === 'pro' ? 'text-green-600' : 'text-gray-500'
          }`}>
            <span>{userSubscription === 'pro' ? '✅' : '❌'}</span>
            <span>Múltiples deudas</span>
          </div>
          <div className={`flex items-center gap-2 ${
            userSubscription === 'pro' ? 'text-green-600' : 'text-gray-500'
          }`}>
            <span>{userSubscription === 'pro' ? '✅' : '❌'}</span>
            <span>Sin esperas</span>
          </div>
        </div>
      </div>

      {/* Botón de Menús Disponibles */}
      <button
        onClick={() => {
          setShowMenusModal(true);
          setModalOpen(true);
        }}
        className="w-full bg-white rounded-3xl p-6 mb-4 shadow-sm border border-gray-100 hover:shadow-md transition-all text-left"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-indigo-100">
              <LayoutGrid size={24} className="text-indigo-600" />
            </div>
            <div>
          <h3 className="text-sm font-bold text-gray-900">Menús Disponibles</h3>
              <p className="text-xs text-gray-500">Activa o desactiva los menús que deseas ver</p>
        </div>
          </div>
          <Edit2 size={18} className="text-gray-400" />
        </div>
      </button>

      {/* Botón de Notificaciones */}
      <button
        onClick={() => {
          setShowNotificationsModal(true);
          setModalOpen(true);
        }}
        className="w-full bg-white rounded-3xl p-6 mb-4 shadow-sm border border-gray-100 hover:shadow-md transition-all text-left"
      >
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              notificationPreferences.push_enabled ? 'bg-indigo-100' : 'bg-gray-200'
              }`}>
              <Bell size={24} className={notificationPreferences.push_enabled ? 'text-indigo-600' : 'text-gray-400'} />
              </div>
              <div>
              <h3 className="text-sm font-bold text-gray-900">Notificaciones</h3>
              <p className="text-xs text-gray-500">Controla qué notificaciones deseas recibir</p>
              </div>
            </div>
          <Edit2 size={18} className="text-gray-400" />
          </div>
      </button>

      {/* Ayuda / soporte */}
      <div className="bg-blue-50 rounded-3xl p-4 mb-4 border border-blue-200">
            <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-100">
            <LifeBuoy size={20} className="text-blue-600" />
              </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-blue-900">¿Necesitas ayuda?</h4>
            <p className="text-xs text-blue-700">
              Si tienes dudas con los planes, pagos, algún problema o quieres sugerir una mejora, contáctanos por WhatsApp y te asistimos.
            </p>
              </div>
            </div>
            <button
          onClick={() => {
            const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_SUPPORT || '+59161600190';
            const message = encodeURIComponent('Hola, necesito ayuda con mi cuenta de Ahorro365, tengo un problema o quiero sugerir una mejora');
            window.open(`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${message}`, '_blank');
          }}
          className="mt-3 w-full py-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm font-semibold hover:opacity-90 transition-all flex items-center justify-center gap-2"
        >
          <span>Contactar Soporte</span>
            </button>
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
              <UserIcon size={32} className="text-green-600" />
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
              <UserIcon size={32} className="text-blue-600" />
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

      {/* Modal de Cambiar Contraseña */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
            {/* Icono */}
            <div className="w-16 h-16 rounded-full bg-red-100 mx-auto mb-4 flex items-center justify-center">
              <Lock size={32} className="text-red-600" />
            </div>

            {/* Título */}
            <h3 className="text-2xl font-bold text-gray-900 text-center mb-2">
              Cambiar Contraseña
            </h3>

            {/* Mensaje */}
            <p className="text-gray-600 text-center mb-6">
              Ingresa tu contraseña actual y la nueva contraseña
            </p>

            {/* Input Contraseña Actual */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                Contraseña Actual
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Ingresa tu contraseña actual"
                  className="w-full px-4 py-3 pr-12 rounded-xl bg-gray-50 border-2 border-gray-200 focus:border-red-500 focus:outline-none text-gray-900 modal-input"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Input Nueva Contraseña */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                Nueva Contraseña
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full px-4 py-3 pr-12 rounded-xl bg-gray-50 border-2 border-gray-200 focus:border-red-500 focus:outline-none text-gray-900 modal-input"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Input Confirmar Contraseña */}
            <div className="mb-6">
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                Confirmar Nueva Contraseña
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirma tu nueva contraseña"
                  className="w-full px-4 py-3 pr-12 rounded-xl bg-gray-50 border-2 border-gray-200 focus:border-red-500 focus:outline-none text-gray-900 modal-input"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Botones */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setModalOpen(false);
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                }}
                className="flex-1 py-3.5 px-4 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleChangePassword}
                className="flex-1 py-3.5 px-4 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg"
              >
                Cambiar
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

      {/* Modal de Actualización de Plan */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-scale-in">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 mx-auto mb-4 flex items-center justify-center">
                <span className="text-white text-2xl">💎</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Actualizar Plan
              </h3>
              <p className="text-gray-600 text-xs">
                Elige cómo quieres actualizar a Pro
              </p>
            </div>

            {/* Características Pro */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 mb-6 border border-purple-200">
              <h4 className="font-semibold text-gray-900 mb-3 text-center">✨ Plan Pro - $3.00 USD/mes</h4>
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2 text-green-700">
                  <span>✅</span>
                  <span>5 Deudas, 5 Metas</span>
                </div>
                <div className="flex items-center gap-2 text-green-700">
                  <span>✅</span>
                  <span>20 transacciones/día</span>
                </div>
                <div className="flex items-center gap-2 text-green-700">
                  <span>✅</span>
                  <span>Categorías Personalizadas</span>
                </div>
                <div className="flex items-center gap-2 text-green-700">
                  <span>✅</span>
                  <span>Registra transacciones por WhatsApp</span>
                </div>
                <div className="flex items-center gap-2 text-green-700">
                  <span>✅</span>
                  <span>Asistente de IA para finanzas</span>
                </div>
                <div className="flex items-center gap-2 text-green-700">
                  <span>✅</span>
                  <span>Historial completo con comprobantes</span>
                </div>
                <div className="flex items-center gap-2 text-green-700">
                  <span>✅</span>
                  <span>Backup automático en la nube</span>
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
                onClick={() => {
                  setShowUpgradeModal(false);
                  setModalOpen(false);
                  router.push('/billing/payment-methods');
                }}
                className="flex-1 py-3.5 px-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg"
              >
                💳 Comprar Plan Pro
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Cambio de Teléfono */}
      <PhoneChangeModal
        isOpen={showPhoneChangeModal}
        onClose={() => {
          setShowPhoneChangeModal(false);
          setModalOpen(false);
          // Verificar cambio pendiente después de cerrar modal
          setTimeout(() => checkPendingPhoneChange(), 100);
        }}
        onSuccess={async () => {
          // Recargar datos del usuario después del cambio exitoso
          try {
            const updatedUser = await fetchUserData();
            // Usar el usuario retornado directamente en lugar del estado (que puede no haberse actualizado aún)
            if (updatedUser) {
              setUserPhone(updatedUser.telefono || '');
            }
            // Limpiar estado de cambio pendiente
            setPhoneChangePending(null);
            setShowToast(true);
            setToastMessage('✅ Teléfono cambiado exitosamente');
          } catch (error) {
            logger.error('Error refrescando datos después de cambio:', error);
          }
        }}
      />

      {/* Modal de Verificación WhatsApp */}
      <WhatsAppVerificationModal
        isOpen={showWhatsAppModal}
        onClose={handleWhatsAppModalClose}
        onVerify={async () => {
          // Refrescar datos del usuario después de verificar
          try {
            await fetchUserData();
            setShowToast(true);
            setToastMessage('✅ WhatsApp verificado correctamente');
          } catch (error) {
            logger.error('Error refrescando datos después de verificación:', error);
          }
        }}
      />

      {/* Modal de Menús Disponibles */}
      {showMenusModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl animate-scale-in max-h-[85vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4 flex-shrink-0">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-indigo-100">
                <LayoutGrid size={24} className="text-indigo-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900">Menús Disponibles</h3>
                <p className="text-xs text-gray-500">Activa o desactiva los menús que deseas ver</p>
              </div>
            </div>

            {/* Contenido - scrolleable */}
            <div className="flex-1 overflow-y-auto mb-4 scrollbar-hide">
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

            {/* Botón de cerrar - fijo al fondo */}
            <div className="flex-shrink-0 pt-4 border-t border-gray-100">
              <button
                onClick={() => {
                  setShowMenusModal(false);
                  setModalOpen(false);
                }}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Notificaciones */}
      {showNotificationsModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl animate-scale-in max-h-[85vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4 flex-shrink-0">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                notificationPreferences.push_enabled ? 'bg-indigo-100' : 'bg-gray-200'
              }`}>
                <Bell size={24} className={notificationPreferences.push_enabled ? 'text-indigo-600' : 'text-gray-400'} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900">Notificaciones</h3>
                <p className="text-xs text-gray-500">Controla qué notificaciones deseas recibir</p>
              </div>
            </div>

            {/* Contenido - scrolleable */}
            <div className="flex-1 overflow-y-auto mb-4 scrollbar-hide">
              <div className="space-y-3">
                {/* Toggle Notificaciones Push (General) */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      notificationPreferences.push_enabled ? 'bg-indigo-100' : 'bg-gray-200'
                    }`}>
                      <Bell size={24} className={notificationPreferences.push_enabled ? 'text-indigo-600' : 'text-gray-400'} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Notificaciones Push</p>
                      <p className="text-xs text-gray-500">Activar todas las notificaciones</p>
                    </div>
                  </div>
                  <button
                    onClick={() => updateNotificationPreference('push_enabled', !notificationPreferences.push_enabled)}
                    disabled={loadingPreferences}
                    className={`relative w-14 h-7 rounded-full transition-all ${
                      notificationPreferences.push_enabled ? 'bg-indigo-500' : 'bg-gray-300'
                    } ${loadingPreferences ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-all ${
                      notificationPreferences.push_enabled ? 'right-1' : 'left-1'
                    }`} />
                  </button>
                </div>

                {/* Toggle Alertas de Transacciones */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      notificationPreferences.transaction_enabled ? 'bg-green-100' : 'bg-gray-200'
                    }`}>
                      <DollarSign size={24} className={notificationPreferences.transaction_enabled ? 'text-green-600' : 'text-gray-400'} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Alertas de Transacciones</p>
                      <p className="text-xs text-gray-500">Notificaciones de ingresos y gastos</p>
                    </div>
                  </div>
                  <button
                    onClick={() => updateNotificationPreference('transaction_enabled', !notificationPreferences.transaction_enabled)}
                    disabled={loadingPreferences || !notificationPreferences.push_enabled}
                    className={`relative w-14 h-7 rounded-full transition-all ${
                      notificationPreferences.transaction_enabled && notificationPreferences.push_enabled ? 'bg-green-500' : 'bg-gray-300'
                    } ${loadingPreferences || !notificationPreferences.push_enabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-all ${
                      notificationPreferences.transaction_enabled && notificationPreferences.push_enabled ? 'right-1' : 'left-1'
                    }`} />
                  </button>
                </div>

                {/* Toggle Recordatorios */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      notificationPreferences.reminder_enabled ? 'bg-yellow-100' : 'bg-gray-200'
                    }`}>
                      <Calendar size={24} className={notificationPreferences.reminder_enabled ? 'text-yellow-600' : 'text-gray-400'} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Recordatorios</p>
                      <p className="text-xs text-gray-500">Recordatorios de pagos y metas</p>
                    </div>
                  </div>
                  <button
                    onClick={() => updateNotificationPreference('reminder_enabled', !notificationPreferences.reminder_enabled)}
                    disabled={loadingPreferences || !notificationPreferences.push_enabled}
                    className={`relative w-14 h-7 rounded-full transition-all ${
                      notificationPreferences.reminder_enabled && notificationPreferences.push_enabled ? 'bg-yellow-500' : 'bg-gray-300'
                    } ${loadingPreferences || !notificationPreferences.push_enabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-all ${
                      notificationPreferences.reminder_enabled && notificationPreferences.push_enabled ? 'right-1' : 'left-1'
                    }`} />
                  </button>
                </div>

                {/* Toggle Marketing */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      notificationPreferences.marketing_enabled ? 'bg-purple-100' : 'bg-gray-200'
                    }`}>
                      <Target size={24} className={notificationPreferences.marketing_enabled ? 'text-purple-600' : 'text-gray-400'} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Marketing y Promociones</p>
                      <p className="text-xs text-gray-500">Ofertas y novedades</p>
                    </div>
                  </div>
                  <button
                    onClick={() => updateNotificationPreference('marketing_enabled', !notificationPreferences.marketing_enabled)}
                    disabled={loadingPreferences || !notificationPreferences.push_enabled}
                    className={`relative w-14 h-7 rounded-full transition-all ${
                      notificationPreferences.marketing_enabled && notificationPreferences.push_enabled ? 'bg-purple-500' : 'bg-gray-300'
                    } ${loadingPreferences || !notificationPreferences.push_enabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-all ${
                      notificationPreferences.marketing_enabled && notificationPreferences.push_enabled ? 'right-1' : 'left-1'
                    }`} />
                  </button>
                </div>
              </div>
            </div>

            {/* Botón de cerrar - fijo al fondo */}
            <div className="flex-shrink-0 pt-4 border-t border-gray-100">
              <button
                onClick={() => {
                  setShowNotificationsModal(false);
                  setModalOpen(false);
                }}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast de Notificación */}
      {showToast && (
        <div className="fixed top-[60px] left-1/2 -translate-x-1/2 z-50 animate-fade-in">
          <div className="bg-gray-900 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-sm">
            <span>{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
}
