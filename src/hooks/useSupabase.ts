import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

// Hook para manejar la conexión con Supabase
export const useSupabase = () => {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Obtener sesión actual
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      setLoading(false)
    }

    getSession()

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  return { user, loading }
}

// Hook para manejar transacciones
export const useTransactions = () => {
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchTransactions = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false })

      if (error) throw error
      setTransactions(data || [])
    } catch (error) {
      console.error('Error fetching transactions:', error)
    } finally {
      setLoading(false)
    }
  }

  const addTransaction = async (transaction: any) => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert([transaction])
        .select()

      if (error) throw error
      setTransactions(prev => [data[0], ...prev])
      return data[0]
    } catch (error) {
      console.error('Error adding transaction:', error)
      throw error
    }
  }

  const updateTransaction = async (id: string, updates: any) => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .update(updates)
        .eq('id', id)
        .select()

      if (error) throw error
      setTransactions(prev => 
        prev.map(t => t.id === id ? data[0] : t)
      )
      return data[0]
    } catch (error) {
      console.error('Error updating transaction:', error)
      throw error
    }
  }

  const deleteTransaction = async (id: string) => {
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)

      if (error) throw error
      setTransactions(prev => prev.filter(t => t.id !== id))
    } catch (error) {
      console.error('Error deleting transaction:', error)
      throw error
    }
  }

  return {
    transactions,
    loading,
    fetchTransactions,
    addTransaction,
    updateTransaction,
    deleteTransaction
  }
}

// Hook para manejar deudas
export const useDebts = () => {
  const [debts, setDebts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchDebts = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('debts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setDebts(data || [])
    } catch (error) {
      console.error('Error fetching debts:', error)
    } finally {
      setLoading(false)
    }
  }

  const addDebt = async (debt: any) => {
    try {
      const { data, error } = await supabase
        .from('debts')
        .insert([debt])
        .select()

      if (error) throw error
      setDebts(prev => [data[0], ...prev])
      return data[0]
    } catch (error) {
      console.error('Error adding debt:', error)
      throw error
    }
  }

  const updateDebt = async (id: string, updates: any) => {
    try {
      const { data, error } = await supabase
        .from('debts')
        .update(updates)
        .eq('id', id)
        .select()

      if (error) throw error
      setDebts(prev => 
        prev.map(d => d.id === id ? data[0] : d)
      )
      return data[0]
    } catch (error) {
      console.error('Error updating debt:', error)
      throw error
    }
  }

  const deleteDebt = async (id: string) => {
    try {
      const { error } = await supabase
        .from('debts')
        .delete()
        .eq('id', id)

      if (error) throw error
      setDebts(prev => prev.filter(d => d.id !== id))
    } catch (error) {
      console.error('Error deleting debt:', error)
      throw error
    }
  }

  return {
    debts,
    loading,
    fetchDebts,
    addDebt,
    updateDebt,
    deleteDebt
  }
}

// Hook para manejar metas
export const useGoals = () => {
  const [goals, setGoals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchGoals = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setGoals(data || [])
    } catch (error) {
      console.error('Error fetching goals:', error)
    } finally {
      setLoading(false)
    }
  }

  const addGoal = async (goal: any) => {
    try {
      const { data, error } = await supabase
        .from('goals')
        .insert([goal])
        .select()

      if (error) throw error
      setGoals(prev => [data[0], ...prev])
      return data[0]
    } catch (error) {
      console.error('Error adding goal:', error)
      throw error
    }
  }

  const updateGoal = async (id: string, updates: any) => {
    try {
      const { data, error } = await supabase
        .from('goals')
        .update(updates)
        .eq('id', id)
        .select()

      if (error) throw error
      setGoals(prev => 
        prev.map(g => g.id === id ? data[0] : g)
      )
      return data[0]
    } catch (error) {
      console.error('Error updating goal:', error)
      throw error
    }
  }

  const deleteGoal = async (id: string) => {
    try {
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', id)

      if (error) throw error
      setGoals(prev => prev.filter(g => g.id !== id))
    } catch (error) {
      console.error('Error deleting goal:', error)
      throw error
    }
  }

  return {
    goals,
    loading,
    fetchGoals,
    addGoal,
    updateGoal,
    deleteGoal
  }
}

// Hook para manejar usuarios
export const useUsers = () => {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const fetchUser = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error
      setUser(data)
    } catch (error) {
      console.error('Error fetching user:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateUser = async (userId: string, updates: any) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId)
        .select()

      if (error) throw error
      setUser(data[0])
      return data[0]
    } catch (error) {
      console.error('Error updating user:', error)
      throw error
    }
  }

  const createUser = async (userData: any) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert([userData])
        .select()

      if (error) throw error
      setUser(data[0])
      return data[0]
    } catch (error) {
      console.error('Error creating user:', error)
      throw error
    }
  }

  return {
    user,
    loading,
    fetchUser,
    updateUser,
    createUser
  }
}
