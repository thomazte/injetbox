import { useEffect, useState, type FormEvent } from 'react'
import { Field } from '../components/Field'
import { SuggestField } from '../components/SuggestField'
import { useAuth } from '../context/AuthContext'
import { getSupabase, isConfigured } from '../lib/supabase'
import { applyTenantTheme } from '../lib/theme'
import type { TenantSettings } from '../types'

type TenantOption = {
  id: string
  name: string
}

type HeaderPreview = {
  name: string
  logoUrl: string
}

function normalizePreviewLogoUrl(raw: string): string {
  const value = raw.trim()
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
      if (fileId) return `https://drive.google.com/uc?export=view&id=${encodeURIComponent(fileId)}`
    }
  } catch {
    return value
  }
  return value
}

export function BrandingScreen({
  onHeaderPreviewChange,
}: {
  onHeaderPreviewChange?: (preview: HeaderPreview | null) => void
}) {
  const { tenantSettings, companyName, isPlatformAdmin, saveTenantSettings } = useAuth()
  const [mode, setMode] = useState<'demo' | 'empresa'>('demo')
  const [tenants, setTenants] = useState<TenantOption[]>([])
  const [selectedTenantId, setSelectedTenantId] = useState('')
  const [selectedTenantName, setSelectedTenantName] = useState('')
  const [company, setCompany] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [primary, setPrimary] = useState('#ff6a00')
  const [background, setBackground] = useState('#0a0a0a')
  const [backgroundAlt, setBackgroundAlt] = useState('#070707')
  const [surface, setSurface] = useState('#161616')
  const [text, setText] = useState('#ffffff')
  const [muted, setMuted] = useState('#c4c4c4')
  const [stockOk, setStockOk] = useState('#2f9e44')
  const [stockOkText, setStockOkText] = useState('#ffffff')
  const [stockLow, setStockLow] = useState('#f08c00')
  const [stockLowText, setStockLowText] = useState('#ffffff')
  const [stockZero, setStockZero] = useState('#c92a2a')
  const [stockZeroText, setStockZeroText] = useState('#ffffff')
  const [busy, setBusy] = useState(false)
  const [loadingTenant, setLoadingTenant] = useState(false)
  const [hasTenantTheme, setHasTenantTheme] = useState(true)
  const [themeUpdatedAt, setThemeUpdatedAt] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  function fillClassicTheme() {
    setPrimary('#2563EB')
    setBackground('#0B1220')
    setBackgroundAlt('#111827')
    setSurface('#1F2937')
    setText('#F9FAFB')
    setMuted('#9CA3AF')
    setStockOk('#1E3A8A')
    setStockOkText('#DBEAFE')
    setStockLow('#2563EB')
    setStockLowText('#000000')
    setStockZero('#FFFFFF')
    setStockZeroText('#000000')
  }

  function applyFormValues(settings: TenantSettings | null, fallbackName: string) {
    setCompany(settings?.company_name || fallbackName || '')
    setLogoUrl(settings?.logo_url || '')
    setPrimary(settings?.primary_color || '#ff6a00')
    setBackground(settings?.background_color || '#0a0a0a')
    setBackgroundAlt(settings?.background_alt_color || '#070707')
    setSurface(settings?.surface_color || '#161616')
    setText(settings?.text_color || '#ffffff')
    setMuted(settings?.muted_color || '#c4c4c4')
    setStockOk(settings?.stock_ok_color || '#2f9e44')
    setStockOkText(settings?.stock_ok_text_color || '#ffffff')
    setStockLow(settings?.stock_low_color || '#f08c00')
    setStockLowText(settings?.stock_low_text_color || '#ffffff')
    setStockZero(settings?.stock_zero_color || '#c92a2a')
    setStockZeroText(settings?.stock_zero_text_color || '#ffffff')
    setHasTenantTheme(Boolean(settings))
    setThemeUpdatedAt(settings?.updated_at || null)
  }

  useEffect(() => {
    if (!isPlatformAdmin || !isConfigured) return
    void (async () => {
      const { data } = await getSupabase().from('tenants').select('id, name').order('name')
      const rows = (data ?? []) as TenantOption[]
      setTenants(rows)
      if (!selectedTenantId && rows.length > 0) {
        setSelectedTenantId(rows[0].id)
        setSelectedTenantName(rows[0].name)
      }
    })()
  }, [isPlatformAdmin, selectedTenantId])

  useEffect(() => {
    if (!selectedTenantId) return
    const selected = tenants.find((item) => item.id === selectedTenantId)
    if (selected) setSelectedTenantName(selected.name)
  }, [selectedTenantId, tenants])

  useEffect(() => {
    if (mode !== 'demo') return
    applyFormValues(tenantSettings, companyName)
    applyTenantTheme(tenantSettings)
  }, [mode, tenantSettings, companyName])

  useEffect(() => {
    if (mode !== 'empresa' || !selectedTenantId || !isConfigured) return
    setLoadingTenant(true)
    setError(null)
    setMessage(null)
    void (async () => {
      const tenantLabel = tenants.find((item) => item.id === selectedTenantId)?.name || 'Empresa'
      const { data, error: loadError } = await getSupabase()
        .from('tenant_settings')
        .select(
          'tenant_id, company_name, logo_url, primary_color, primary_soft_color, background_color, background_alt_color, surface_color, text_color, muted_color, stock_ok_color, stock_ok_text_color, stock_low_color, stock_low_text_color, stock_zero_color, stock_zero_text_color, updated_at',
        )
        .eq('tenant_id', selectedTenantId)
        .maybeSingle()

      if (loadError) {
        setError(loadError.message)
        setLoadingTenant(false)
        return
      }

      applyFormValues((data as TenantSettings | null) ?? null, tenantLabel)
      applyTenantTheme((data as TenantSettings | null) ?? null)
      setLoadingTenant(false)
    })()
  }, [mode, selectedTenantId, tenants])

  useEffect(() => {
    if (!onHeaderPreviewChange) return
    if (mode !== 'empresa') {
      onHeaderPreviewChange(null)
      return
    }
    const nextName = selectedTenantName.trim() || company.trim()
    onHeaderPreviewChange({
      name: nextName,
      logoUrl: normalizePreviewLogoUrl(logoUrl),
    })
  }, [mode, selectedTenantName, company, logoUrl, onHeaderPreviewChange])

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (mode === 'empresa' && !selectedTenantId) {
      setError('Selecione uma empresa para salvar o visual.')
      return
    }
    setBusy(true)
    setError(null)
    setMessage(null)
    try {
      const normalizedLogoUrl = normalizePreviewLogoUrl(logoUrl)
      setLogoUrl(normalizedLogoUrl)
      await saveTenantSettings({
        company_name: company,
        logo_url: normalizedLogoUrl,
        primary_color: primary,
        background_color: background,
        background_alt_color: backgroundAlt,
        surface_color: surface,
        text_color: text,
        muted_color: muted,
        stock_ok_color: stockOk,
        stock_ok_text_color: stockOkText,
        stock_low_color: stockLow,
        stock_low_text_color: stockLowText,
        stock_zero_color: stockZero,
        stock_zero_text_color: stockZeroText,
      }, mode === 'empresa' ? selectedTenantId : undefined)
      if (mode === 'empresa') {
        const { data, error: reloadError } = await getSupabase()
          .from('tenant_settings')
          .select(
            'tenant_id, company_name, logo_url, primary_color, primary_soft_color, background_color, background_alt_color, surface_color, text_color, muted_color, stock_ok_color, stock_ok_text_color, stock_low_color, stock_low_text_color, stock_zero_color, stock_zero_text_color, updated_at',
          )
          .eq('tenant_id', selectedTenantId)
          .maybeSingle()

        if (reloadError) {
          throw new Error(`Tema salvo, mas falhou recarga para conferência: ${reloadError.message}`)
        }
        applyFormValues((data as TenantSettings | null) ?? null, selectedTenantName || company)
        applyTenantTheme((data as TenantSettings | null) ?? null)
        setMessage(`Visual salvo para ${selectedTenantName || company || 'empresa selecionada'}.`)
      } else {
        applyTenantTheme({
          tenant_id: tenantSettings?.tenant_id || '',
          company_name: company,
          logo_url: normalizedLogoUrl,
          primary_color: primary,
          primary_soft_color: null,
          background_color: background,
          background_alt_color: backgroundAlt,
          surface_color: surface,
          text_color: text,
          muted_color: muted,
          stock_ok_color: stockOk,
          stock_ok_text_color: stockOkText,
          stock_low_color: stockLow,
          stock_low_text_color: stockLowText,
          stock_zero_color: stockZero,
          stock_zero_text_color: stockZeroText,
        })
        setHasTenantTheme(true)
        setThemeUpdatedAt(new Date().toISOString())
        setMessage('Tema salvo com sucesso.')
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : typeof err === 'object' && err && 'message' in err && typeof err.message === 'string'
            ? err.message
            : 'Não foi possível salvar o tema.'
      setError(message)
    } finally {
      setBusy(false)
    }
  }

  async function restoreClassicTheme() {
    if (mode === 'empresa' && !selectedTenantId) {
      setError('Selecione uma empresa para restaurar o visual.')
      return
    }
    setBusy(true)
    setError(null)
    setMessage(null)
    fillClassicTheme()
    try {
      await saveTenantSettings(
        {
          company_name: company,
          logo_url: normalizePreviewLogoUrl(logoUrl),
          primary_color: '#2563EB',
          background_color: '#0B1220',
          background_alt_color: '#111827',
          surface_color: '#1F2937',
          text_color: '#F9FAFB',
          muted_color: '#9CA3AF',
          stock_ok_color: '#1E3A8A',
          stock_ok_text_color: '#DBEAFE',
          stock_low_color: '#2563EB',
          stock_low_text_color: '#000000',
          stock_zero_color: '#FFFFFF',
          stock_zero_text_color: '#000000',
        },
        mode === 'empresa' ? selectedTenantId : undefined,
      )
      applyTenantTheme({
        tenant_id: mode === 'empresa' ? selectedTenantId : tenantSettings?.tenant_id || '',
        company_name: company,
        logo_url: logoUrl,
        primary_color: '#2563EB',
        primary_soft_color: null,
        background_color: '#0B1220',
        background_alt_color: '#111827',
        surface_color: '#1F2937',
        text_color: '#F9FAFB',
        muted_color: '#9CA3AF',
        stock_ok_color: '#1E3A8A',
        stock_ok_text_color: '#DBEAFE',
        stock_low_color: '#2563EB',
        stock_low_text_color: '#000000',
        stock_zero_color: '#FFFFFF',
        stock_zero_text_color: '#000000',
      })
      setHasTenantTheme(true)
      setThemeUpdatedAt(new Date().toISOString())
      setMessage(mode === 'empresa' ? 'Visual clássico restaurado para a empresa.' : 'Visual clássico restaurado.')
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : typeof err === 'object' && err && 'message' in err && typeof err.message === 'string'
            ? err.message
            : 'Não foi possível restaurar o visual clássico.'
      setError(message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-4 rounded-3xl border border-white/10 bg-white/5 p-4 lg:mx-8 lg:p-6">
      <h2 className="text-xl font-semibold tracking-tight">Visual da empresa</h2>
      <p className="mt-1 text-sm text-muted">
        Ajuste nome e cores do estabelecimento. O app aplica na hora para este tenant.
      </p>

      <form className="mt-5 space-y-3.5" onSubmit={onSubmit}>
        {isPlatformAdmin && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMode('demo')}
                className={`rounded-xl py-3 text-sm font-semibold ${
                  mode === 'demo' ? 'bg-accent text-white' : 'glass text-muted'
                }`}
              >
                Demonstração
              </button>
              <button
                type="button"
                onClick={() => setMode('empresa')}
                className={`rounded-xl py-3 text-sm font-semibold ${
                  mode === 'empresa' ? 'bg-accent text-white' : 'glass text-muted'
                }`}
              >
                Selecionar empresa
              </button>
            </div>
            {mode === 'empresa' && (
              <SuggestField
                label="Empresa"
                value={selectedTenantName}
                onChange={(value) => {
                  setSelectedTenantName(value)
                  const match = tenants.find((item) => item.name.toLowerCase() === value.trim().toLowerCase())
                  setSelectedTenantId(match?.id ?? '')
                }}
                options={tenants.map((item) => item.name)}
                placeholder="Selecione a empresa"
                required
              />
            )}
          </div>
        )}

        {loadingTenant && mode === 'empresa' && <p className="text-sm text-muted">Carregando visual da empresa…</p>}
        {!loadingTenant && mode === 'empresa' && (
          <p className={`text-xs ${hasTenantTheme ? 'text-muted' : 'text-warn'}`}>
            {hasTenantTheme
              ? `Configuração da empresa carregada${themeUpdatedAt ? ` · atualizada em ${new Date(themeUpdatedAt).toLocaleString('pt-BR')}` : ''}.`
              : 'Empresa sem visual salvo no banco. Exibindo valores padrão até você salvar.'}
          </p>
        )}
        {mode === 'empresa' && (
          <p className="-mt-2 text-[11px] text-muted">
            No topo do app continua aparecendo a empresa da conta atual. Aqui você está editando a empresa selecionada.
          </p>
        )}

        <button
          type="button"
          onClick={() => void restoreClassicTheme()}
          disabled={busy || loadingTenant}
          className="glass w-full rounded-xl py-2.5 text-sm font-semibold text-muted disabled:opacity-60"
        >
          Restaurar visual clássico InjetBox
        </button>

        <Field label="Nome da empresa">
          <input value={company} onChange={(event) => setCompany(event.target.value)} placeholder="Renata Peças Diesel" />
        </Field>

        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Cor principal">
            <input value={primary} onChange={(event) => setPrimary(event.target.value)} />
          </Field>
          <Field label="Fundo principal">
            <input value={background} onChange={(event) => setBackground(event.target.value)} />
          </Field>
          <Field label="Fundo secundário">
            <input value={backgroundAlt} onChange={(event) => setBackgroundAlt(event.target.value)} />
          </Field>
          <Field label="Cor das superfícies">
            <input value={surface} onChange={(event) => setSurface(event.target.value)} />
          </Field>
          <Field label="Cor do texto">
            <input value={text} onChange={(event) => setText(event.target.value)} />
          </Field>
          <Field label="Cor auxiliar (muted)">
            <input value={muted} onChange={(event) => setMuted(event.target.value)} />
          </Field>
        </div>

        <div className="glass rounded-2xl p-3.5">
          <p className="text-[11px] font-semibold tracking-[0.08em] text-muted uppercase">Prévia rápida</p>
          <div className="mt-2 flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-3 py-2">
            <div>
              <p className="text-sm font-semibold">{company || 'Nome da empresa'}</p>
              <p className="text-xs text-muted">catálogo em tempo real</p>
            </div>
            <span className="rounded-lg px-2 py-1 text-xs font-semibold" style={{ background: primary, color: text }}>
              Tema
            </span>
          </div>
        </div>

        <div className="glass rounded-2xl p-3.5">
          <p className="text-[11px] font-semibold tracking-[0.08em] text-muted uppercase">Cores de status do estoque</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            <div
              className="rounded-xl px-3 py-2"
              style={{
                background: `linear-gradient(180deg, color-mix(in srgb, ${stockOk} 82%, white 18%) 0%, ${stockOk} 100%)`,
                color: stockOkText,
              }}
            >
              <p className="text-xs font-semibold">Conformes</p>
              <p className="text-xs opacity-90">Sem alerta</p>
            </div>
            <div
              className="rounded-xl px-3 py-2"
              style={{
                background: `linear-gradient(180deg, color-mix(in srgb, ${stockLow} 82%, white 18%) 0%, ${stockLow} 100%)`,
                color: stockLowText,
              }}
            >
              <p className="text-xs font-semibold">Baixo estoque</p>
              <p className="text-xs opacity-90">Abaixo do mínimo</p>
            </div>
            <div
              className="rounded-xl px-3 py-2"
              style={{
                background: `linear-gradient(180deg, color-mix(in srgb, ${stockZero} 82%, white 18%) 0%, ${stockZero} 100%)`,
                color: stockZeroText,
              }}
            >
              <p className="text-xs font-semibold">Zerado</p>
              <p className="text-xs opacity-90">Sem unidade</p>
            </div>
          </div>

          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <Field label="Conformes - fundo">
              <input value={stockOk} onChange={(event) => setStockOk(event.target.value)} />
            </Field>
            <Field label="Conformes - texto">
              <input value={stockOkText} onChange={(event) => setStockOkText(event.target.value)} />
            </Field>
            <Field label="Baixo - fundo">
              <input value={stockLow} onChange={(event) => setStockLow(event.target.value)} />
            </Field>
            <Field label="Baixo - texto">
              <input value={stockLowText} onChange={(event) => setStockLowText(event.target.value)} />
            </Field>
            <Field label="Zerado - fundo">
              <input value={stockZero} onChange={(event) => setStockZero(event.target.value)} />
            </Field>
            <Field label="Zerado - texto">
              <input value={stockZeroText} onChange={(event) => setStockZeroText(event.target.value)} />
            </Field>
          </div>
        </div>

        {error && <p className="rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}
        {message && <p className="rounded-xl bg-accent-soft px-3 py-2 text-sm text-accent">{message}</p>}
        <button type="submit" disabled={busy} className="w-full rounded-xl bg-accent py-3.5 font-semibold text-white disabled:opacity-70">
          {busy ? 'Salvando...' : mode === 'empresa' ? 'Salvar visual da empresa' : 'Salvar visual'}
        </button>
      </form>
    </div>
  )
}
