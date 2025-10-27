"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';

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
  const [user, setUser] = useState<User | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar usuario guardado al inicializar
  useEffect(() => {
    const loadSavedUser = async () => {
      try {
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
          const userData = JSON.parse(savedUser);
          setUser(userData);
          
          // Cargar datos del usuario
          await loadUserData(userData);
        }
      } catch (error) {
        console.error('Error cargando usuario guardado:', error);
        localStorage.removeItem('currentUser');
      } finally {
        setLoading(false);
      }
    };

    loadSavedUser();
  }, []);

  // Cargar datos iniciales - REMOVIDO: ahora usamos persistencia de sesión

  // Función loadInitialData removida - ahora usamos persistencia de sesión

  // Función para migrar categorías de transacciones existentes
  const migrateTransactionCategories = async (transactions: Transaction[]): Promise<Transaction[]> => {
    console.log('🔧 Iniciando migración de categorías en transacciones de Supabase...');
    
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
        console.log(`🔄 Migrando transacción ${tx.id}: ${tx.categoria} → ${categoryIdMapping[tx.categoria]}`);
        transactionsToUpdate.push({
          ...tx,
          categoria: categoryIdMapping[tx.categoria]
        });
      }
    });
    
    // Actualizar transacciones en Supabase si hay cambios
    if (transactionsToUpdate.length > 0) {
      console.log(`📝 Actualizando ${transactionsToUpdate.length} transacciones en Supabase...`);
      
      try {
        for (const tx of transactionsToUpdate) {
          const { error } = await supabase
            .from('transacciones')
            .update({ categoria: tx.categoria })
            .eq('id', tx.id);
          
          if (error) {
            console.error(`❌ Error actualizando transacción ${tx.id}:`, error);
          } else {
            console.log(`✅ Transacción ${tx.id} actualizada exitosamente`);
          }
        }
      } catch (error) {
        console.error('❌ Error durante la migración de transacciones:', error);
      }
    } else {
      console.log('ℹ️ No hay transacciones que migrar');
    }
    
    // Devolver las transacciones con categorías migradas
    return transactions.map(tx => {
      const updatedTx = transactionsToUpdate.find(utx => utx.id === tx.id);
      return updatedTx || tx;
    });
  };

  // Función para cargar datos de un usuario específico
  const loadUserData = async (userData: User) => {
    try {
      setError(null);

      // Cargar transacciones
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transacciones')
        .select('*')
        .eq('usuario_id', userData.id)
        .order('fecha', { ascending: false });

      if (transactionsError) throw transactionsError;
      
      // Migrar categorías de transacciones existentes
      const migratedTransactions = await migrateTransactionCategories(transactionsData || []);
      setTransactions(migratedTransactions);

      // Cargar deudas
      const { data: debtsData, error: debtsError } = await supabase
        .from('deudas')
        .select('*')
        .eq('usuario_id', userData.id)
        .order('fecha_creacion', { ascending: false });

      if (debtsError) {
        console.error('Error cargando deudas:', debtsError);
        throw debtsError;
      }
      setDebts(debtsData || []);

      // Cargar metas
      const { data: goalsData, error: goalsError } = await supabase
        .from('metas')
        .select('*')
        .eq('usuario_id', userData.id)
        .order('fecha_creacion', { ascending: false });

      if (goalsError) throw goalsError;
      setGoals(goalsData || []);

    } catch (err: any) {
      console.error('Error loading user data:', err);
      console.error('Error details:', {
        message: err.message,
        code: err.code,
        details: err.details,
        hint: err.hint
      });
      setError(err.message || 'Error desconocido al cargar datos del usuario');
    }
  };

  // User methods
  const createUser = async (userData: { nombre: string; telefono: string; contrasena: string; moneda: string }) => {
    try {
      // Verificar si el teléfono ya existe
      const { data: existingUser, error: checkError } = await supabase
        .from('usuarios')
        .select('id')
        .eq('telefono', userData.telefono)
        .single();

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
          metas_habilitado: false   // Desactivado por defecto
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creando usuario:', error);
        return {
          success: false,
          error: 'Error al crear la cuenta. Verifica tus datos e intenta nuevamente.'
        };
      }

      setUser(data);
      return { success: true };
    } catch (err: any) {
      console.error('Error en createUser:', err);
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
          console.warn('No se pudo crear sesión de auth en Supabase:', signUpError);
          // Continuar sin auth de Supabase
        } else {
          console.log('Usuario creado en Supabase Auth:', signUpData);
        }
      } else if (authError) {
        console.warn('Error en autenticación Supabase:', authError);
        // Continuar sin auth de Supabase
      } else {
        console.log('Autenticado en Supabase:', authData);
      }

      // 3. Establecer el usuario en el estado
      setUser(data);
      
      // Guardar usuario en localStorage para persistencia
      localStorage.setItem('currentUser', JSON.stringify(data));
      
      // Cargar datos del usuario
      await loadUserData(data);
      
      return { success: true };
    } catch (err: any) {
      console.error('Error en signInWithPhone:', err);
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

  // Función para obtener movimientos de hoy
  const getTodayMovements = (): any[] => {
    const today = new Date();
    // Obtener fecha de hoy en zona horaria local (00:00:00)
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    console.log('📅 Filtro de fechas:', {
      todayStart: todayStart.toLocaleString(),
      todayEnd: todayEnd.toLocaleString(),
      currentTime: today.toLocaleString()
    });
    
    console.log('📊 Total transacciones en estado:', transactions.length);
    console.log('📊 Transacciones:', transactions.map(t => ({ id: t.id, tipo: t.tipo, monto: t.monto, fecha: t.fecha })));
    
    const filtered = getAllMovements().filter(movement => {
      const movementDate = new Date(movement.fecha);
      const isInRange = movementDate >= todayStart && movementDate < todayEnd;
      
      if (isInRange) {
        console.log('✅ Movimiento de hoy:', {
          id: movement.id,
          fecha: movement.fecha,
          fechaLocal: movementDate.toLocaleString(),
          tipo: movement.tipo_movimiento
        });
      }
      
      // Verificar que la fecha del movimiento esté entre 00:00:00 y 23:59:59 de hoy
      return isInRange;
    });
    
    console.log('📊 Total movimientos de hoy:', filtered.length);
    return filtered;
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
      console.error('❌ addTransaction: No hay usuario autenticado');
      return;
    }
    
    try {
      console.log('💾 addTransaction: Iniciando guardado en Supabase');
      console.log('📊 Datos de transacción:', transaction);
      console.log('👤 Usuario ID:', user.id);
      
      // Asegurar que la fecha esté en formato correcto para el país del usuario
      let fechaFormateada = transaction.fecha;
      if (transaction.fecha && !transaction.fecha.includes('T')) {
        // Obtener el país del usuario para usar su zona horaria
        const userCountry = user.pais || 'BO'; // Default a Bolivia si no hay país
        const countryTimezones: Record<string, string> = {
          'BO': 'America/La_Paz', 'AR': 'America/Argentina/Buenos_Aires', 'BR': 'America/Sao_Paulo',
          'CL': 'America/Santiago', 'CO': 'America/Bogota', 'EC': 'America/Guayaquil',
          'PE': 'America/Lima', 'PY': 'America/Asuncion', 'UY': 'America/Montevideo',
          'VE': 'America/Caracas', 'MX': 'America/Mexico_City', 'US': 'America/New_York',
          'EU': 'Europe/Berlin'
        };
        
        const timezone = countryTimezones[userCountry] || countryTimezones['BO'];
        const countryTime = new Date().toLocaleString("en-US", {timeZone: timezone});
        const countryDate = new Date(countryTime);
        const horaCountry = countryDate.toTimeString().split(' ')[0]; // HH:MM:SS
        fechaFormateada = `${transaction.fecha}T${horaCountry}`;
        console.log('🕐 Fecha ajustada a zona horaria del país:', fechaFormateada);
        console.log('🌍 País del usuario:', userCountry, 'Zona horaria:', timezone);
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
      
      console.log('📤 Datos que se insertarán:', insertData);
      
      const { data, error } = await supabase
        .from('transacciones')
        .insert([insertData])
        .select()
        .single();

      if (error) {
        console.error('❌ Error de Supabase:', error);
        throw error;
      }
      
      console.log('✅ Transacción insertada exitosamente:', data);
      setTransactions(prev => {
        const newTransactions = [data, ...prev];
        console.log('🔄 Estado de transacciones actualizado:', {
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
      const { error } = await supabase
        .from('transacciones')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
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
      console.log(`🗑️ Eliminando deuda ${id} y sus comprobantes...`);
      
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

      console.log(`📷 Encontrados ${receiptUrls.length} comprobantes para eliminar`);

      // 3. Eliminar las imágenes de Supabase Storage
      if (receiptUrls.length > 0) {
        try {
          const { error: deleteError } = await supabase.storage
            .from('receipts')
            .remove(receiptUrls);
          
          if (deleteError) {
            console.warn('⚠️ Error al eliminar algunas imágenes:', deleteError);
          } else {
            console.log('✅ Comprobantes eliminados del storage');
          }
        } catch (storageError) {
          console.warn('⚠️ Error al eliminar comprobantes del storage:', storageError);
        }
      }

      // 4. Eliminar la deuda de la base de datos
      const { error } = await supabase
        .from('deudas')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      console.log('✅ Deuda eliminada');
      setDebts(prev => prev.filter(d => d.id !== id));
    } catch (err: any) {
      console.error('❌ Error al eliminar deuda:', err);
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
      
      console.log('🗑️ Eliminando todas las deudas y sus comprobantes...');
      
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

      console.log(`📷 Encontrados ${receiptUrls.length} comprobantes para eliminar`);

      // 3. Eliminar las imágenes de Supabase Storage
      if (receiptUrls.length > 0) {
        try {
          const { error: deleteError } = await supabase.storage
            .from('receipts')
            .remove(receiptUrls);
          
          if (deleteError) {
            console.warn('⚠️ Error al eliminar algunas imágenes:', deleteError);
          } else {
            console.log('✅ Comprobantes eliminados del storage');
          }
        } catch (storageError) {
          console.warn('⚠️ Error al eliminar comprobantes del storage:', storageError);
        }
      }

      // 4. Eliminar todas las deudas de la base de datos
      const { error } = await supabase
        .from('deudas')
        .delete()
        .eq('usuario_id', user.id);

      if (error) throw error;
      
      console.log('✅ Todas las deudas eliminadas');
      setDebts([]);
    } catch (err: any) {
      console.error('❌ Error al eliminar deudas:', err);
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
              console.log(`🔍 Compresión: ${sizeKB.toFixed(1)}KB (objetivo: ${maxSizeKB}KB)`);
              
              if (sizeKB <= maxSizeKB || quality <= 0.1) {
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now()
                });
                console.log(`✅ Imagen comprimida: ${(file.size/1024).toFixed(1)}KB → ${sizeKB.toFixed(1)}KB`);
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
      console.log('🔍 Uploading receipt for user:', userId);
      console.log('🔍 File details:', {
        name: file.name,
        size: file.size,
        type: file.type
      });
      
      // Comprimir imagen si es necesario
      let processedFile = file;
      if (file.size > 200 * 1024) { // Si es mayor a 200KB
        console.log('🔧 Comprimiendo imagen...');
        processedFile = await compressImage(file, 200);
      }
      
      // Verificar usuario autenticado en Supabase Auth
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      console.log('🔍 Current auth user:', authUser);
      console.log('🔍 Auth error:', authError);
      
      // Verificar sesión actual
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log('🔍 Current session:', session);
      console.log('🔍 Session error:', sessionError);
      
      // Usar el ID del usuario autenticado si está disponible, sino usar el userId pasado
      const uploadUserId = authUser?.id || userId;
      
      const fileExt = processedFile.name.split('.').pop();
      const fileName = `${uploadUserId}/${Date.now()}.${fileExt}`;
      
      console.log('🔍 File name to upload:', fileName);
      console.log('🔍 Bucket: receipts');
      console.log('🔍 Upload user ID:', uploadUserId);
      
      const { data, error } = await supabase.storage
        .from('receipts')
        .upload(fileName, processedFile, {
          cacheControl: '3600',
          upsert: false
        });
        
      if (error) {
        console.error('❌ Storage upload error:', error);
        console.error('❌ Error details:', JSON.stringify(error, null, 2));
        throw error;
      }
      
      console.log('✅ Upload successful:', data);
      
      // Retornar URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('receipts')
        .getPublicUrl(fileName);
        
      console.log('🔍 Public URL:', publicUrl);
      
      return publicUrl;
    } catch (error) {
      console.error('❌ Error uploading receipt:', error);
      console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
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
      console.error('Error deleting receipt:', error);
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
      console.error('Error extracting receipt filename:', error);
      return null;
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
    logout,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    supabaseTransactions: transactions,
    deleteSupabaseTransaction,
    updateSupabaseTransaction,
    getAllMovements,
    getTodayMovements,
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
  };

  return (
    <SupabaseContext.Provider value={value}>
      {children}
    </SupabaseContext.Provider>
  );
};
