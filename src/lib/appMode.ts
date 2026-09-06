export type AppMode = 'demo' | 'operacao' | 'catalogo'

export type AppFeatures = {
  canSeeAlerts: boolean
  canSeeHistory: boolean
  canSearchHistory: boolean
  canCreateProducts: boolean
  canImportProducts: boolean
  canEditProducts: boolean
  canDeleteProducts: boolean
  canMoveStock: boolean
}

const modeByName: Record<string, AppMode> = {
  demo: 'demo',
  operacao: 'operacao',
  catalogo: 'catalogo',
}

const rawMode = String(import.meta.env.VITE_APP_MODE || 'operacao').trim().toLowerCase()

export const appMode: AppMode = modeByName[rawMode] || 'operacao'

export const appFeaturesByMode: Record<AppMode, AppFeatures> = {
  demo: {
    canSeeAlerts: true,
    canSeeHistory: true,
    canSearchHistory: true,
    canCreateProducts: true,
    canImportProducts: true,
    canEditProducts: true,
    canDeleteProducts: false,
    canMoveStock: true,
  },
  operacao: {
    canSeeAlerts: true,
    canSeeHistory: true,
    canSearchHistory: true,
    canCreateProducts: true,
    canImportProducts: true,
    canEditProducts: true,
    canDeleteProducts: true,
    canMoveStock: true,
  },
  catalogo: {
    canSeeAlerts: false,
    canSeeHistory: false,
    canSearchHistory: false,
    canCreateProducts: false,
    canImportProducts: false,
    canEditProducts: false,
    canDeleteProducts: false,
    canMoveStock: false,
  },
}

export const appFeatures = appFeaturesByMode[appMode]

export const appModeLabel: Record<AppMode, string> = {
  demo: 'Demonstracao',
  operacao: 'Operacao',
  catalogo: 'Catalogo',
}
