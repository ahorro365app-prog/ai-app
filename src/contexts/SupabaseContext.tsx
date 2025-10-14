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
  
  // Debt methods
  addDebt: (debt: Omit<Debt, 'id'>) => Promise<void>;
  updateDebt: (id: string, debt: Partial<Debt>) => Promise<void>;
  deleteDebt: (id: string) => Promise<void>;
  
  // Goal methods
  addGoal: (goal: Omit<Goal, 'id'>) => Promise<void>;
  updateGoal: (id: string, goal: Partial<Goal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
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
      setTransactions(transactionsData || []);

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
      setError(err.message);
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

  const logout = () => {
    setUser(null);
    setTransactions([]);
    setDebts([]);
    setGoals([]);
    localStorage.removeItem('currentUser');
  };

  // Transaction methods
  const addTransaction = async (transaction: Omit<Transaction, 'id'>) => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('transacciones')
        .insert([{ 
          tipo: transaction.tipo,
          monto: transaction.monto,
          categoria: transaction.categoria,
          descripcion: transaction.descripcion,
          fecha: transaction.fecha,
          url_comprobante: transaction.url_comprobante,
          usuario_id: user.id 
        }])
        .select()
        .single();

      if (error) throw error;
      setTransactions(prev => [data, ...prev]);
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
      const { error } = await supabase
        .from('deudas')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setDebts(prev => prev.filter(d => d.id !== id));
    } catch (err: any) {
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
    addDebt,
    updateDebt,
    deleteDebt,
    addGoal,
    updateGoal,
    deleteGoal,
  };

  return (
    <SupabaseContext.Provider value={value}>
      {children}
    </SupabaseContext.Provider>
  );
};
