import { createClient } from '@supabase/supabase-js'

// Lazy initialization para evitar errores durante build time
let supabaseClient: ReturnType<typeof createClient> | null = null

// Función para validar URL
function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return url.startsWith('https://') || url.startsWith('http://')
  } catch {
    return false
  }
}

function getSupabaseClient() {
  if (!supabaseClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    // Durante build time en Vercel SIN variables, crear cliente dummy
    const isBuildTimeNoVars = process.env.VERCEL === '1' && (!supabaseUrl || !supabaseAnonKey)
    
    if (isBuildTimeNoVars) {
      // Retornar objeto dummy solo durante build en Vercel sin variables
      supabaseClient = {
        from: () => ({
          select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) }) }),
        }),
        auth: {
          getSession: () => Promise.resolve({ data: { session: null }, error: null }),
          signInWithPassword: () => Promise.resolve({ data: null, error: null }),
          signUp: () => Promise.resolve({ data: null, error: null }),
          onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        },
      } as any
      return supabaseClient
    }
    
    // Validar configuración solo si tenemos valores
    if (!supabaseUrl || supabaseUrl === 'your_supabase_url_here') {
      throw new Error('NEXT_PUBLIC_SUPABASE_URL no configurada. Revisa las instrucciones en la consola.')
    }
    
    if (!supabaseAnonKey || supabaseAnonKey === 'your_supabase_anon_key_here') {
      throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY no configurada. Revisa las instrucciones en la consola.')
    }
    
    if (!isValidUrl(supabaseUrl)) {
      throw new Error('NEXT_PUBLIC_SUPABASE_URL no es una URL válida. Debe ser una URL HTTP/HTTPS válida.')
    }
    
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey)
    
    if (process.env.NODE_ENV !== 'production') {
      console.log('✅ Supabase configurado correctamente')
      console.log('🔗 URL:', supabaseUrl)
    }
  }
  
  return supabaseClient
}

// Exportar directamente el cliente (no Proxy)
export const supabase = getSupabaseClient()

// Tipos para TypeScript
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          name: string
          email: string
          phone: string | null
          country: string
          currency: string
          daily_budget: number | null
          subscription: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          phone?: string | null
          country?: string
          currency?: string
          daily_budget?: number | null
          subscription?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          phone?: string | null
          country?: string
          currency?: string
          daily_budget?: number | null
          subscription?: string
          created_at?: string
          updated_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          type: string
          amount: number
          category: string
          description: string | null
          date: string
          receipt_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          amount: number
          category: string
          description?: string | null
          date: string
          receipt_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          amount?: number
          category?: string
          description?: string | null
          date?: string
          receipt_url?: string | null
          created_at?: string
        }
      }
      debts: {
        Row: {
          id: string
          user_id: string
          name: string
          total_amount: number
          paid_amount: number
          due_date: string | null
          is_monthly: boolean
          monthly_day: number | null
          payment_history: any
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          total_amount: number
          paid_amount?: number
          due_date?: string | null
          is_monthly?: boolean
          monthly_day?: number | null
          payment_history?: any
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          total_amount?: number
          paid_amount?: number
          due_date?: string | null
          is_monthly?: boolean
          monthly_day?: number | null
          payment_history?: any
          created_at?: string
          updated_at?: string
        }
      }
      goals: {
        Row: {
          id: string
          user_id: string
          name: string
          target_amount: number
          current_amount: number
          target_date: string | null
          category: string
          priority: string
          description: string | null
          savings_history: any
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          target_amount: number
          current_amount?: number
          target_date?: string | null
          category: string
          priority?: string
          description?: string | null
          savings_history?: any
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          target_amount?: number
          current_amount?: number
          target_date?: string | null
          category?: string
          priority?: string
          description?: string | null
          savings_history?: any
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
