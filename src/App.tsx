import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Bell, Boxes, Clock3, LogOut, Palette } from 'lucide-react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { InventoryProvider, useInventory } from './context/InventoryContext'
import { appFeatures, appMode, appModeLabel } from './lib/appMode'
import { isConfigured } from './lib/supabase'
import { APP_NAME, APP_TAGLINE } from './lib/brand'
import { greeting } from './lib/format'
import { CopyrightMark } from './components/CopyrightMark'
import { LoginScreen } from './screens/LoginScreen'
import { StockScreen } from './screens/StockScreen'
import { AlertsScreen } from './screens/AlertsScreen'
import { HistoryScreen } from './screens/HistoryScreen'
import { BrandingScreen } from './screens/BrandingScreen'

type Tab = 'estoque' | 'alertas' | 'historico' | 'visual'
type HeaderPreview = { name: string; logoUrl: string }

const tabs: { id: Tab; label: string; icon: typeof Boxes }[] = [
  { id: 'estoque', label: 'Estoque', icon: Boxes },
  { id: 'alertas', label: 'Alertas', icon: Bell },
  { id: 'historico', label: 'Histórico', icon: Clock3 },
  { id: 'visual', label: 'Visual', icon: Palette },
]

function normalizeLogoUrl(raw: string | null | undefined): string {
  const value = raw?.trim() || ''
  if (!value) return ''
  try {
    const url = new URL(value)
    if (url.hostname.endsWith('ibb.co')) {
      const hostPrefix = url.hostname.slice(0, -'ibb.co'.length)
      const onlyIDots = /^i*\.?i*\.?$/.test(hostPrefix)
      if (onlyIDots) {
        url.hostname = 'i.ibb.co'
        return url.toString()
      }
    }
    if (url.hostname === 'drive.google.com' || url.hostname === 'docs.google.com') {
      const fromPath = url.pathname.match(/\/file\/d\/([^/]+)/)?.[1]
      const fromQuery = url.searchParams.get('id')
      const fileId = fromPath || fromQuery
      if (fileId) {
        return `https://drive.google.com/uc?export=view&id=${encodeURIComponent(fileId)}`
      }
    }
  } catch {
    return value
  }
  return value
}

export default function App() {
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  )
}

function Gate() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="grid min-h-dvh place-items-center text-sm text-muted">Abrindo {APP_NAME}…</div>
    )
  }

  if (!user) {
    return <LoginScreen />
  }

  return (
    <InventoryProvider>
      <Shell />
    </InventoryProvider>
  )
}

function Shell() {
  const { signOut, name, companyName, tenantSettings, isPlatformAdmin } = useAuth()
  const { lowStock, error } = useInventory()
  const [visualHeaderPreview, setVisualHeaderPreview] = useState<HeaderPreview | null>(null)
  const canAccessBranding = isPlatformAdmin && (appMode === 'demo' || import.meta.env.DEV)
  const visibleTabs = useMemo(
    () =>
      tabs.filter((item) => {
        if (item.id === 'alertas') return appFeatures.canSeeAlerts
        if (item.id === 'historico') return appFeatures.canSeeHistory
        if (item.id === 'visual') return appFeatures.canManageBranding && canAccessBranding
        return true
      }),
    [canAccessBranding],
  )
  const [tab, setTab] = useState<Tab>(visibleTabs[0]?.id ?? 'estoque')
  const titles: Record<Tab, string> = {
    estoque: 'Estoque',
    alertas: 'Alertas',
    historico: 'Histórico',
    visual: 'Visual',
  }
  const displayName = companyName || name
  const defaultLogoUrl = normalizeLogoUrl(tenantSettings?.logo_url)
  const headerName = tab === 'visual' && visualHeaderPreview?.name ? visualHeaderPreview.name : displayName
  const headerLogoUrl =
    tab === 'visual' && visualHeaderPreview?.logoUrl
      ? normalizeLogoUrl(visualHeaderPreview.logoUrl)
      : defaultLogoUrl

  useEffect(() => {
    if (!visibleTabs.some((item) => item.id === tab)) {
      setTab(visibleTabs[0]?.id ?? 'estoque')
    }
  }, [tab, visibleTabs])

  return (
    <div className="min-h-dvh lg:flex">
      <aside className="glass-strong hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-white/10 lg:p-5">
        <p className="text-xs font-semibold tracking-[0.14em] text-accent uppercase">{APP_NAME}</p>
        <p className="mt-1 text-lg font-semibold tracking-tight">{APP_TAGLINE}</p>
        <p className="mt-2 inline-flex w-fit rounded-full bg-accent-soft px-2.5 py-1 text-[11px] font-semibold text-accent uppercase">
          {appModeLabel[appMode]}
        </p>
        <nav className="mt-8 flex flex-1 flex-col gap-1">
          {visibleTabs.map((item) => (
            <SideNavButton
              key={item.id}
              label={item.label}
              active={tab === item.id}
              onClick={() => setTab(item.id)}
              icon={<item.icon size={18} />}
              badge={item.id === 'alertas' ? lowStock.length : 0}
            />
          ))}
        </nav>
        <div className="mt-auto space-y-3 pt-6">
          <div>
            <p className="text-sm text-muted">{greeting()}</p>
            <div className="mt-1 flex items-center gap-2.5">
              <BrandLogo src={headerLogoUrl} alt={headerName || APP_NAME} size="sm" />
              {headerName && <p className="text-sm font-medium">{headerName}</p>}
            </div>
          </div>
          {!isConfigured && (
            <p className="text-xs text-muted">Estoque só neste aparelho, na sua conta.</p>
          )}
          <button
            type="button"
            onClick={() => void signOut()}
            className="glass flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted"
          >
            <LogOut size={16} />
            Sair
          </button>
          <CopyrightMark />
        </div>
      </aside>

      <div className="flex min-h-dvh flex-1 flex-col lg:pl-64">
        <header className="flex items-start justify-between px-5 pt-[max(1.5rem,env(safe-area-inset-top))] pb-3 lg:px-8 lg:pt-8">
          <div className="min-w-0">
            <p className="text-sm text-muted lg:hidden">{greeting()}</p>
            <div className="mt-0.5 flex items-center gap-2.5">
              <BrandLogo src={headerLogoUrl} alt={headerName || APP_NAME} />
              <h1 className="truncate text-[28px] leading-tight font-semibold tracking-tight lg:text-[32px]">
                {titles[tab] ?? 'InjetBox'}
              </h1>
            </div>
            <CopyrightMark className="mt-1 lg:hidden" />
          </div>
          <button
            type="button"
            onClick={() => void signOut()}
            className="glass rounded-full p-2 text-muted lg:hidden"
            aria-label="Sair"
          >
            <LogOut size={18} />
          </button>
        </header>

        {error && (
          <p className="mx-4 mb-3 rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger lg:mx-8">
            {error}
          </p>
        )}

        <main className="flex-1 pb-24 lg:px-4 lg:pb-8">
          {tab === 'estoque' && <StockScreen />}
          {tab === 'alertas' && <AlertsScreen />}
          {tab === 'historico' && <HistoryScreen />}
          {tab === 'visual' && <BrandingScreen onHeaderPreviewChange={setVisualHeaderPreview} />}
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-lg px-3 pb-[max(10px,env(safe-area-inset-bottom))] lg:hidden">
        <div className="glass glass-nav flex gap-1 rounded-3xl p-1">
          {visibleTabs.map((item) => (
            <NavButton
              key={item.id}
              label={item.label}
              active={tab === item.id}
              onClick={() => setTab(item.id)}
              icon={<item.icon size={20} />}
              badge={item.id === 'alertas' ? lowStock.length : 0}
            />
          ))}
        </div>
      </nav>
    </div>
  )
}

function BrandLogo({ src, alt, size = 'md' }: { src: string; alt: string; size?: 'sm' | 'md' }) {
  const [failed, setFailed] = useState(false)
  const dimension = size === 'sm' ? 'h-8 w-8 rounded-lg' : 'h-9 w-9 rounded-xl'

  useEffect(() => {
    setFailed(false)
  }, [src])

  if (!src || failed) {
    return (
      <span
        aria-hidden="true"
        className={`glass inline-flex shrink-0 items-center justify-center ${dimension} text-[10px] font-semibold text-muted`}
      >
        IB
      </span>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      className={`shrink-0 border border-white/10 bg-transparent object-contain ${dimension}`}
      loading="eager"
      fetchPriority="high"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  )
}

function NavButton({
  label,
  icon,
  active,
  onClick,
  badge = 0,
}: {
  label: string
  icon: ReactNode
  active: boolean
  onClick: () => void
  badge?: number
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex flex-1 flex-col items-center gap-1 rounded-2xl py-2 text-[11px] font-semibold ${
        active ? 'bg-accent-soft text-accent' : 'text-muted'
      }`}
    >
      {icon}
      {label}
      {badge > 0 && (
        <span className="absolute top-1.5 right-[22%] min-w-4 rounded-full bg-accent px-1 text-[10px] leading-4 text-white">
          {badge}
        </span>
      )}
    </button>
  )
}

function SideNavButton({
  label,
  icon,
  active,
  onClick,
  badge = 0,
}: {
  label: string
  icon: ReactNode
  active: boolean
  onClick: () => void
  badge?: number
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold ${
        active ? 'bg-accent-soft text-accent' : 'text-muted hover:bg-white/5 hover:text-ink'
      }`}
    >
      {icon}
      {label}
      {badge > 0 && (
        <span className="ml-auto min-w-5 rounded-full bg-accent px-1.5 text-center text-[11px] leading-5 text-white">
          {badge}
        </span>
      )}
    </button>
  )
}
