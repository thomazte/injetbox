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
import type { Profile, TenantSettings } from '../types'

type AuthUser = {
  id: string
  email?: string
}

type AuthContextValue = {
  user: AuthUser | null
  session: Session | null
  name: string
  isAdmin: boolean
  isPlatformAdmin: boolean
  tenantId: string | null
  companyName: string
  tenantSettings: TenantSettings | null
  loading: boolean
  error: string | null
  notice: string | null
  saveTenantSettings: (
    input: Partial<Omit<TenantSettings, 'tenant_id'>>,
    targetTenantId?: string,
  ) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signUp: (name: string, email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [localUser, setLocalUser] = useState<AuthUser | null>(null)
  const [name, setName] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false)
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
      setIsAdmin(true)
      setIsPlatformAdmin(true)
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
      setIsAdmin(false)
      setIsPlatformAdmin(false)
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
        .select('name, tenant_id, is_admin, is_platform_admin')
        .eq('id', user.id)
        .maybeSingle()

      const typedProfile = profile as Profile | null
      const profileName = typeof typedProfile?.name === 'string' && typedProfile.name.trim() ? typedProfile.name : fallback
      setName(profileName)
      setIsAdmin(Boolean(typedProfile?.is_admin))
      setIsPlatformAdmin(Boolean(typedProfile?.is_platform_admin))
      const nextTenantId = typedProfile?.tenant_id ?? null
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
          'tenant_id, company_name, logo_url, primary_color, primary_soft_color, background_color, background_alt_color, surface_color, text_color, muted_color, stock_ok_color, stock_ok_text_color, stock_low_color, stock_low_text_color, stock_zero_color, stock_zero_text_color',
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
      isAdmin,
      isPlatformAdmin,
      tenantId,
      companyName,
      tenantSettings,
      loading,
      error,
      notice,
      async saveTenantSettings(input, targetTenantId) {
        setError(null)
        if (!isAdmin && !isPlatformAdmin) {
          throw new Error('Somente administrador pode alterar o visual da empresa.')
        }
        const fallbackTenant = tenantId || user?.id || null
        const effectiveTenant = isPlatformAdmin && targetTenantId ? targetTenantId : fallbackTenant
        if (!effectiveTenant) {
          throw new Error('Tenant não encontrado para salvar o tema.')
        }

        const cleaned = {
          company_name: input.company_name?.trim() || null,
          logo_url: input.logo_url?.trim() || null,
          primary_color: input.primary_color?.trim() || null,
          primary_soft_color: input.primary_soft_color?.trim() || null,
          background_color: input.background_color?.trim() || null,
          background_alt_color: input.background_alt_color?.trim() || null,
          surface_color: input.surface_color?.trim() || null,
          text_color: input.text_color?.trim() || null,
          muted_color: input.muted_color?.trim() || null,
          stock_ok_color: input.stock_ok_color?.trim() || null,
          stock_ok_text_color: input.stock_ok_text_color?.trim() || null,
          stock_low_color: input.stock_low_color?.trim() || null,
          stock_low_text_color: input.stock_low_text_color?.trim() || null,
          stock_zero_color: input.stock_zero_color?.trim() || null,
          stock_zero_text_color: input.stock_zero_text_color?.trim() || null,
        }

        if (!isConfigured) {
          const next: TenantSettings = {
            tenant_id: effectiveTenant,
            company_name: cleaned.company_name,
            logo_url: cleaned.logo_url,
            primary_color: cleaned.primary_color,
            primary_soft_color: cleaned.primary_soft_color,
            background_color: cleaned.background_color,
            text_color: cleaned.text_color,
            muted_color: cleaned.muted_color,
            background_alt_color: cleaned.background_alt_color,
            surface_color: cleaned.surface_color,
            stock_ok_color: cleaned.stock_ok_color,
            stock_ok_text_color: cleaned.stock_ok_text_color,
            stock_low_color: cleaned.stock_low_color,
            stock_low_text_color: cleaned.stock_low_text_color,
            stock_zero_color: cleaned.stock_zero_color,
            stock_zero_text_color: cleaned.stock_zero_text_color,
          }
          if (effectiveTenant === tenantId) {
            setTenantSettings(next)
            setCompanyName(next.company_name || name)
            applyTenantTheme(next)
          }
          return
        }

        const client = getSupabase()
        const { data, error: nextError } = await client
          .from('tenant_settings')
          .upsert(
            {
              tenant_id: effectiveTenant,
              ...cleaned,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'tenant_id' },
          )
          .select(
            'tenant_id, company_name, logo_url, primary_color, primary_soft_color, background_color, background_alt_color, surface_color, text_color, muted_color, stock_ok_color, stock_ok_text_color, stock_low_color, stock_low_text_color, stock_zero_color, stock_zero_text_color',
          )
          .single()

        if (nextError) {
          setError(nextError.message)
          throw new Error(nextError.message)
        }

        const next = data as TenantSettings
        if (effectiveTenant === tenantId) {
          setTenantSettings(next)
          setCompanyName(next.company_name?.trim() || name)
          applyTenantTheme(next)
        }
      },
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
            setIsAdmin(true)
            setIsPlatformAdmin(true)
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
            setIsAdmin(true)
            setIsPlatformAdmin(true)
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
          setIsAdmin(false)
          setIsPlatformAdmin(false)
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
        setIsAdmin(false)
        setIsPlatformAdmin(false)
        setTenantId(null)
        setCompanyName('')
        setTenantSettings(null)
        applyTenantTheme(null)
      },
    }),
    [
      user,
      session,
      name,
      isAdmin,
      isPlatformAdmin,
      tenantId,
      companyName,
      tenantSettings,
      loading,
      error,
      notice,
    ],
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
