import type { TenantSettings } from '../types'

type ThemeVars = {
  accent: string
  accentSoft: string
  paper: string
  ink: string
  muted: string
}

const defaults: ThemeVars = {
  accent: '#ff6a00',
  accentSoft: 'rgba(255, 106, 0, 0.18)',
  paper: '#0a0a0a',
  ink: '#ffffff',
  muted: '#c4c4c4',
}

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
    paper: settings.background_color || defaults.paper,
    ink: settings.text_color || defaults.ink,
    muted: settings.muted_color || defaults.muted,
  }
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
  root.style.setProperty('--color-ok', theme.accent)
  root.style.setProperty('--color-ok-soft', theme.accentSoft)
  root.style.setProperty('--color-paper', theme.paper)
  root.style.setProperty('--color-ink', theme.ink)
  root.style.setProperty('--color-muted', theme.muted)
}
