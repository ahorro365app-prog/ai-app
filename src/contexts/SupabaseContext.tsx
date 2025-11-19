"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { getTodayForCountry, buildISODateForCountry } from '@/lib/dateUtils';

interface User {
  id: string;
  nombre: string;
  correo?: string;
  telefono?: string;
  contrasena?: string;
  pais: string;
  moneda: string;
  presupuesto_diario?: number;
  suscripcion: string;
  deudas_habilitado: boolean;
  metas_habilitado: boolean;
  codigo_referido?: string; // Fase 1: Código de referido del usuario
  referido_de?: string; // ID del usuario que lo refirió
  referidos_verificados?: number; // Contador de referidos que han verificado WhatsApp
  ha_ganado_smart?: boolean; // Si ya ganó el plan Smart una vez (solo se puede ganar una vez)
  smart_fecha_inicio_programada?: string | null; // Fecha programada para activar Smart (cuando tiene FREE/PRO activo)
  has_seen_onboarding?: boolean; // Indica si el usuario ya vio el tutorial de onboarding
}

interface Transaction {
  id: string;
  tipo: 'ingreso' | 'gasto';
  monto: number;
  categoria: string;
  descripcion?: string;
  fecha: string;
  url_comprobante?: string;
}

interface Debt {
  id: string;
  nombre: string;
  monto_total: number;
  monto_pagado: number;
  fecha_vencimiento?: string;
  es_mensual: boolean;
  dia_mensual?: number;
  historial_pagos: any[];
}

interface Goal {
  id: string;
  nombre: string;
  monto_objetivo: number;
  monto_actual: number;
  fecha_objetivo?: string;
  categoria: string;
  prioridad: string;
  descripcion?: string;
  historial_ahorros: any[];
}

interface SupabaseContextType {
  user: User | null;
  transactions: Transaction[];
  debts: Debt[];
  goals: Goal[];
  loading: boolean;
  error: string | null;
  
  // User methods
  createUser: (userData: { nombre: string; telefono: string; contrasena: string; moneda: string }) => Promise<{ success: boolean; error?: string }>;
  signInWithPhone: (phone: string, password: string) => Promise<{ success: boolean; error?: string }>;
  updateUser: (userData: Partial<User>) => Promise<void>;
  fetchUserData: () => Promise<void>;
  logout: () => void;
  
  // Transaction methods
  addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<void>;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  supabaseTransactions: Transaction[];
  deleteSupabaseTransaction: (id: string) => Promise<void>;
  updateSupabaseTransaction: (id: string, transaction: Partial<Transaction>) => Promise<void>;
  getAllMovements: () => any[];
  getTodayMovements: () => any[];
  getTodayDeletedCount: () => Promise<number>;
  
  // Debt methods
  addDebt: (debt: Omit<Debt, 'id'>) => Promise<void>;
  updateDebt: (id: string, debt: Partial<Debt>) => Promise<void>;
  deleteDebt: (id: string) => Promise<void>;
  deleteAllDebts: () => Promise<void>;
  
  // Goal methods
  addGoal: (goal: Omit<Goal, 'id'>) => Promise<void>;
  updateGoal: (id: string, goal: Partial<Goal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  deleteAllGoals: () => Promise<void>;
  uploadReceipt: (file: File, userId: string) => Promise<string>;
  deleteReceipt: (fileName: string) => Promise<void>;
  extractReceiptFileName: (receiptUrl: string) => string | null;
  
  // Referral methods
  getReferidos: () => Promise<any[]>;
  
  // WhatsApp verification methods
  sendWhatsAppVerificationCode: (phone: string) => Promise<{ success: boolean; error?: string }>;
  verifyWhatsAppCode: (phone: string, code: string) => Promise<{ success: boolean; error?: string }>;
  
  // Phone change methods
  checkCanChangePhone: () => Promise<{ canChange: boolean; reason?: string; daysRemaining?: number }>;
  initiatePhoneChange: (newPhone: string) => Promise<{ success: boolean; error?: string }>;
  verifyPhoneChange: (code: string) => Promise<{ success: boolean; error?: string }>;
  cancelPhoneChange: () => Promise<{ success: boolean; error?: string }>;
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined);

export const useSupabase = () => {
  const context = useContext(SupabaseContext);
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
};

interface SupabaseProviderProps {
  children: ReactNode;
}

export const SupabaseProvider = ({ children }: SupabaseProviderProps) => {
  logger.debug('🚀 SupabaseProvider: Componente inicializado');
  
  const [user, setUser] = useState<User | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  logger.debug('📊 SupabaseProvider: Estado inicial:', {
    hasUser: !!user,
    loading,
    transactionsCount: transactions.length,
    debtsCount: debts.length,
    goalsCount: goals.length
  });

  // Cargar usuario guardado al inicializar
  useEffect(() => {
    const loadSavedUser = async () => {
      logger.debug('🔄 SupabaseContext: Iniciando carga de usuario...');
      try {
        const savedUser = localStorage.getItem('currentUser');
        logger.debug('💾 SupabaseContext: Usuario en localStorage:', !!savedUser);
        
        if (savedUser) {
          const userData = JSON.parse(savedUser);
          logger.debug('✅ SupabaseContext: Usuario parseado:', {
            id: userData.id,
            nombre: userData.nombre,
            telefono: userData.telefono
          });
          setUser(userData);
          
          // Cargar datos del usuario
          logger.debug('📊 SupabaseContext: Cargando datos del usuario...');
          await loadUserData(userData);
          logger.debug('✅ SupabaseContext: Datos del usuario cargados');
        } else {
          logger.debug('⚠️ SupabaseContext: No hay usuario en localStorage');
        }
      } catch (error) {
        logger.error('❌ SupabaseContext: Error cargando usuario guardado:', error);
        localStorage.removeItem('currentUser');
      } finally {
        logger.debug('🏁 SupabaseContext: Finalizando carga, estableciendo loading=false');
        setLoading(false);
      }
    };

    loadSavedUser();
  }, []);

  // Cargar datos iniciales - REMOVIDO: ahora usamos persistencia de sesión

  // Función loadInitialData removida - ahora usamos persistencia de sesión

  // Función para migrar categorías de transacciones existentes
  const migrateTransactionCategories = async (transactions: Transaction[]): Promise<Transaction[]> => {
    logger.debug('🔧 Iniciando migración de categorías en transacciones de Supabase...');
    
    // Mapeo de IDs antiguos (inglés) a nuevos (español)
    const categoryIdMapping: Record<string, string> = {
      // Gastos básicos
      'food': 'comida',
      'transport': 'transporte',
      'entertainment': 'entretenimiento',
      'shopping': 'compras',
      'health': 'salud',
      'bills': 'servicios',
      'other': 'otro',
      
      // Ingresos básicos
      'salary': 'salario',
      'investment': 'inversion',
      'gift': 'regalo',
      
      // Ingresos extendidos
      'sale': 'venta',
      'bonus': 'bono',
      'freelance': 'freelance',
      'business': 'negocio',
      'dividend': 'dividendos',
      'rental': 'renta',
      'refund': 'reembolso',
      'gift-income': 'regalo',
      'prize': 'premio',
      'scholarship': 'beca',
      
      // Gastos extendidos
      'restaurant': 'restaurante',
      'groceries': 'supermercado',
      'coffee': 'cafe',
      'fast-food': 'comida-rapida',
      'bus': 'autobus',
      'gas': 'gasolina',
      'parking': 'estacionamiento',
      'cinema': 'cine',
      'concert': 'concierto',
      'sports': 'deportes',
      'games': 'videojuegos',
      'clothes': 'ropa',
      'shoes': 'calzado',
      'electronics': 'electronica',
      'furniture': 'muebles',
      'doctor': 'medico',
      'pharmacy': 'farmacia',
      'gym': 'gimnasio',
      'beauty': 'belleza',
      'electricity': 'luz',
      'water': 'agua',
      'phone': 'telefono',
      'rent': 'alquiler',
      'insurance': 'seguro',
      'education': 'educacion',
      'books': 'libros',
      'gifts': 'regalos',
      'donations': 'donaciones',
      'pets': 'mascotas',
      'travel': 'viajes',
      'subscriptions': 'suscripciones'
    };
    
    const transactionsToUpdate: Transaction[] = [];
    
    // Procesar cada transacción
    transactions.forEach(tx => {
      if (categoryIdMapping[tx.categoria]) {
        logger.debug(`🔄 Migrando transacción ${tx.id}: ${tx.categoria} → ${categoryIdMapping[tx.categoria]}`);
        transactionsToUpdate.push({
          ...tx,
          categoria: categoryIdMapping[tx.categoria]
        });
      }
    });
    
    // Actualizar transacciones en Supabase si hay cambios
    if (transactionsToUpdate.length > 0) {
      logger.debug(`📝 Actualizando ${transactionsToUpdate.length} transacciones en Supabase...`);
      
      try {
        for (const tx of transactionsToUpdate) {
          const { error } = await supabase
            .from('transacciones')
            .update({ categoria: tx.categoria })
            .eq('id', tx.id);
          
          if (error) {
            logger.error(`❌ Error actualizando transacción ${tx.id}:`, error);
          } else {
            logger.debug(`✅ Transacción ${tx.id} actualizada exitosamente`);
          }
        }
      } catch (error) {
        logger.error('❌ Error durante la migración de transacciones:', error);
      }
    } else {
      logger.debug('ℹ️ No hay transacciones que migrar');
    }
    
    // Devolver las transacciones con categorías migradas
    return transactions.map(tx => {
      const updatedTx = transactionsToUpdate.find(utx => utx.id === tx.id);
      return updatedTx || tx;
    });
  };

  // Función para cargar datos de un usuario específico
  const loadUserData = async (userData: User) => {
    logger.debug('📊 loadUserData: Iniciando carga de datos para usuario:', userData.id);
    try {
      setError(null);

      // Cargar transacciones (excluir eliminadas - solo activas)
      logger.debug('📊 loadUserData: Cargando transacciones...');
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transacciones')
        .select('*')
        .eq('usuario_id', userData.id)
        .is('fecha_eliminacion', null) // Solo transacciones activas (no eliminadas)
        .order('fecha', { ascending: false });

      if (transactionsError) {
        logger.error('❌ loadUserData: Error cargando transacciones:', transactionsError);
        throw transactionsError;
      }
      logger.debug('✅ loadUserData: Transacciones cargadas:', transactionsData?.length || 0);
      
      // Migrar categorías de transacciones existentes
      const migratedTransactions = await migrateTransactionCategories(transactionsData || []);
      setTransactions(migratedTransactions);
      logger.debug('✅ loadUserData: Transacciones migradas y establecidas en estado');

      // Cargar deudas
      logger.debug('📊 loadUserData: Cargando deudas...');
      const { data: debtsData, error: debtsError } = await supabase
        .from('deudas')
        .select('*')
        .eq('usuario_id', userData.id)
        .order('fecha_creacion', { ascending: false });

      if (debtsError) {
        logger.error('❌ loadUserData: Error cargando deudas:', debtsError);
        throw debtsError;
      }
      setDebts(debtsData || []);
      logger.debug('✅ loadUserData: Deudas cargadas:', debtsData?.length || 0);

      // Cargar metas
      logger.debug('📊 loadUserData: Cargando metas...');
      const { data: goalsData, error: goalsError } = await supabase
        .from('metas')
        .select('*')
        .eq('usuario_id', userData.id)
        .order('fecha_creacion', { ascending: false });

      if (goalsError) {
        logger.error('❌ loadUserData: Error cargando metas:', goalsError);
        throw goalsError;
      }
      setGoals(goalsData || []);
      logger.debug('✅ loadUserData: Metas cargadas:', goalsData?.length || 0);
      
      logger.debug('✅ loadUserData: Todos los datos cargados exitosamente');

    } catch (err: any) {
      logger.error('❌ loadUserData: Error loading user data:', err);
      logger.error('❌ loadUserData: Error details:', {
        message: err.message,
        code: err.code,
        details: err.details,
        hint: err.hint
      });
      setError(err.message || 'Error desconocido al cargar datos del usuario');
    }
  };

  // User methods
  const createUser = async (userData: { 
    nombre: string; 
    telefono: string; 
    contrasena: string; 
    moneda: string;
    codigoReferidoUsado?: string; // Fase 2: Código de referido opcional
  }) => {
    try {
      // Verificar si el teléfono ya existe
      const { data: existingUser, error: checkError } = await supabase
        .from('usuarios')
        .select('id')
        .eq('telefono', userData.telefono)
        .maybeSingle();

      if (existingUser) {
        return {
          success: false,
          error: 'El número de celular ya está registrado. Intenta con otro número.'
        };
      }

      // Crear nuevo usuario
      const { data, error } = await supabase
        .from('usuarios')
        .insert([{
          nombre: userData.nombre,
          telefono: userData.telefono,
          contrasena: userData.contrasena, // En producción, esto debería estar hasheado
          moneda: userData.moneda,
          pais: 'BO', // Por defecto Bolivia
          suscripcion: 'free',
          deudas_habilitado: false, // Desactivado por defecto
          metas_habilitado: false,   // Desactivado por defecto
          has_seen_onboarding: false // Por defecto no ha visto el tutorial
        }])
        .select()
        .single();

      if (error) {
        logger.error('Error creando usuario:', error);
        return {
          success: false,
          error: 'Error al crear la cuenta. Verifica tus datos e intenta nuevamente.'
        };
      }

      // Fase 2: Procesar código de referido si se proporcionó
      if (data && userData.codigoReferidoUsado && userData.codigoReferidoUsado.trim()) {
        try {
          const codigoReferidoUsado = userData.codigoReferidoUsado.trim().toUpperCase();
          logger.debug('🎁 Procesando código de referido:', codigoReferidoUsado);

          // 1. Buscar usuario con ese código de referido (asegurar mayúsculas)
          const { data: referidor, error: referidorError } = await supabase
            .from('usuarios')
            .select('id, codigo_referido')
            .eq('codigo_referido', codigoReferidoUsado.toUpperCase())
            .single();

          if (referidorError || !referidor) {
            logger.warn('⚠️ Código de referido no encontrado o inválido:', codigoReferidoUsado);
            // No fallar el registro si el código es inválido, solo loguear
          } else if (referidor.id === data.id) {
            logger.warn('⚠️ No se puede usar el propio código de referido');
            // No fallar el registro si intenta usar su propio código
          } else {
            logger.debug('✅ Referidor encontrado:', referidor.id);

            // 2. Asignar referido_de al nuevo usuario
            const { error: updateError } = await supabase
              .from('usuarios')
              .update({ referido_de: referidor.id })
              .eq('id', data.id);

            if (updateError) {
              logger.error('⚠️ Error asignando referido_de (no crítico):', updateError);
              // No fallar el registro si esto falla
            } else {
              logger.debug('✅ referido_de asignado correctamente');

              // 3. Crear registro en tabla referidos
              const { data: nuevoReferido, error: referidoError } = await supabase
                .from('referidos')
                .insert({
                  referidor_id: referidor.id,
                  referido_id: data.id,
                  codigo_usado: codigoReferidoUsado.toUpperCase(), // Asegurar mayúsculas
                  fecha_registro: new Date().toISOString(),
                  verifico_whatsapp: false // Se actualizará cuando verifique WhatsApp
                })
                .select()
                .single();

              if (referidoError) {
                logger.error('⚠️ Error creando registro en referidos (no crítico):', referidoError);
                // No fallar el registro si esto falla
              } else {
                logger.debug('✅ Registro en referidos creado exitosamente:', nuevoReferido?.id);
                
                // Fase 3: Invocar trigger referral-invited después de crear referido
                if (nuevoReferido?.id) {
                  try {
                    logger.debug(`🔔 Invocando trigger referral-invited para referido: ${nuevoReferido.id}`);
                    const triggerResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/notifications/triggers/referral-invited`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({ referralId: nuevoReferido.id }),
                    });

                    if (triggerResponse.ok) {
                      const triggerData = await triggerResponse.json();
                      logger.debug('✅ Trigger referral-invited ejecutado:', triggerData);
                    } else {
                      logger.warn('⚠️ Error invocando trigger referral-invited (no crítico):', await triggerResponse.text());
                    }
                  } catch (triggerError: any) {
                    logger.warn('⚠️ Error invocando trigger referral-invited (no crítico):', triggerError?.message);
                    // No fallar el registro si el trigger falla
                  }
                }
              }
            }
          }
        } catch (refError: any) {
          logger.error('⚠️ Error procesando código de referido (no crítico):', refError);
          // No fallar el registro si esto falla
        }
      }

      setUser(data);
      return { success: true };
    } catch (err: any) {
      logger.error('Error en createUser:', err);
      return {
        success: false,
        error: 'Error de conexión. Verifica tu internet e intenta nuevamente.'
      };
    }
  };

  const signInWithPhone = async (phone: string, password: string) => {
    try {
      // 1. Verificar credenciales en tu tabla personalizada
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('telefono', phone)
        .eq('contrasena', password)
        .single();

      if (error || !data) {
        return {
          success: false,
          error: 'Credenciales incorrectas. Verifica tu teléfono y contraseña.'
        };
      }

      // 2. Crear sesión de autenticación en Supabase usando el email o phone
      const authEmail = data.correo || `${phone}@temp.com`;
      
      // Intentar hacer sign in con Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: authEmail,
        password: password // Usar la misma contraseña
      });

      // Si no existe el usuario en Supabase Auth, crearlo
      if (authError && authError.message.includes('Invalid login credentials')) {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: authEmail,
          password: password,
          options: {
            data: {
              phone: phone,
              name: data.nombre
            }
          }
        });

        if (signUpError) {
          logger.warn('No se pudo crear sesión de auth en Supabase:', signUpError);
          // Continuar sin auth de Supabase
        } else {
          logger.debug('Usuario creado en Supabase Auth:', signUpData);
        }
      } else if (authError) {
        logger.warn('Error en autenticación Supabase:', authError);
        // Continuar sin auth de Supabase
      } else {
        logger.debug('Autenticado en Supabase:', authData);
      }

      // 3. Establecer el usuario en el estado
      setUser(data);
      
      // Guardar usuario en localStorage para persistencia
      localStorage.setItem('currentUser', JSON.stringify(data));
      
      // Cargar datos del usuario
      await loadUserData(data);
      
      return { success: true };
    } catch (err: any) {
      logger.error('Error en signInWithPhone:', err);
      return {
        success: false,
        error: 'Error de conexión. Verifica tu internet e intenta nuevamente.'
      };
    }
  };

  const updateUser = async (userData: Partial<User>) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('usuarios')
        .update(userData)
        .eq('id', user.id);

      if (error) throw error;
      
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      
      // Actualizar localStorage
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  // Función para recargar datos del usuario desde Supabase
  const fetchUserData = async (): Promise<User | null> => {
    if (!user) {
      logger.warn('⚠️ fetchUserData: No hay usuario autenticado');
      return null;
    }

    try {
      logger.debug('🔄 fetchUserData: Recargando datos del usuario:', user.id);
      
      // 1. Obtener usuario actualizado desde Supabase
      const { data: updatedUser, error: userError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', user.id)
        .single();

      if (userError) {
        logger.error('❌ Error obteniendo usuario:', userError);
        throw userError;
      }

      if (!updatedUser) {
        logger.warn('⚠️ fetchUserData: Usuario no encontrado');
        return null;
      }

      // 2. Actualizar estado del usuario
      setUser(updatedUser as User);
      
      // 3. Actualizar localStorage
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));

      // 4. Recargar todos los datos asociados (transacciones, deudas, metas)
      await loadUserData(updatedUser as User);

      logger.debug('✅ fetchUserData: Datos recargados exitosamente');
      
      // 5. Retornar el usuario actualizado
      return updatedUser as User;
    } catch (err: any) {
      logger.error('❌ Error en fetchUserData:', err);
      setError(err.message || 'Error al recargar datos del usuario');
      // No lanzar el error, solo loguearlo para no romper el flujo
      return null;
    }
  };

  // Función para obtener todos los movimientos (transacciones + pagos de deudas + ahorros de metas)
  const getAllMovements = (): any[] => {
    const movements: any[] = [];
    
    // Agregar transacciones regulares (mantener contorno original)
    transactions.forEach(tx => {
      movements.push({
        ...tx,
        tipo_movimiento: 'transaccion',
        marco_color: '' // Sin marco de color para transacciones regulares
      });
    });
    
    // Agregar pagos de deudas
    debts.forEach(debt => {
      if (debt.historial_pagos && Array.isArray(debt.historial_pagos)) {
        debt.historial_pagos.forEach((payment: any) => {
          movements.push({
            id: `debt-${debt.id}-${payment.id || Date.now()}`,
            tipo: 'gasto' as const,
            monto: payment.amount || payment.monto,
            categoria: `Pago de deuda: ${debt.nombre}`,
            descripcion: '', // Sin descripción ya que la fecha se registra automáticamente
            fecha: payment.date || payment.fecha,
            metodo_pago: payment.paymentMethod || 'cash',
            tipo_movimiento: 'pago_deuda',
            marco_color: 'border-orange-200 bg-orange-50',
            deuda_info: {
              id: debt.id,
              nombre: debt.nombre,
              tipo: 'deuda'
            }
          });
        });
      }
    });
    
    // Agregar ahorros de metas
    goals.forEach(goal => {
      if (goal.historial_ahorros && Array.isArray(goal.historial_ahorros)) {
        goal.historial_ahorros.forEach((saving: any) => {
          movements.push({
            id: `goal-${goal.id}-${saving.id || Date.now()}`,
            tipo: 'ingreso' as const,
            monto: saving.amount || saving.monto,
            categoria: `Ahorro para meta: ${goal.nombre}`,
            descripcion: '', // Sin descripción ya que la fecha se registra automáticamente
            fecha: saving.date || saving.fecha,
            metodo_pago: saving.paymentMethod || 'cash',
            tipo_movimiento: 'ahorro_meta',
            marco_color: 'border-purple-200 bg-purple-50',
            meta_info: {
              id: goal.id,
              nombre: goal.nombre,
              tipo: 'meta'
            }
          });
        });
      }
    });
    
    // Ordenar por fecha (más recientes primero)
    return movements.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  };

  // Función para obtener movimientos de hoy (solo activos, excluye eliminadas)
  const getTodayMovements = (): any[] => {
    // Obtener la fecha de hoy en la zona horaria del país del usuario
    const userCountry = user?.pais || 'BO'; // Default a Bolivia
    
    // Obtener fecha de hoy en formato YYYY-MM-DD en la zona horaria del país
    const todayString = getTodayForCountry(userCountry);
    const [todayYear, todayMonth, todayDay] = todayString.split('-').map(Number);
    
    // Crear fechas de inicio y fin del día en UTC, pero interpretadas en la zona horaria del país
    // Usar buildISODateForCountry para construir correctamente las fechas
    const todayStartISO = buildISODateForCountry(todayYear, todayMonth, todayDay, 0, 0, 0, userCountry);
    const todayEndISO = buildISODateForCountry(todayYear, todayMonth, todayDay + 1, 0, 0, 0, userCountry);
    
    const todayStart = new Date(todayStartISO);
    const todayEnd = new Date(todayEndISO);
    
    logger.debug('📅 Filtro de fechas (zona horaria del país):', {
      pais: userCountry,
      fechaHoy: todayString,
      todayStart: todayStart.toISOString(),
      todayEnd: todayEnd.toISOString(),
      todayStartLocal: todayStart.toLocaleString(),
      todayEndLocal: todayEnd.toLocaleString()
    });
    
    logger.debug('📊 Total transacciones en estado:', transactions.length);
    logger.debug('📊 Transacciones:', transactions.map(t => ({ id: t.id, tipo: t.tipo, monto: t.monto, fecha: t.fecha })));
    
    // getAllMovements ya excluye eliminadas porque transactions solo tiene activas
    const filtered = getAllMovements().filter(movement => {
      const movementDate = new Date(movement.fecha);
      const isInRange = movementDate >= todayStart && movementDate < todayEnd;
      
      if (isInRange) {
        logger.debug('✅ Movimiento de hoy:', {
          id: movement.id,
          fecha: movement.fecha,
          fechaLocal: movementDate.toLocaleString(),
          tipo: movement.tipo_movimiento
        });
      } else {
        logger.debug('❌ Movimiento NO es de hoy:', {
          id: movement.id,
          fecha: movement.fecha,
          fechaLocal: movementDate.toLocaleString(),
          tipo: movement.tipo_movimiento,
          esMenor: movementDate < todayStart,
          esMayor: movementDate >= todayEnd
        });
      }
      
      // Verificar que la fecha del movimiento esté entre 00:00:00 y 23:59:59 de hoy
      return isInRange;
    });
    
    logger.debug('📊 Total movimientos de hoy:', filtered.length);
    return filtered;
  };

  // Función para contar transacciones eliminadas HOY
  // Cuenta transacciones que fueron creadas HOY y eliminadas HOY
  const getTodayDeletedCount = async (): Promise<number> => {
    if (!user) return 0;

    try {
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

      // Contar transacciones que:
      // 1. Fueron creadas HOY (fecha está en el rango de hoy)
      // 2. Fueron eliminadas HOY (fecha_eliminacion está en el rango de hoy)
      const { count, error } = await supabase
        .from('transacciones')
        .select('*', { count: 'exact', head: true })
        .eq('usuario_id', user.id)
        .not('fecha_eliminacion', 'is', null) // Tiene fecha_eliminacion (fue eliminada)
        .gte('fecha', todayStart.toISOString()) // Creada HOY
        .lt('fecha', todayEnd.toISOString())
        .gte('fecha_eliminacion', todayStart.toISOString()) // Eliminada HOY
        .lt('fecha_eliminacion', todayEnd.toISOString());

      if (error) {
        logger.error('Error contando transacciones eliminadas:', error);
        return 0;
      }

      return count || 0;
    } catch (err: any) {
      logger.error('Error en getTodayDeletedCount:', err);
      return 0;
    }
  };

  const logout = () => {
    setUser(null);
    setTransactions([]);
    setDebts([]);
    setGoals([]);
    localStorage.removeItem('currentUser');
  };

  // Transaction methods
  const addTransaction = async (transaction: Omit<Transaction, 'id'>) => {
    if (!user) {
      logger.error('❌ addTransaction: No hay usuario autenticado');
      return;
    }
    
    try {
      logger.debug('💾 addTransaction: Iniciando guardado en Supabase');
      logger.debug('📊 Datos de transacción:', transaction);
      logger.debug('👤 Usuario ID:', user.id);
      
      // Validar límite diario de transacciones antes de insertar
      logger.debug('🔍 Validando límite diario de transacciones...');
      logger.debug('📊 Plan actual:', user.suscripcion || 'free');
      logger.debug('👤 Usuario ID:', user.id);
      
      const { validateCanCreateTransaction } = await import('@/lib/planLimits');
      const currentPlan = (user.suscripcion || 'free') as 'free' | 'smart' | 'pro' | 'caducado';
      const validation = await validateCanCreateTransaction(
        currentPlan,
        user.id,
        supabase
      );
      
      logger.debug('✅ Resultado de validación:', validation);
      
      if (!validation.valid) {
        logger.error('❌ Validación fallida:', validation.message);
        logger.error('❌ Error code:', validation.errorCode);
        const error = new Error(validation.message || 'No se puede crear la transacción');
        (error as any).errorCode = validation.errorCode;
        throw error;
      }
      
      logger.debug('✅ Validación exitosa, procediendo a insertar transacción');
      
      // Asegurar que la fecha esté en formato correcto con offset de zona horaria explícito
      // Esto es crítico para evitar problemas cuando la hora local es tarde (ej: después de 9 PM en Bolivia)
      // Si la fecha ya viene con offset (de buildISODateForCountry), usarla directamente
      // Si no, agregar el offset explícito
      let fechaFormateada = transaction.fecha;
      const userCountry = user.pais || 'BO'; // Default a Bolivia si no hay país
      
      if (transaction.fecha) {
        // Si la fecha ya tiene offset explícito (contiene + o - antes de los últimos 6 caracteres)
        // Ejemplo: 2025-11-18T23:01:00-04:00 o 2025-11-18T23:01:00+03:00
        const hasOffset = /[+-]\d{2}:\d{2}$/.test(transaction.fecha);
        
        if (!hasOffset) {
          // La fecha no tiene offset, necesitamos agregarlo
          const timeZone = userCountry === 'BO' ? 'America/La_Paz' : 
                           userCountry === 'AR' ? 'America/Argentina/Buenos_Aires' :
                           userCountry === 'BR' ? 'America/Sao_Paulo' :
                           userCountry === 'CL' ? 'America/Santiago' :
                           userCountry === 'CO' ? 'America/Bogota' :
                           userCountry === 'EC' ? 'America/Guayaquil' :
                           userCountry === 'PE' ? 'America/Lima' :
                           userCountry === 'PY' ? 'America/Asuncion' :
                           userCountry === 'UY' ? 'America/Montevideo' :
                           userCountry === 'VE' ? 'America/Caracas' :
                           userCountry === 'MX' ? 'America/Mexico_City' :
                           userCountry === 'US' ? 'America/New_York' :
                           'America/La_Paz';
          
          // Parsear la fecha
          const fechaDate = new Date(transaction.fecha);
          
          // Obtener las partes de la fecha en la zona horaria del país
          const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: timeZone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
          });
          
          const parts = formatter.formatToParts(fechaDate);
          const year = parts.find(p => p.type === 'year')?.value || '';
          const month = parts.find(p => p.type === 'month')?.value || '';
          const day = parts.find(p => p.type === 'day')?.value || '';
          const hour = parts.find(p => p.type === 'hour')?.value || '';
          const minute = parts.find(p => p.type === 'minute')?.value || '';
          const second = parts.find(p => p.type === 'second')?.value || '00';
          
          // Calcular offset usando una fecha de referencia
          const referenceDate = new Date('2025-01-01T12:00:00Z');
          const utcFormatter = new Intl.DateTimeFormat('en-US', {
            timeZone: 'UTC',
            hour: '2-digit',
            hour12: false,
          });
          const tzFormatter = new Intl.DateTimeFormat('en-US', {
            timeZone: timeZone,
            hour: '2-digit',
            hour12: false,
          });
          
          const utcHour = parseInt(utcFormatter.formatToParts(referenceDate).find(p => p.type === 'hour')?.value || '12', 10);
          const tzHour = parseInt(tzFormatter.formatToParts(referenceDate).find(p => p.type === 'hour')?.value || '12', 10);
          
          let offsetHours = tzHour - utcHour;
          if (offsetHours > 12) offsetHours -= 24;
          if (offsetHours < -12) offsetHours += 24;
          
          // Formatear offset
          const offsetSign = offsetHours >= 0 ? '+' : '-';
          const offsetStr = `${offsetSign}${String(Math.abs(offsetHours)).padStart(2, '0')}:00`;
          
          // Construir fecha ISO con offset explícito
          fechaFormateada = `${year}-${month}-${day}T${hour}:${minute}:${second}${offsetStr}`;
          
          logger.debug('🕐 Fecha formateada con offset de zona horaria:', {
            fechaOriginal: transaction.fecha,
            fechaFormateada: fechaFormateada,
            pais: userCountry,
            zonaHoraria: timeZone,
            offset: offsetStr
          });
        } else {
          // La fecha ya tiene offset, usarla directamente
          logger.debug('✅ Fecha ya tiene offset explícito, usando directamente:', fechaFormateada);
        }
      }
      
      const insertData = { 
        tipo: transaction.tipo,
        monto: transaction.monto,
        categoria: transaction.categoria,
        descripcion: transaction.descripcion,
        fecha: fechaFormateada,
        url_comprobante: transaction.url_comprobante,
        usuario_id: user.id 
      };
      
      logger.debug('📤 Datos que se insertarán:', insertData);
      
      const { data, error } = await supabase
        .from('transacciones')
        .insert([insertData])
        .select()
        .single();

      if (error) {
        logger.error('❌ Error de Supabase:', error);
        throw error;
      }
      
      logger.debug('✅ Transacción insertada exitosamente:', data);
      setTransactions(prev => {
        const newTransactions = [data, ...prev];
        logger.debug('🔄 Estado de transacciones actualizado:', {
          anterior: prev.length,
          nueva: newTransactions.length,
          nuevaTransaccion: data
        });
        return newTransactions;
      });
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const updateTransaction = async (id: string, transaction: Partial<Transaction>) => {
    try {
      const { error } = await supabase
        .from('transacciones')
        .update(transaction)
        .eq('id', id);

      if (error) throw error;
      
      setTransactions(prev => 
        prev.map(t => t.id === id ? { ...t, ...transaction } : t)
      );
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      // Soft delete: actualizar fecha_eliminacion en lugar de eliminar
      const { error } = await supabase
        .from('transacciones')
        .update({ fecha_eliminacion: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      
      // Remover de la lista de transacciones activas (las eliminadas no se muestran)
      setTransactions(prev => prev.filter(t => t.id !== id));
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  // Alias para compatibilidad con páginas existentes
  const deleteSupabaseTransaction = deleteTransaction;
  const updateSupabaseTransaction = updateTransaction;

  // Debt methods
  const addDebt = async (debt: Omit<Debt, 'id'>) => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('deudas')
        .insert([{ 
          nombre: debt.nombre,
          monto_total: debt.monto_total,
          monto_pagado: debt.monto_pagado,
          fecha_vencimiento: debt.fecha_vencimiento,
          es_mensual: debt.es_mensual,
          dia_mensual: debt.dia_mensual,
          historial_pagos: debt.historial_pagos,
          usuario_id: user.id 
        }])
        .select()
        .single();

      if (error) throw error;
      setDebts(prev => [data, ...prev]);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const updateDebt = async (id: string, debt: Partial<Debt>) => {
    try {
      const { error } = await supabase
        .from('deudas')
        .update(debt)
        .eq('id', id);

      if (error) throw error;
      
      setDebts(prev => 
        prev.map(d => d.id === id ? { ...d, ...debt } : d)
      );
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const deleteDebt = async (id: string) => {
    try {
      logger.debug(`🗑️ Eliminando deuda ${id} y sus comprobantes...`);
      
      // 1. Obtener la deuda para extraer las URLs de comprobantes
      const { data: debtData, error: fetchError } = await supabase
        .from('deudas')
        .select('historial_pagos')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      // 2. Extraer URLs de comprobantes
      const receiptUrls: string[] = [];
      if (debtData && debtData.historial_pagos && Array.isArray(debtData.historial_pagos)) {
        debtData.historial_pagos.forEach((payment: any) => {
          if (payment.receipt && typeof payment.receipt === 'string') {
            const fileName = extractReceiptFileName(payment.receipt);
            if (fileName) {
              receiptUrls.push(fileName);
            }
          }
        });
      }

      logger.debug(`📷 Encontrados ${receiptUrls.length} comprobantes para eliminar`);

      // 3. Eliminar las imágenes de Supabase Storage
      if (receiptUrls.length > 0) {
        try {
          const { error: deleteError } = await supabase.storage
            .from('receipts')
            .remove(receiptUrls);
          
          if (deleteError) {
            logger.warn('⚠️ Error al eliminar algunas imágenes:', deleteError);
          } else {
            logger.debug('✅ Comprobantes eliminados del storage');
          }
        } catch (storageError) {
          logger.warn('⚠️ Error al eliminar comprobantes del storage:', storageError);
        }
      }

      // 4. Eliminar la deuda de la base de datos
      const { error } = await supabase
        .from('deudas')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      logger.debug('✅ Deuda eliminada');
      setDebts(prev => prev.filter(d => d.id !== id));
    } catch (err: any) {
      logger.error('❌ Error al eliminar deuda:', err);
      setError(err.message);
      throw err;
    }
  };

  // Goal methods
  const addGoal = async (goal: Omit<Goal, 'id'>) => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('metas')
        .insert([{ 
          nombre: goal.nombre,
          monto_objetivo: goal.monto_objetivo,
          monto_actual: goal.monto_actual,
          fecha_objetivo: goal.fecha_objetivo,
          categoria: goal.categoria,
          prioridad: goal.prioridad,
          descripcion: goal.descripcion,
          historial_ahorros: goal.historial_ahorros,
          usuario_id: user.id 
        }])
        .select()
        .single();

      if (error) throw error;
      setGoals(prev => [data, ...prev]);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const updateGoal = async (id: string, goal: Partial<Goal>) => {
    try {
      const { error } = await supabase
        .from('metas')
        .update(goal)
        .eq('id', id);

      if (error) throw error;
      
      setGoals(prev => 
        prev.map(g => g.id === id ? { ...g, ...goal } : g)
      );
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const deleteGoal = async (id: string) => {
    try {
      const { error } = await supabase
        .from('metas')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setGoals(prev => prev.filter(g => g.id !== id));
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const deleteAllDebts = async () => {
    try {
      if (!user) throw new Error('Usuario no autenticado');
      
      logger.debug('🗑️ Eliminando todas las deudas y sus comprobantes...');
      
      // 1. Obtener todas las deudas para extraer las URLs de comprobantes
      const { data: debtsData, error: fetchError } = await supabase
        .from('deudas')
        .select('historial_pagos')
        .eq('usuario_id', user.id);

      if (fetchError) throw fetchError;

      // 2. Extraer URLs de comprobantes de todos los pagos
      const receiptUrls: string[] = [];
      if (debtsData) {
        debtsData.forEach(debt => {
          if (debt.historial_pagos && Array.isArray(debt.historial_pagos)) {
            debt.historial_pagos.forEach((payment: any) => {
              if (payment.receipt && typeof payment.receipt === 'string') {
                const fileName = extractReceiptFileName(payment.receipt);
                if (fileName) {
                  receiptUrls.push(fileName);
                }
              }
            });
          }
        });
      }

      logger.debug(`📷 Encontrados ${receiptUrls.length} comprobantes para eliminar`);

      // 3. Eliminar las imágenes de Supabase Storage
      if (receiptUrls.length > 0) {
        try {
          const { error: deleteError } = await supabase.storage
            .from('receipts')
            .remove(receiptUrls);
          
          if (deleteError) {
            logger.warn('⚠️ Error al eliminar algunas imágenes:', deleteError);
          } else {
            logger.debug('✅ Comprobantes eliminados del storage');
          }
        } catch (storageError) {
          logger.warn('⚠️ Error al eliminar comprobantes del storage:', storageError);
        }
      }

      // 4. Eliminar todas las deudas de la base de datos
      const { error } = await supabase
        .from('deudas')
        .delete()
        .eq('usuario_id', user.id);

      if (error) throw error;
      
      logger.debug('✅ Todas las deudas eliminadas');
      setDebts([]);
    } catch (err: any) {
      logger.error('❌ Error al eliminar deudas:', err);
      setError(err.message);
      throw err;
    }
  };

  const deleteAllGoals = async () => {
    try {
      if (!user) throw new Error('Usuario no autenticado');
      
      const { error } = await supabase
        .from('metas')
        .delete()
        .eq('usuario_id', user.id);

      if (error) throw error;
      
      setGoals([]);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  // Función para comprimir imágenes
  const compressImage = (file: File, maxSizeKB: number = 200): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calcular dimensiones manteniendo proporción
        const maxWidth = 1200;
        const maxHeight = 1200;
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Dibujar imagen redimensionada
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Comprimir con calidad progresiva
        let quality = 0.8;
        const compress = () => {
          canvas.toBlob((blob) => {
            if (blob) {
              const sizeKB = blob.size / 1024;
              logger.debug(`🔍 Compresión: ${sizeKB.toFixed(1)}KB (objetivo: ${maxSizeKB}KB)`);
              
              if (sizeKB <= maxSizeKB || quality <= 0.1) {
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now()
                });
                logger.debug(`✅ Imagen comprimida: ${(file.size/1024).toFixed(1)}KB → ${sizeKB.toFixed(1)}KB`);
                resolve(compressedFile);
              } else {
                quality -= 0.1;
                compress();
              }
            }
          }, 'image/jpeg', quality);
        };
        
        compress();
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  // Funciones para manejo de imágenes
  const uploadReceipt = async (file: File, userId: string) => {
    try {
      logger.debug('🔍 Uploading receipt for user:', userId);
      logger.debug('🔍 File details:', {
        name: file.name,
        size: file.size,
        type: file.type
      });
      
      // Comprimir imagen si es necesario
      let processedFile = file;
      if (file.size > 200 * 1024) { // Si es mayor a 200KB
        logger.debug('🔧 Comprimiendo imagen...');
        processedFile = await compressImage(file, 200);
      }
      
      // Verificar usuario autenticado en Supabase Auth
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      logger.debug('🔍 Current auth user:', authUser);
      logger.debug('🔍 Auth error:', authError);
      
      // Verificar sesión actual
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      logger.debug('🔍 Current session:', session);
      logger.debug('🔍 Session error:', sessionError);
      
      // Usar el ID del usuario autenticado si está disponible, sino usar el userId pasado
      const uploadUserId = authUser?.id || userId;
      
      const fileExt = processedFile.name.split('.').pop();
      const fileName = `${uploadUserId}/${Date.now()}.${fileExt}`;
      
      logger.debug('🔍 File name to upload:', fileName);
      logger.debug('🔍 Bucket: receipts');
      logger.debug('🔍 Upload user ID:', uploadUserId);
      
      const { data, error } = await supabase.storage
        .from('receipts')
        .upload(fileName, processedFile, {
          cacheControl: '3600',
          upsert: false
        });
        
      if (error) {
        logger.error('❌ Storage upload error:', error);
        logger.error('❌ Error details:', JSON.stringify(error, null, 2));
        throw error;
      }
      
      logger.debug('✅ Upload successful:', data);
      
      // Retornar URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('receipts')
        .getPublicUrl(fileName);
        
      logger.debug('🔍 Public URL:', publicUrl);
      
      return publicUrl;
    } catch (error) {
      logger.error('❌ Error uploading receipt:', error);
      logger.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      throw error;
    }
  };

  const deleteReceipt = async (fileName: string) => {
    try {
      const { error } = await supabase.storage
        .from('receipts')
        .remove([fileName]);
        
      if (error) throw error;
    } catch (error) {
      logger.error('Error deleting receipt:', error);
      throw error;
    }
  };

  // Función helper para extraer el nombre del archivo de una URL de comprobante
  const extractReceiptFileName = (receiptUrl: string): string | null => {
    try {
      const urlParts = receiptUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const userId = urlParts[urlParts.length - 2];
      if (fileName && userId) {
        return `${userId}/${fileName}`;
      }
      return null;
    } catch (error) {
      logger.error('Error extracting receipt filename:', error);
      return null;
    }
  };

  // Referral methods
  const getReferidos = async (): Promise<any[]> => {
    if (!user) {
      logger.warn('⚠️ getReferidos: No hay usuario autenticado');
      return [];
    }

    try {
      logger.debug('📋 getReferidos: Obteniendo referidos para usuario:', user.id);
      
      const { data, error } = await supabase
        .from('referidos')
        .select(`
          id,
          referido_id,
          codigo_usado,
          fecha_registro,
          fecha_verificacion,
          verifico_whatsapp,
          referido:referido_id(nombre, telefono)
        `)
        .eq('referidor_id', user.id)
        .order('fecha_registro', { ascending: false });

      if (error) {
        logger.error('❌ Error obteniendo referidos:', error);
        throw error;
      }

      // Transformar datos al formato esperado por ReferralsDashboard
      const referrals = (data || []).map((ref: any) => ({
        id: ref.id,
        referido_id: ref.referido_id,
        codigo_usado: ref.codigo_usado || '',
        fecha_referido: ref.fecha_registro || ref.created_at || '',
        fecha_verificacion: ref.fecha_verificacion || null,
        verificado: ref.verifico_whatsapp === true,
        nombre_referido: ref.referido?.nombre || null,
        telefono_referido: ref.referido?.telefono || null,
      }));

      logger.debug(`✅ getReferidos: Encontrados ${referrals.length} referidos`);
      return referrals;
    } catch (error: any) {
      logger.error('❌ Error en getReferidos:', error);
      setError(error.message || 'Error al obtener referidos');
      return [];
    }
  };

  // WhatsApp verification methods
  const sendWhatsAppVerificationCode = async (phone: string): Promise<{ success: boolean; error?: string }> => {
    try {
      logger.debug('📱 sendWhatsAppVerificationCode: Enviando código a:', phone);
      
      const response = await fetch('/api/whatsapp/send-verification-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        const errorMessage = data.message || data.error || 'Error al enviar código de verificación';
        logger.error('❌ Error enviando código:', errorMessage);
        return {
          success: false,
          error: errorMessage,
        };
      }

      logger.debug('✅ sendWhatsAppVerificationCode: Código enviado exitosamente');
      return {
        success: true,
      };
    } catch (error: any) {
      logger.error('❌ Error en sendWhatsAppVerificationCode:', error);
      return {
        success: false,
        error: error.message || 'Error de conexión al enviar código',
      };
    }
  };

  const verifyWhatsAppCode = async (phone: string, code: string): Promise<{ success: boolean; error?: string }> => {
    try {
      logger.debug('🔐 verifyWhatsAppCode: Verificando código para:', phone);
      
      const response = await fetch('/api/whatsapp/verify-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone, code }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        const errorMessage = data.message || data.error || 'Código inválido o expirado';
        logger.error('❌ Error verificando código:', errorMessage);
        return {
          success: false,
          error: errorMessage,
        };
      }

      logger.debug('✅ verifyWhatsAppCode: Código verificado exitosamente');

      // Recargar datos del usuario para actualizar whatsapp_verificado en el estado
      if (user) {
        await fetchUserData();
      }

      return {
        success: true,
      };
    } catch (error: any) {
      logger.error('❌ Error en verifyWhatsAppCode:', error);
      return {
        success: false,
        error: error.message || 'Error de conexión al verificar código',
      };
    }
  };

  // Phone change methods
  const checkCanChangePhone = async (): Promise<{ canChange: boolean; reason?: string; daysRemaining?: number }> => {
    if (!user) {
      logger.warn('⚠️ checkCanChangePhone: No hay usuario autenticado');
      return {
        canChange: false,
        reason: 'No hay usuario autenticado',
      };
    }

    try {
      logger.debug('📱 checkCanChangePhone: Verificando si puede cambiar teléfono para usuario:', user.id);

      // Si el teléfono no está verificado, puede cambiar libremente
      if (!user.whatsapp_verificado) {
        logger.debug('✅ checkCanChangePhone: Teléfono no verificado, puede cambiar libremente');
        return {
          canChange: true,
        };
      }

      // Obtener fecha_ultimo_cambio_telefono del usuario
      const { data: userData, error: userError } = await supabase
        .from('usuarios')
        .select('fecha_ultimo_cambio_telefono')
        .eq('id', user.id)
        .single();

      if (userError) {
        logger.error('❌ Error obteniendo datos del usuario:', userError);
        return {
          canChange: false,
          reason: 'Error al verificar datos del usuario',
        };
      }

      const lastChangeDate = userData?.fecha_ultimo_cambio_telefono;

      // Si nunca ha cambiado el teléfono, puede cambiar
      if (!lastChangeDate) {
        logger.debug('✅ checkCanChangePhone: Primera vez cambiando teléfono, permitido');
        return {
          canChange: true,
        };
      }

      // Calcular días desde el último cambio
      const daysSinceLastChange = Math.floor(
        (Date.now() - new Date(lastChangeDate).getTime()) / (1000 * 60 * 60 * 24)
      );

      logger.debug(`📅 checkCanChangePhone: Días desde último cambio: ${daysSinceLastChange}`);

      // Si pasaron 30 días o más, puede cambiar
      if (daysSinceLastChange >= 30) {
        logger.debug('✅ checkCanChangePhone: Pasaron 30+ días, puede cambiar');
        return {
          canChange: true,
        };
      }

      // Si no pasaron 30 días, calcular días restantes
      const daysRemaining = 30 - daysSinceLastChange;
      logger.debug(`⏳ checkCanChangePhone: Debe esperar ${daysRemaining} días más`);

      return {
        canChange: false,
        reason: `Debes esperar ${daysRemaining} ${daysRemaining === 1 ? 'día' : 'días'} más para cambiar tu teléfono`,
        daysRemaining,
      };
    } catch (error: any) {
      logger.error('❌ Error en checkCanChangePhone:', error);
      return {
        canChange: false,
        reason: 'Error al verificar si puede cambiar teléfono',
      };
    }
  };

  const initiatePhoneChange = async (newPhone: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      logger.warn('⚠️ initiatePhoneChange: No hay usuario autenticado');
      return {
        success: false,
        error: 'No hay usuario autenticado',
      };
    }

    try {
      logger.debug('📱 initiatePhoneChange: Iniciando cambio de teléfono para usuario:', user.id);
      logger.debug('📱 Nuevo teléfono:', newPhone);

      // 1. Guardar telefono_pendiente y fecha_inicio_cambio_telefono
      const { error: updateError } = await supabase
        .from('usuarios')
        .update({
          telefono_pendiente: newPhone,
          fecha_inicio_cambio_telefono: new Date().toISOString(),
          intentos_verificacion_cambio: 0,
        })
        .eq('id', user.id);

      if (updateError) {
        logger.error('❌ Error guardando teléfono pendiente:', updateError);
        return {
          success: false,
          error: 'Error al guardar teléfono pendiente',
        };
      }

      // 2. Enviar código de verificación al nuevo número (indicando que es cambio de teléfono)
      // Usamos fetch directamente para pasar parámetros adicionales
      let codeResult;
      try {
        const response = await fetch('/api/whatsapp/send-verification-code', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            phone: newPhone,
            isPhoneChange: true,
            userId: user.id,
          }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          const errorMessage = data.message || data.error || 'Error al enviar código de verificación';
          logger.error('❌ Error enviando código:', errorMessage);
          codeResult = {
            success: false,
            error: errorMessage,
          };
        } else {
          codeResult = {
            success: true,
          };
        }
      } catch (error: any) {
        logger.error('❌ Error en sendWhatsAppVerificationCode:', error);
        codeResult = {
          success: false,
          error: error.message || 'Error de conexión al enviar código',
        };
      }

      if (!codeResult.success) {
        logger.error('❌ Error enviando código de verificación:', codeResult.error);
        // Limpiar telefono_pendiente si falla el envío
        await supabase
          .from('usuarios')
          .update({
            telefono_pendiente: null,
            fecha_inicio_cambio_telefono: null,
          })
          .eq('id', user.id);
        
        return {
          success: false,
          error: codeResult.error || 'Error al enviar código de verificación',
        };
      }

      logger.debug('✅ initiatePhoneChange: Código enviado exitosamente');
      return {
        success: true,
      };
    } catch (error: any) {
      logger.error('❌ Error en initiatePhoneChange:', error);
      return {
        success: false,
        error: error.message || 'Error al iniciar cambio de teléfono',
      };
    }
  };

  const verifyPhoneChange = async (code: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      logger.warn('⚠️ verifyPhoneChange: No hay usuario autenticado');
      return {
        success: false,
        error: 'No hay usuario autenticado',
      };
    }

    try {
      logger.debug('🔐 verifyPhoneChange: Verificando código para cambio de teléfono');

      // 1. Obtener telefono_pendiente del usuario
      const { data: userData, error: userError } = await supabase
        .from('usuarios')
        .select('telefono_pendiente, intentos_verificacion_cambio')
        .eq('id', user.id)
        .single();

      if (userError || !userData) {
        logger.error('❌ Error obteniendo datos del usuario:', userError);
        return {
          success: false,
          error: 'Error al obtener datos del usuario',
        };
      }

      if (!userData.telefono_pendiente) {
        logger.error('❌ No hay teléfono pendiente');
        return {
          success: false,
          error: 'No hay cambio de teléfono pendiente',
        };
      }

      // 2. Verificar código usando el endpoint existente (indicando que es cambio de teléfono)
      // Usamos fetch directamente para pasar parámetros adicionales
      let verifyResult;
      try {
        const response = await fetch('/api/whatsapp/verify-code', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            phone: userData.telefono_pendiente,
            code: code,
            isPhoneChange: true,
            userId: user.id,
          }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          const errorMessage = data.message || data.error || 'Código inválido o expirado';
          logger.error('❌ Error verificando código:', errorMessage);
          verifyResult = {
            success: false,
            error: errorMessage,
          };
        } else {
          verifyResult = {
            success: true,
          };
        }
      } catch (error: any) {
        logger.error('❌ Error en verifyWhatsAppCode:', error);
        verifyResult = {
          success: false,
          error: error.message || 'Error de conexión al verificar código',
        };
      }

      if (!verifyResult.success) {
        // Incrementar intentos fallidos
        const newAttempts = (userData.intentos_verificacion_cambio || 0) + 1;
        await supabase
          .from('usuarios')
          .update({ intentos_verificacion_cambio: newAttempts })
          .eq('id', user.id);

        return {
          success: false,
          error: verifyResult.error || 'Código inválido',
        };
      }

      // 3. Si el código es válido, aplicar el cambio
      const { error: applyError } = await supabase
        .from('usuarios')
        .update({
          telefono: userData.telefono_pendiente,
          telefono_verificado: userData.telefono_pendiente,
          fecha_ultimo_cambio_telefono: new Date().toISOString(),
          // Limpiar campos temporales
          telefono_pendiente: null,
          codigo_verificacion_pendiente: null,
          fecha_inicio_cambio_telefono: null,
          intentos_verificacion_cambio: 0,
        })
        .eq('id', user.id);

      if (applyError) {
        logger.error('❌ Error aplicando cambio de teléfono:', applyError);
        return {
          success: false,
          error: 'Error al aplicar cambio de teléfono',
        };
      }

      logger.debug('✅ verifyPhoneChange: Teléfono cambiado exitosamente');

      // 4. Recargar datos del usuario
      await fetchUserData();

      return {
        success: true,
      };
    } catch (error: any) {
      logger.error('❌ Error en verifyPhoneChange:', error);
      return {
        success: false,
        error: error.message || 'Error al verificar código',
      };
    }
  };

  const cancelPhoneChange = async (): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      logger.warn('⚠️ cancelPhoneChange: No hay usuario autenticado');
      return {
        success: false,
        error: 'No hay usuario autenticado',
      };
    }

    try {
      logger.debug('🚫 cancelPhoneChange: Cancelando cambio de teléfono pendiente');

      // Limpiar campos temporales
      const { error: updateError } = await supabase
        .from('usuarios')
        .update({
          telefono_pendiente: null,
          codigo_verificacion_pendiente: null,
          fecha_inicio_cambio_telefono: null,
          intentos_verificacion_cambio: 0,
        })
        .eq('id', user.id);

      if (updateError) {
        logger.error('❌ Error cancelando cambio de teléfono:', updateError);
        return {
          success: false,
          error: 'Error al cancelar cambio de teléfono',
        };
      }

      logger.debug('✅ cancelPhoneChange: Cambio cancelado exitosamente');
      return {
        success: true,
      };
    } catch (error: any) {
      logger.error('❌ Error en cancelPhoneChange:', error);
      return {
        success: false,
        error: error.message || 'Error al cancelar cambio de teléfono',
      };
    }
  };

  const value: SupabaseContextType = {
    user,
    transactions,
    debts,
    goals,
    loading,
    error,
    createUser,
    signInWithPhone,
    updateUser,
    fetchUserData,
    logout,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    supabaseTransactions: transactions,
    deleteSupabaseTransaction,
    updateSupabaseTransaction,
    getAllMovements,
    getTodayMovements,
    getTodayDeletedCount,
    addDebt,
    updateDebt,
    deleteDebt,
    deleteAllDebts,
    addGoal,
    updateGoal,
    deleteGoal,
    deleteAllGoals,
    uploadReceipt,
    deleteReceipt,
    extractReceiptFileName,
    getReferidos,
    sendWhatsAppVerificationCode,
    verifyWhatsAppCode,
    checkCanChangePhone,
    initiatePhoneChange,
    verifyPhoneChange,
    cancelPhoneChange,
  };

  return (
    <SupabaseContext.Provider value={value}>
      {children}
    </SupabaseContext.Provider>
  );
};
