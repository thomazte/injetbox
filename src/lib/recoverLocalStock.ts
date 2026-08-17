import { normalizeMovement, normalizeProduct } from './product'
import type { Movement, Product } from '../types'

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function longest<T>(lists: T[][]): T[] {
  return lists.reduce((best, item) => (item.length > best.length ? item : best), [] as T[])
}

export function readRecoveredLocalStock(): { products: Product[]; movements: Movement[] } {
  const productLists: Product[][] = []
  const movementLists: Movement[][] = []

  const legacyProducts = readJson<Record<string, unknown>[]>('carcacas.products')
  if (legacyProducts?.length) productLists.push(legacyProducts.map(normalizeProduct))
  const legacyMovements = readJson<Record<string, unknown>[]>('carcacas.movements')
  if (legacyMovements?.length) movementLists.push(legacyMovements.map(normalizeMovement))

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (!key) continue
    if (key.startsWith('injetbox.products.')) {
      const rows = readJson<Record<string, unknown>[]>(key)
      if (rows?.length) productLists.push(rows.map(normalizeProduct))
    }
    if (key.startsWith('injetbox.movements.')) {
      const rows = readJson<Record<string, unknown>[]>(key)
      if (rows?.length) movementLists.push(rows.map(normalizeMovement))
    }
  }

  return {
    products: longest(productLists),
    movements: longest(movementLists),
  }
}
