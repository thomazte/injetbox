import type { TenantSettings } from '../types'

type ThemeVars = {
  accent: string
  accentSoft: string
  background: string
  backgroundAlt: string
  surface: string
  ink: string
  muted: string
  okBg: string
  okText: string
  lowBg: string
  lowText: string
  zeroBg: string
  zeroText: string
}

const defaults: ThemeVars = {
  accent: '#ff6a00',
  accentSoft: 'rgba(255, 106, 0, 0.18)',
  background: '#0a0a0a',
  backgroundAlt: '#070707',
  surface: '#161616',
  ink: '#ffffff',
  muted: '#c4c4c4',
  okBg: 'rgba(255, 106, 0, 0.18)',
  okText: '#ff6a00',
  lowBg: '#ff6a00',
  lowText: '#ffffff',
  zeroBg: '#101010',
  zeroText: '#ffffff',
}

const LOGIN_THEME_CACHE_KEY = 'injetbox:login-theme:v1'

function toSoft(color: string): string {
  const hex = color.replace('#', '').trim()
  if (!/^[a-fA-F0-9]{6}$/.test(hex)) return defaults.accentSoft
  const r = Number.parseInt(hex.slice(0, 2), 16)
  const g = Number.parseInt(hex.slice(2, 4), 16)
  const b = Number.parseInt(hex.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, 0.18)`
}

function resolveTheme(settings: TenantSettings | null): ThemeVars {
  if (!settings) return defaults
  const accent = settings.primary_color || defaults.accent
  return {
    accent,
    accentSoft: settings.primary_soft_color || toSoft(accent),
    background: settings.background_color || defaults.background,
    backgroundAlt: settings.background_alt_color || defaults.backgroundAlt,
    surface: settings.surface_color || defaults.surface,
    ink: settings.text_color || defaults.ink,
    muted: settings.muted_color || defaults.muted,
    okBg: settings.stock_ok_color || defaults.okBg,
    okText: settings.stock_ok_text_color || defaults.okText,
    lowBg: settings.stock_low_color || defaults.lowBg,
    lowText: settings.stock_low_text_color || defaults.lowText,
    zeroBg: settings.stock_zero_color || defaults.zeroBg,
    zeroText: settings.stock_zero_text_color || defaults.zeroText,
  }
}

function cleanColor(input: unknown): string | null {
  if (typeof input !== 'string') return null
  const value = input.trim()
  return value || null
}

export function saveLoginThemeSnapshot(settings: TenantSettings | null) {
  if (typeof window === 'undefined') return
  if (!settings) {
    window.localStorage.removeItem(LOGIN_THEME_CACHE_KEY)
    return
  }
  const snapshot: TenantSettings = {
    tenant_id: settings.tenant_id || 'login-theme',
    company_name: typeof settings.company_name === 'string' ? settings.company_name : null,
    logo_url: null,
    primary_color: cleanColor(settings.primary_color),
    primary_soft_color: cleanColor(settings.primary_soft_color),
    background_color: cleanColor(settings.background_color),
    background_alt_color: cleanColor(settings.background_alt_color),
    surface_color: cleanColor(settings.surface_color),
    text_color: cleanColor(settings.text_color),
    muted_color: cleanColor(settings.muted_color),
    stock_ok_color: cleanColor(settings.stock_ok_color),
    stock_ok_text_color: cleanColor(settings.stock_ok_text_color),
    stock_low_color: cleanColor(settings.stock_low_color),
    stock_low_text_color: cleanColor(settings.stock_low_text_color),
    stock_zero_color: cleanColor(settings.stock_zero_color),
    stock_zero_text_color: cleanColor(settings.stock_zero_text_color),
    updated_at: typeof settings.updated_at === 'string' ? settings.updated_at : null,
  }
  try {
    window.localStorage.setItem(LOGIN_THEME_CACHE_KEY, JSON.stringify(snapshot))
  } catch {
    /* sem storage disponível, ignora */
  }
}

export function readLoginThemeSnapshot(): TenantSettings | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(LOGIN_THEME_CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<TenantSettings> | null
    if (!parsed || typeof parsed !== 'object') return null
    return {
      tenant_id: typeof parsed.tenant_id === 'string' && parsed.tenant_id.trim() ? parsed.tenant_id : 'login-theme',
      company_name: typeof parsed.company_name === 'string' ? parsed.company_name : null,
      logo_url: null,
      primary_color: cleanColor(parsed.primary_color),
      primary_soft_color: cleanColor(parsed.primary_soft_color),
      background_color: cleanColor(parsed.background_color),
      background_alt_color: cleanColor(parsed.background_alt_color),
      surface_color: cleanColor(parsed.surface_color),
      text_color: cleanColor(parsed.text_color),
      muted_color: cleanColor(parsed.muted_color),
      stock_ok_color: cleanColor(parsed.stock_ok_color),
      stock_ok_text_color: cleanColor(parsed.stock_ok_text_color),
      stock_low_color: cleanColor(parsed.stock_low_color),
      stock_low_text_color: cleanColor(parsed.stock_low_text_color),
      stock_zero_color: cleanColor(parsed.stock_zero_color),
      stock_zero_text_color: cleanColor(parsed.stock_zero_text_color),
      updated_at: typeof parsed.updated_at === 'string' ? parsed.updated_at : null,
    }
  } catch {
    return null
  }
}

export function applyLoginThemeSnapshot() {
  applyTenantTheme(readLoginThemeSnapshot())
}

export function applyTenantTheme(settings: TenantSettings | null) {
  if (typeof document === 'undefined') return
  const theme = resolveTheme(settings)
  const root = document.documentElement
  root.style.setProperty('--color-accent', theme.accent)
  root.style.setProperty('--color-accent-soft', theme.accentSoft)
  root.style.setProperty('--color-warn', theme.accent)
  root.style.setProperty('--color-warn-soft', theme.accentSoft)
  root.style.setProperty('--color-danger', theme.accent)
  root.style.setProperty('--color-danger-soft', theme.accentSoft)
  root.style.setProperty('--color-ok', theme.okText)
  root.style.setProperty('--color-ok-soft', theme.okBg)
  root.style.setProperty('--color-paper', theme.background)
  root.style.setProperty('--color-ink', theme.ink)
  root.style.setProperty('--color-muted', theme.muted)
  root.style.setProperty('--app-bg', theme.background)
  root.style.setProperty('--app-bg-alt', theme.backgroundAlt)
  root.style.setProperty('--app-surface', theme.surface)
  root.style.setProperty('--status-ok-bg', theme.okBg)
  root.style.setProperty('--status-ok-text', theme.okText)
  root.style.setProperty('--status-low-bg', theme.lowBg)
  root.style.setProperty('--status-low-text', theme.lowText)
  root.style.setProperty('--status-zero-bg', theme.zeroBg)
  root.style.setProperty('--status-zero-text', theme.zeroText)
}
