import { useState, type FormEvent } from 'react'
import { productTitle } from '../lib/product'
import { statusLabel, stockStatus } from '../lib/format'
import { useInventory } from '../context/InventoryContext'
import { Field } from './Field'
import { SuggestField } from './SuggestField'
import type { MovementType, Product } from '../types'

export function MovementSheet({
  product,
  onClose,
}: {
  product: Product
  onClose: () => void
}) {
  const { registerMovement, saveProduct, deleteProduct, brands, tipos, categories, codes } = useInventory()
  const [type, setType] = useState<Exclude<MovementType, 'ajuste'>>('saida')
  const [quantity, setQuantity] = useState('1')
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [brand, setBrand] = useState(product.brand)
  const [code, setCode] = useState(product.code ?? '')
  const [tipo, setTipo] = useState(product.tipo)
  const [category, setCategory] = useState(product.category)
  const [minQuantity, setMinQuantity] = useState(String(product.min_quantity))
  const [unit, setUnit] = useState(product.unit)
  const status = stockStatus(product)
  const well =
    status === 'zerado'
      ? 'bg-ink text-paper'
      : status === 'baixo'
        ? 'bg-accent text-paper'
        : 'bg-accent-soft text-accent'

  async function onMove(event: FormEvent) {
    event.preventDefault()
    const amount = Number(quantity.replace(',', '.'))
    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Informe uma quantidade válida.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await registerMovement(product.id, type, amount, notes)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível movimentar')
    } finally {
      setBusy(false)
    }
  }

  async function onSave(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await saveProduct(
        {
          brand,
          code,
          tipo,
          category,
          quantity: product.quantity,
          min_quantity: Number(minQuantity.replace(',', '.')) || 0,
          unit,
          notes: product.notes ?? '',
        },
        product.id,
      )
      setEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível salvar')
    } finally {
      setBusy(false)
    }
  }

  async function onDelete() {
    if (!window.confirm(`Excluir ${productTitle(product)}?`)) return
    setBusy(true)
    try {
      await deleteProduct(product.id)
      onClose()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="overlay fixed inset-0 z-40 lg:flex lg:items-center lg:justify-center lg:p-8" onClick={onClose}>
      <div
        className="sheet-enter glass-strong absolute inset-x-0 bottom-0 mx-auto max-w-lg rounded-t-3xl p-5 pb-8 lg:static lg:max-h-[min(85vh,720px)] lg:w-full lg:max-w-md lg:overflow-y-auto lg:rounded-3xl lg:pb-5"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-white/30 lg:hidden" />
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold tracking-[0.08em] text-muted uppercase">
              {[product.category, product.tipo].filter(Boolean).join(' · ')}
            </p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight">{productTitle(product)}</h2>
            {product.brand && <p className="mt-1 text-sm text-muted">{product.brand}</p>}
          </div>
          <div className={`rounded-2xl px-4 py-3 text-center ${well}`}>
            <p className="font-mono text-3xl leading-none font-semibold">{product.quantity}</p>
            <p className="mt-1 text-[10px] font-semibold tracking-wide uppercase">
              {statusLabel(status)} · {product.unit}
            </p>
          </div>
        </div>

        {editing ? (
          <form className="mt-5 space-y-3.5" onSubmit={onSave}>
            <SuggestField label="Código" value={code} onChange={setCode} options={codes} />
            <SuggestField label="Marca" value={brand} onChange={setBrand} options={brands} required />
            <SuggestField label="Tipo" value={tipo} onChange={setTipo} options={tipos} />
            <SuggestField label="Categoria" value={category} onChange={setCategory} options={categories} />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Mínimo">
                <input
                  value={minQuantity}
                  onChange={(event) => setMinQuantity(event.target.value)}
                  inputMode="decimal"
                />
              </Field>
              <Field label="Unidade">
                <input value={unit} onChange={(event) => setUnit(event.target.value)} />
              </Field>
            </div>
            {error && <p className="text-sm text-danger">{error}</p>}
            <button type="submit" disabled={busy} className="w-full rounded-xl bg-accent py-3.5 font-semibold text-white">
              Salvar produto
            </button>
          </form>
        ) : (
          <form className="mt-5 space-y-3.5" onSubmit={onMove}>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType('entrada')}
                className={`rounded-xl py-3.5 font-semibold ${
                  type === 'entrada' ? 'bg-accent text-white' : 'glass text-muted'
                }`}
              >
                Entrada
              </button>
              <button
                type="button"
                onClick={() => setType('saida')}
                className={`rounded-xl py-3.5 font-semibold ${
                  type === 'saida' ? 'bg-ink text-paper' : 'glass text-muted'
                }`}
              >
                Saída
              </button>
            </div>
            <Field label="Quantidade">
              <input
                inputMode="decimal"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
              />
            </Field>
            <Field label="Observação">
              <input
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Opcional"
              />
            </Field>
            {error && <p className="text-sm text-danger">{error}</p>}
            <button type="submit" disabled={busy} className="w-full rounded-xl bg-accent py-3.5 font-semibold text-white">
              {busy ? 'Registrando…' : `Confirmar ${type}`}
            </button>
            <div className="flex gap-3 pt-1">
              <button type="button" className="flex-1 text-sm text-muted" onClick={() => setEditing(true)}>
                Editar cadastro
              </button>
              <button type="button" className="flex-1 text-sm text-muted" onClick={() => void onDelete()}>
                Excluir
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
