export type MovementType = 'entrada' | 'saida' | 'ajuste'

export type Product = {
  id: string
  code: string | null
  brand: string
  tipo: string
  category: string
  quantity: number
  min_quantity: number
  unit: string
  notes: string | null
  created_at: string
  updated_at: string
}

export type Movement = {
  id: string
  product_id: string
  type: MovementType
  quantity: number
  previous_quantity: number
  new_quantity: number
  user_id: string | null
  user_name: string
  notes: string | null
  created_at: string
  product_brand: string
  product_code: string | null
}

export type StockStatus = 'ok' | 'baixo' | 'zerado'

export type ColumnMapping = {
  brand: string
  code: string | ''
  tipo: string | ''
  category: string | ''
  quantity: string | ''
  min_quantity: string | ''
  unit: string | ''
  notes: string | ''
}

export type ParsedSheet = {
  headers: string[]
  rows: Record<string, unknown>[]
  mapping: ColumnMapping
}

export type ProductDraft = {
  brand: string
  code: string
  tipo: string
  category: string
  quantity: number
  min_quantity: number
  unit: string
  notes: string
}
