import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { SUPABASE_ANON_KEY, SUPABASE_URL } from './supabasePublic'

function fromEnv(value: string | undefined) {
  const clean = String(value || '').trim()
  // Evita placeholders comuns de setup quebrando o deploy web.
  if (!clean || clean.includes('...') || clean.includes('YOUR_')) return ''
  return clean
}

const url = fromEnv(import.meta.env.VITE_SUPABASE_URL) || SUPABASE_URL
const key = fromEnv(import.meta.env.VITE_SUPABASE_ANON_KEY) || SUPABASE_ANON_KEY

export const isConfigured = Boolean(url && key)

export const supabase: SupabaseClient | null = isConfigured
  ? createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        flowType: 'implicit',
      },
    })
  : null

export function getSupabase(): SupabaseClient {
  if (!supabase) {
    throw new Error('Supabase não configurado')
  }
  return supabase
}
