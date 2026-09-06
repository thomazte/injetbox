import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session } from '@supabase/supabase-js'
import { authCaught, authMessage } from '../lib/authErrors'
import {
  clearLocalSession,
  localSignIn,
  localSignUp,
  readLocalSession,
} from '../lib/localAuth'
import { getSupabase, isConfigured } from '../lib/supabase'
import { applyTenantTheme } from '../lib/theme'
import type { TenantSettings } from '../types'

type AuthUser = {
  id: string
  email?: string
}

type AuthContextValue = {
  user: AuthUser | null
  session: Session | null
  name: string
  tenantId: string | null
  companyName: string
  tenantSettings: TenantSettings | null
  loading: boolean
  error: string | null
  notice: string | null
  signIn: (email: string, password: string) => Promise<void>
  signUp: (name: string, email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [localUser, setLocalUser] = useState<AuthUser | null>(null)
  const [name, setName] = useState('')
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [companyName, setCompanyName] = useState('')
  const [tenantSettings, setTenantSettings] = useState<TenantSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    if (!isConfigured) {
      const restored = readLocalSession()
      setLocalUser(restored ? { id: restored.id, email: restored.email } : null)
      setName(restored?.name ?? '')
      setTenantId(restored?.id ?? null)
      setCompanyName(restored?.name ?? '')
      setTenantSettings(null)
      applyTenantTheme(null)
      setLoading(false)
      return
    }

    const client = getSupabase()
    let settled = false
    const finish = (next: Session | null) => {
      setSession(next)
      if (!settled) {
        settled = true
        setLoading(false)
      }
    }

    const { data: listener } = client.auth.onAuthStateChange((_event, next) => {
      finish(next)
    })

    const timer = window.setTimeout(() => {
      if (!settled) setLoading(false)
    }, 2500)

    return () => {
      listener.subscription.unsubscribe()
      window.clearTimeout(timer)
    }
  }, [])

  useEffect(() => {
    if (!isConfigured) return
    const user = session?.user
    if (!user) {
      setName('')
      setTenantId(null)
      setCompanyName('')
      setTenantSettings(null)
      applyTenantTheme(null)
      return
    }

    const fallback =
      (typeof user.user_metadata.name === 'string' ? user.user_metadata.name : undefined) ||
      user.email?.split('@')[0] ||
      'Usuário'
    setName(fallback)

    void (async () => {
      const client = getSupabase()
      const { data: profile } = await client
        .from('profiles')
        .select('name, tenant_id')
        .eq('id', user.id)
        .maybeSingle()

      const profileName = typeof profile?.name === 'string' && profile.name.trim() ? profile.name : fallback
      setName(profileName)
      const nextTenantId = profile?.tenant_id ?? null
      setTenantId(nextTenantId)

      if (!nextTenantId) {
        setCompanyName(profileName)
        setTenantSettings(null)
        applyTenantTheme(null)
        return
      }

      const { data: settings } = await client
        .from('tenant_settings')
        .select(
          'tenant_id, company_name, logo_url, primary_color, primary_soft_color, background_color, text_color, muted_color',
        )
        .eq('tenant_id', nextTenantId)
        .maybeSingle()

      const nextSettings = (settings as TenantSettings | null) ?? null
      setTenantSettings(nextSettings)
      const label = nextSettings?.company_name?.trim() || profileName
      setCompanyName(label)
      applyTenantTheme(nextSettings)
    })()
  }, [session])

  const cloudUser = useMemo<AuthUser | null>(() => {
    if (!session?.user) return null
    return { id: session.user.id, email: session.user.email }
  }, [session])
  const user = isConfigured ? cloudUser : localUser

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      name,
      tenantId,
      companyName,
      tenantSettings,
      loading,
      error,
      notice,
      async signIn(email, password) {
        setError(null)
        setNotice(null)
        const cleanEmail = email.trim().toLowerCase()
        const cleanPassword = password.trim()
        if (!isConfigured) {
          try {
            const next = await localSignIn(cleanEmail, cleanPassword)
            setLocalUser({ id: next.id, email: next.email })
            setName(next.name)
            setTenantId(next.id)
            setCompanyName(next.name)
            setTenantSettings(null)
            applyTenantTheme(null)
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Não foi possível entrar.')
          }
          return
        }

        try {
          const { data, error: nextError } = await getSupabase().auth.signInWithPassword({
            email: cleanEmail,
            password: cleanPassword,
          })
          if (nextError) {
            setError(authMessage(nextError.message))
            return
          }
          if (data.session) setSession(data.session)
        } catch (err) {
          setError(authCaught(err))
        }
      },
      async signUp(nextName, email, password) {
        setError(null)
        setNotice(null)
        const cleanEmail = email.trim().toLowerCase()
        const cleanPassword = password.trim()
        if (!isConfigured) {
          try {
            const next = await localSignUp(nextName, cleanEmail, cleanPassword)
            setLocalUser({ id: next.id, email: next.email })
            setName(next.name)
            setTenantId(next.id)
            setCompanyName(next.name)
            setTenantSettings(null)
            applyTenantTheme(null)
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Não foi possível criar a conta.')
          }
          return
        }

        try {
          const { data, error: nextError } = await getSupabase().auth.signUp({
            email: cleanEmail,
            password: cleanPassword,
            options: { data: { name: nextName } },
          })
          if (nextError) {
            setError(authMessage(nextError.message))
            return
          }
          setName(nextName)
          if (data.session) {
            setSession(data.session)
            return
          }
          setNotice('Conta criada. Entre com seu e-mail e senha.')
        } catch (err) {
          setError(authCaught(err))
        }
      },
      async signOut() {
        setError(null)
        setNotice(null)
        if (!isConfigured) {
          clearLocalSession()
          setLocalUser(null)
          setName('')
          setTenantId(null)
          setCompanyName('')
          setTenantSettings(null)
          applyTenantTheme(null)
          return
        }
        try {
          await getSupabase().auth.signOut()
        } catch {
          /* sessão local some mesmo se a rede falhar */
        }
        setSession(null)
        setName('')
        setTenantId(null)
        setCompanyName('')
        setTenantSettings(null)
        applyTenantTheme(null)
      },
    }),
    [user, session, name, tenantId, companyName, tenantSettings, loading, error, notice],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext)
  if (!value) {
    throw new Error('useAuth precisa estar dentro de AuthProvider')
  }
  return value
}
