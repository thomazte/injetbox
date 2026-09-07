export type MovementType = 'entrada' | 'saida' | 'ajuste'

export type Product = {
  id: string
  tenant_id?: string | null
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
  tenant_id?: string | null
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

export type TenantSettings = {
  tenant_id: string
  company_name: string | null
  logo_url: string | null
  primary_color: string | null
  primary_soft_color: string | null
  background_color: string | null
  background_alt_color: string | null
  surface_color: string | null
  text_color: string | null
  muted_color: string | null
  stock_ok_color: string | null
  stock_ok_text_color: string | null
  stock_low_color: string | null
  stock_low_text_color: string | null
  stock_zero_color: string | null
  stock_zero_text_color: string | null
  updated_at?: string | null
}

export type Profile = {
  id: string
  tenant_id: string
  name: string
  is_admin: boolean
  is_platform_admin?: boolean
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
