import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { movementsKey, productsKey } from '../lib/localAuth'
import { readRecoveredLocalStock } from '../lib/recoverLocalStock'
import { getSupabase, isConfigured } from '../lib/supabase'
import { stockStatus } from '../lib/format'
import { normalizeMovement, normalizeProduct } from '../lib/product'
import type { Movement, MovementType, Product, ProductDraft } from '../types'
import { useAuth } from './AuthContext'

type InventoryContextValue = {
  products: Product[]
  movements: Movement[]
  loading: boolean
  error: string | null
  tipos: string[]
  categories: string[]
  brands: string[]
  codes: string[]
  lowStock: Product[]
  registerMovement: (
    productId: string,
    type: Exclude<MovementType, 'ajuste'>,
    quantity: number,
    notes?: string,
  ) => Promise<void>
  saveProduct: (draft: ProductDraft, productId?: string) => Promise<void>
  deleteProduct: (productId: string) => Promise<void>
  importProducts: (drafts: ProductDraft[]) => Promise<number>
}

type MovementRow = Movement & {
  products:
    | { brand?: string; name?: string; code: string | null }
    | { brand?: string; name?: string; code: string | null }[]
    | null
}

const InventoryContext = createContext<InventoryContextValue | null>(null)

function mapMovement(row: MovementRow): Movement {
  const product = Array.isArray(row.products) ? row.products[0] : row.products
  return normalizeMovement({
    ...row,
    product_brand: product?.brand ?? product?.name ?? row.product_brand,
    product_code: product?.code ?? row.product_code,
  })
}

function sortProducts(items: Product[]): Product[] {
  return [...items].sort((a, b) => {
    const codeCompare = (a.code ?? '').localeCompare(b.code ?? '', 'pt-BR')
    if (codeCompare !== 0) return codeCompare
    return a.brand.localeCompare(b.brand, 'pt-BR')
  })
}

function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function writeLocal(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value))
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR'))
}

function nowIso() {
  return new Date().toISOString()
}

function toDraftProduct(draft: ProductDraft, productId?: string, createdAt?: string): Product {
  return {
    id: productId ?? crypto.randomUUID(),
    brand: draft.brand.trim(),
    code: draft.code.trim() || null,
    tipo: draft.tipo.trim() || 'Geral',
    category: draft.category.trim(),
    quantity: draft.quantity,
    min_quantity: draft.min_quantity,
    unit: draft.unit.trim() || 'un',
    notes: draft.notes.trim() || null,
    created_at: createdAt ?? nowIso(),
    updated_at: nowIso(),
  }
}

export function InventoryProvider({ children }: { children: ReactNode }) {
  const { user, name } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [movements, setMovements] = useState<Movement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const persistLocal = useCallback(
    (nextProducts: Product[], nextMovements: Movement[]) => {
      if (!user) return
      setProducts(nextProducts)
      setMovements(nextMovements)
      writeLocal(productsKey(user.id), nextProducts)
      writeLocal(movementsKey(user.id), nextMovements)
    },
    [user],
  )

  const load = useCallback(async () => {
    if (!user) return

    if (!isConfigured) {
      const nextProducts = sortProducts(
        readLocal<Record<string, unknown>[]>(productsKey(user.id), []).map(normalizeProduct),
      )
      const nextMovements = readLocal<Record<string, unknown>[]>(movementsKey(user.id), []).map(
        normalizeMovement,
      )
      setProducts(nextProducts)
      setMovements(nextMovements)
      writeLocal(productsKey(user.id), nextProducts)
      writeLocal(movementsKey(user.id), nextMovements)
      return
    }

    const client = getSupabase()
    const [{ data: productRows, error: productError }, { data: movementRows, error: movementError }] =
      await Promise.all([
        client.from('products').select('*').eq('user_id', user.id).order('code'),
        client
          .from('movements')
          .select('*, products(brand, code)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(200),
      ])

    if (productError) throw productError
    if (movementError) throw movementError

    let nextProducts = (productRows ?? []).map((row) => normalizeProduct(row as Record<string, unknown>))
    let nextMovements = (movementRows ?? []).map((row) => mapMovement(row as MovementRow))

    if (nextProducts.length === 0) {
      const recovered = readRecoveredLocalStock()
      if (recovered.products.length > 0) {
        const { error: insertProductError } = await client.from('products').insert(
          recovered.products.map((row) => ({
            id: row.id,
            user_id: user.id,
            code: row.code,
            brand: row.brand,
            tipo: row.tipo,
            category: row.category,
            quantity: row.quantity,
            min_quantity: row.min_quantity,
            unit: row.unit,
            notes: row.notes,
            created_at: row.created_at,
            updated_at: row.updated_at,
          })),
        )
        if (insertProductError) throw insertProductError

        if (recovered.movements.length > 0) {
          const { error: insertMovementError } = await client.from('movements').insert(
            recovered.movements.map((row) => ({
              id: row.id,
              user_id: user.id,
              product_id: row.product_id,
              type: row.type,
              quantity: row.quantity,
              previous_quantity: row.previous_quantity,
              new_quantity: row.new_quantity,
              user_name: row.user_name === 'Você' ? name || 'Usuário' : row.user_name,
              notes: row.notes,
              created_at: row.created_at,
            })),
          )
          if (insertMovementError) throw insertMovementError
        }

        const reloaded = await Promise.all([
          client.from('products').select('*').eq('user_id', user.id).order('code'),
          client
            .from('movements')
            .select('*, products(brand, code)')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(200),
        ])
        if (reloaded[0].error) throw reloaded[0].error
        if (reloaded[1].error) throw reloaded[1].error
        nextProducts = (reloaded[0].data ?? []).map((row) =>
          normalizeProduct(row as Record<string, unknown>),
        )
        nextMovements = (reloaded[1].data ?? []).map((row) => mapMovement(row as MovementRow))
      }
    }

    setProducts(sortProducts(nextProducts))
    setMovements(nextMovements)
  }, [user, name])

  useEffect(() => {
    if (!user) return

    let cancelled = false
    setLoading(true)
    load()
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Falha ao carregar o estoque')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    if (!isConfigured) {
      return () => {
        cancelled = true
      }
    }

    const client = getSupabase()
    const channel = client
      .channel(`estoque-sync-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products', filter: `user_id=eq.${user.id}` },
        () => {
          void load()
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'movements', filter: `user_id=eq.${user.id}` },
        () => {
          void load()
        },
      )
      .subscribe()

    return () => {
      cancelled = true
      void client.removeChannel(channel)
    }
  }, [user, load])

  const value = useMemo<InventoryContextValue>(() => {
    const tipos = uniqueSorted(products.map((item) => item.tipo))
    const categories = uniqueSorted(products.map((item) => item.category))
    const brands = uniqueSorted(products.map((item) => item.brand))
    const codes = uniqueSorted(products.map((item) => item.code ?? ''))
    const lowStock = products
      .filter((item) => stockStatus(item) !== 'ok')
      .sort((a, b) => a.quantity - b.quantity)

    return {
      products,
      movements,
      loading,
      error,
      tipos,
      categories,
      brands,
      codes,
      lowStock,
      async registerMovement(productId, type, quantity, notes) {
        setError(null)
        if (!isConfigured) {
          const product = products.find((item) => item.id === productId)
          if (!product) throw new Error('Produto não encontrado')
          const nextQty = type === 'entrada' ? product.quantity + quantity : product.quantity - quantity
          if (nextQty < 0) throw new Error('Estoque insuficiente')
          const movement: Movement = {
            id: crypto.randomUUID(),
            product_id: productId,
            type,
            quantity,
            previous_quantity: product.quantity,
            new_quantity: nextQty,
            user_id: user?.id ?? null,
            user_name: name,
            notes: notes || null,
            created_at: nowIso(),
            product_brand: product.brand,
            product_code: product.code,
          }
          persistLocal(
            products.map((item) =>
              item.id === productId ? { ...item, quantity: nextQty, updated_at: nowIso() } : item,
            ),
            [movement, ...movements],
          )
          return
        }

        const { error: nextError } = await getSupabase().rpc('register_movement', {
          p_product_id: productId,
          p_type: type,
          p_quantity: quantity,
          p_notes: notes || null,
        })
        if (nextError) {
          setError(nextError.message)
          throw nextError
        }
        await load()
      },
      async saveProduct(draft, productId) {
        setError(null)
        const current = productId ? products.find((item) => item.id === productId) : undefined
        const payload = toDraftProduct(draft, productId, current?.created_at)

        if (!isConfigured) {
          persistLocal(
            sortProducts(
              productId
                ? products.map((item) => (item.id === productId ? payload : item))
                : [...products, payload],
            ),
            movements,
          )
          return
        }

        const row = {
          user_id: user?.id,
          brand: payload.brand,
          code: payload.code,
          tipo: payload.tipo,
          category: payload.category,
          quantity: payload.quantity,
          min_quantity: payload.min_quantity,
          unit: payload.unit,
          notes: payload.notes,
          updated_at: payload.updated_at,
        }
        const client = getSupabase()
        const query = productId
          ? client.from('products').update(row).eq('id', productId)
          : client.from('products').insert(row)
        const { error: nextError } = await query
        if (nextError) {
          setError(nextError.message)
          throw nextError
        }
        await load()
      },
      async deleteProduct(productId) {
        setError(null)
        if (!isConfigured) {
          persistLocal(
            products.filter((item) => item.id !== productId),
            movements.filter((item) => item.product_id !== productId),
          )
          return
        }
        const { error: nextError } = await getSupabase().from('products').delete().eq('id', productId)
        if (nextError) {
          setError(nextError.message)
          throw nextError
        }
        await load()
      },
      async importProducts(drafts) {
        setError(null)
        const payload = drafts.map((draft) => toDraftProduct(draft))

        if (!isConfigured) {
          persistLocal(sortProducts([...products, ...payload]), movements)
          return payload.length
        }

        const { error: nextError } = await getSupabase().from('products').insert(
          payload.map((row) => ({
            user_id: user?.id,
            brand: row.brand,
            code: row.code,
            tipo: row.tipo,
            category: row.category,
            quantity: row.quantity,
            min_quantity: row.min_quantity,
            unit: row.unit,
            notes: row.notes,
          })),
        )
        if (nextError) {
          setError(nextError.message)
          throw nextError
        }
        await load()
        return payload.length
      },
    }
  }, [products, movements, loading, error, load, persistLocal, name, user])

  return <InventoryContext.Provider value={value}>{children}</InventoryContext.Provider>
}

export function useInventory(): InventoryContextValue {
  const value = useContext(InventoryContext)
  if (!value) {
    throw new Error('useInventory precisa estar dentro de InventoryProvider')
  }
  return value
}
