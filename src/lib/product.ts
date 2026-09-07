import type { Movement, Product } from '../types'

type LooseRecord = Record<string, unknown>

function text(value: unknown): string {
  if (value == null) return ''
  return String(value).trim()
}

function number(value: unknown): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

export const DEFAULT_CATEGORY = 'Porta Injetor'

export function normalizeProduct(row: LooseRecord): Product {
  const tipo = text(row.tipo)
  const storedCategory = text(row.category)
  const legacyTipo = !tipo && storedCategory && storedCategory !== DEFAULT_CATEGORY

  return {
    id: text(row.id) || crypto.randomUUID(),
    code: text(row.code) || null,
    brand: text(row.brand) || text(row.name),
    tipo: tipo || (legacyTipo ? storedCategory : '') || 'Geral',
    category: legacyTipo ? DEFAULT_CATEGORY : 'category' in row ? storedCategory : DEFAULT_CATEGORY,
    quantity: number(row.quantity),
    min_quantity: number(row.min_quantity),
    unit: text(row.unit) || 'un',
    notes: text(row.notes) || null,
    created_at: text(row.created_at) || new Date().toISOString(),
    updated_at: text(row.updated_at) || new Date().toISOString(),
  }
}

export function normalizeMovement(row: LooseRecord): Movement {
  return {
    id: text(row.id) || crypto.randomUUID(),
    product_id: text(row.product_id),
    type: (row.type as Movement['type']) || 'ajuste',
    quantity: number(row.quantity),
    previous_quantity: number(row.previous_quantity),
    new_quantity: number(row.new_quantity),
    user_id: text(row.user_id) || null,
    user_name: text(row.user_name) || 'Você',
    notes: text(row.notes) || null,
    created_at: text(row.created_at) || new Date().toISOString(),
    product_brand: text(row.product_brand) || text(row.product_name) || 'Peça removida',
    product_code: text(row.product_code) || null,
  }
}

export function productTitle(product: Pick<Product, 'code' | 'brand'>): string {
  return product.code || product.brand || 'Peça'
}
