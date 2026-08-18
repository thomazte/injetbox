import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { SUPABASE_ANON_KEY, SUPABASE_URL } from './supabasePublic'

const url = import.meta.env.VITE_SUPABASE_URL || SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY || SUPABASE_ANON_KEY

export const isConfigured = Boolean(url && key)

export const supabase: SupabaseClient | null = isConfigured
  ? createClient(url, key)
  : null

export function getSupabase(): SupabaseClient {
  if (!supabase) {
    throw new Error('Supabase não configurado')
  }
  return supabase
}
