import { useState, type ReactNode } from 'react'
import { Bell, Boxes, Clock3, LogOut } from 'lucide-react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { InventoryProvider, useInventory } from './context/InventoryContext'
import { isConfigured } from './lib/supabase'
import { APP_NAME, APP_TAGLINE } from './lib/brand'
import { greeting } from './lib/format'
import { CopyrightMark } from './components/CopyrightMark'
import { LoginScreen } from './screens/LoginScreen'
import { StockScreen } from './screens/StockScreen'
import { AlertsScreen } from './screens/AlertsScreen'
import { HistoryScreen } from './screens/HistoryScreen'

type Tab = 'estoque' | 'alertas' | 'historico'

const tabs: { id: Tab; label: string; icon: typeof Boxes }[] = [
  { id: 'estoque', label: 'Estoque', icon: Boxes },
  { id: 'alertas', label: 'Alertas', icon: Bell },
  { id: 'historico', label: 'Histórico', icon: Clock3 },
]

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
  const { signOut, name } = useAuth()
  const { lowStock, error } = useInventory()
  const [tab, setTab] = useState<Tab>('estoque')
  const titles = {
    estoque: 'Estoque',
    alertas: 'Alertas',
    historico: 'Histórico',
  }

  return (
    <div className="min-h-dvh lg:flex">
      <aside className="glass-strong hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-white/10 lg:p-5">
        <p className="text-xs font-semibold tracking-[0.14em] text-accent uppercase">{APP_NAME}</p>
        <p className="mt-1 text-lg font-semibold tracking-tight">{APP_TAGLINE}</p>
        <nav className="mt-8 flex flex-1 flex-col gap-1">
          {tabs.map((item) => (
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
            {name && <p className="text-sm font-medium">{name}</p>}
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
          <div>
            <p className="text-sm text-muted lg:hidden">{greeting()}</p>
            <h1 className="text-[28px] leading-tight font-semibold tracking-tight lg:text-[32px]">
              {titles[tab]}
            </h1>
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
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-lg px-3 pb-[max(10px,env(safe-area-inset-bottom))] lg:hidden">
        <div className="glass glass-nav flex gap-1 rounded-3xl p-1">
          {tabs.map((item) => (
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
