import { createClient } from '@supabase/supabase-js'

// Validar configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Función para validar URL
function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return url.startsWith('https://') || url.startsWith('http://')
  } catch {
    return false
  }
}

// Validar configuración
if (!supabaseUrl || supabaseUrl === 'your_supabase_url_here') {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL no está configurada correctamente')
  console.error('📝 Instrucciones:')
  console.error('   1. Ve a https://supabase.com/dashboard/project/[tu-proyecto]/settings/api')
  console.error('   2. Copia la "Project URL"')
  console.error('   3. Reemplaza "your_supabase_url_here" en .env.local')
  console.error('   4. Reinicia el servidor (npm run dev)')
  throw new Error('NEXT_PUBLIC_SUPABASE_URL no configurada. Revisa las instrucciones en la consola.')
}

if (!supabaseAnonKey || supabaseAnonKey === 'your_supabase_anon_key_here') {
  console.error('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY no está configurada correctamente')
  console.error('📝 Instrucciones:')
  console.error('   1. Ve a https://supabase.com/dashboard/project/[tu-proyecto]/settings/api')
  console.error('   2. Copia la "anon public" key')
  console.error('   3. Reemplaza "your_supabase_anon_key_here" en .env.local')
  console.error('   4. Reinicia el servidor (npm run dev)')
  throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY no configurada. Revisa las instrucciones en la consola.')
}

if (!isValidUrl(supabaseUrl)) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL no es una URL válida')
  console.error('📝 La URL debe ser válida (ejemplo: https://tu-proyecto.supabase.co)')
  console.error('📝 Valor actual:', supabaseUrl)
  throw new Error('NEXT_PUBLIC_SUPABASE_URL no es una URL válida. Debe ser una URL HTTP/HTTPS válida.')
}

console.log('✅ Supabase configurado correctamente')
console.log('🔗 URL:', supabaseUrl)

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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
