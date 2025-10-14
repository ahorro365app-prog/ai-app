import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

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
