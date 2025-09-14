import { createClient } from '@supabase/supabase-js'

// Use placeholder values during build time to prevent build errors
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Helper function to check if we have real environment variables
export const isSupabaseConfigured = () => {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL && 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co' &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== 'placeholder-key'
  )
}

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          username: string | null
          telegram_username: string | null
          telegram_id: string | null
          approval_status: 'pending' | 'approved' | 'rejected'
          role: 'user' | 'admin'
          approved_by: string | null
          approved_at: string | null
          rejection_reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          username?: string | null
          telegram_username?: string | null
          telegram_id?: string | null
          approval_status?: 'pending' | 'approved' | 'rejected'
          role?: 'user' | 'admin'
          approved_by?: string | null
          approved_at?: string | null
          rejection_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          username?: string | null
          telegram_username?: string | null
          telegram_id?: string | null
          approval_status?: 'pending' | 'approved' | 'rejected'
          role?: 'user' | 'admin'
          approved_by?: string | null
          approved_at?: string | null
          rejection_reason?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      tickets: {
        Row: {
          id: string
          title: string
          urgency: 'low' | 'medium' | 'high' | 'critical'
          deadline: string | null
          details: string
          status: 'new' | 'in_progress' | 'completed'
          assigned_to: string
          created_by: string
          solution_type: 'prompt' | 'n8n_workflow' | 'other' | null
          solution_data: any | null
          output_result: any | null
          edited: boolean
          user_notified: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          urgency: 'low' | 'medium' | 'high' | 'critical'
          deadline?: string | null
          details: string
          status?: 'new' | 'in_progress' | 'completed'
          assigned_to: string
          created_by: string
          solution_type?: 'prompt' | 'n8n_workflow' | 'other' | null
          solution_data?: any | null
          output_result?: any | null
          edited?: boolean
          user_notified?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          urgency?: 'low' | 'medium' | 'high' | 'critical'
          deadline?: string | null
          details?: string
          status?: 'new' | 'in_progress' | 'completed'
          assigned_to?: string
          created_by?: string
          solution_type?: 'prompt' | 'n8n_workflow' | 'other' | null
          solution_data?: any | null
          output_result?: any | null
          edited?: boolean
          user_notified?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      ai_prompt_backups: {
        Row: {
          id: string
          user_id: string
          prompt_text: string
          ai_model: string
          previous_version_id: string | null
          output_logic: any | null
          output_result: any | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          prompt_text: string
          ai_model: string
          previous_version_id?: string | null
          output_logic?: any | null
          output_result?: any | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          prompt_text?: string
          ai_model?: string
          previous_version_id?: string | null
          output_logic?: any | null
          output_result?: any | null
          created_at?: string
          updated_at?: string
        }
      }
      n8n_project_backups: {
        Row: {
          id: string
          user_id: string
          project_name: string
          workflow_json: any
          previous_version_id: string | null
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          project_name: string
          workflow_json: any
          previous_version_id?: string | null
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          project_name?: string
          workflow_json?: any
          previous_version_id?: string | null
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
