import { useMemo, useState, type FormEvent } from 'react'
import { useInventory } from '../context/InventoryContext'
import { appFeatures } from '../lib/appMode'
import { formatQty } from '../lib/format'
import { productTitle } from '../lib/product'
import type { MovementType, Product } from '../types'
import { Field } from './Field'
import { SuggestField } from './SuggestField'

function productLabel(product: Product) {
  const title = productTitle(product)
  if (product.brand && title !== product.brand) return `${title} · ${product.brand}`
  return title
}

export function QuickMoveSheet({ onClose }: { onClose: () => void }) {
  const { products, registerMovement, saveProduct, deleteProduct, brands, tipos, categories, codes } =
    useInventory()
  const [query, setQuery] = useState('')
  const [openList, setOpenList] = useState(false)
  const [productId, setProductId] = useState<string | null>(null)
  const [type, setType] = useState<Exclude<MovementType, 'ajuste'>>('saida')
  const [quantity, setQuantity] = useState('1')
  const [notes, setNotes] = useState('')
  const [editing, setEditing] = useState(false)
  const [brand, setBrand] = useState('')
  const [code, setCode] = useState('')
  const [tipo, setTipo] = useState('')
  const [category, setCategory] = useState('')
  const [minQuantity, setMinQuantity] = useState('0')
  const [unit, setUnit] = useState('un')
  const [productNotes, setProductNotes] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const selected = products.find((item) => item.id === productId) ?? null
  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return products
      .filter((item) => {
        if (!needle) return true
        return `${item.brand} ${item.code ?? ''} ${item.tipo} ${item.category}`.toLowerCase().includes(needle)
      })
      .slice(0, 8)
  }, [products, query])

  function fillEdit(product: Product) {
    setBrand(product.brand)
    setCode(product.code ?? '')
    setTipo(product.tipo)
    setCategory(product.category)
    setMinQuantity(String(product.min_quantity))
    setUnit(product.unit)
    setProductNotes(product.notes ?? '')
  }

  function pickProduct(product: Product) {
    setProductId(product.id)
    setQuery(productLabel(product))
    setOpenList(false)
    setEditing(false)
    setError(null)
    setNotice(null)
    fillEdit(product)
  }

  async function onMove(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setNotice(null)

    if (!selected) {
      setError('Escolha a peça na lista.')
      return
    }

    const amount = Number(quantity.replace(',', '.'))
    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Informe uma quantidade válida.')
      return
    }

    setBusy(true)
    try {
      await registerMovement(selected.id, type, amount, notes)
      setQuantity('1')
      setNotes('')
      setNotice(
        `${type === 'entrada' ? 'Entrada' : 'Saída'} de ${formatQty(amount, selected.unit)} em ${productLabel(selected)}.`,
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível movimentar')
    } finally {
      setBusy(false)
    }
  }

  async function onSave(event: FormEvent) {
    event.preventDefault()
    if (!selected) {
      setError('Escolha a peça na lista.')
      return
    }
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      await saveProduct(
        {
          brand,
          code,
          tipo,
          category,
          quantity: selected.quantity,
          min_quantity: Number(minQuantity.replace(',', '.')) || 0,
          unit,
          notes: productNotes,
        },
        selected.id,
      )
      setQuery(productLabel({ ...selected, brand, code: code.trim() || null }))
      setEditing(false)
      setNotice('Cadastro atualizado.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível salvar')
    } finally {
      setBusy(false)
    }
  }

  async function onDelete() {
    if (!selected) return
    if (!window.confirm(`Excluir ${productTitle(selected)}?`)) return
    setBusy(true)
    setError(null)
    try {
      await deleteProduct(selected.id)
      setProductId(null)
      setQuery('')
      setEditing(false)
      setNotice('Peça excluída.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível excluir')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      className="overlay fixed inset-0 z-40 flex items-center justify-center px-3 py-6"
      onClick={onClose}
    >
      <form
        className="sheet-enter sheet-panel mx-auto max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-3xl p-5 lg:max-w-md"
        onClick={(event) => event.stopPropagation()}
        onSubmit={editing ? onSave : onMove}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{editing ? 'Alterar cadastro' : 'Entrada / Saída'}</h2>
          <button type="button" className="text-sm text-muted" onClick={onClose}>
            Fechar
          </button>
        </div>
        <p className="mt-2 text-sm text-muted">
          Busque a peça para movimentar o estoque ou alterar o cadastro.
        </p>

        <div className="mt-5 space-y-3.5">
          <Field label="Peça">
            <div className="relative">
              <input
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value)
                  setProductId(null)
                  setEditing(false)
                  setOpenList(true)
                  setNotice(null)
                }}
                onFocus={() => setOpenList(true)}
                onBlur={() => {
                  window.setTimeout(() => setOpenList(false), 120)
                }}
                placeholder="Código ou marca"
                autoComplete="off"
              />
              {openList && (
                <ul className="glass-strong absolute z-20 mt-1 max-h-52 w-full overflow-y-auto rounded-xl">
                  {matches.length === 0 ? (
                    <li className="px-3 py-2.5 text-sm text-muted">Nenhuma peça encontrada.</li>
                  ) : (
                    matches.map((item) => (
                      <li key={item.id}>
                        <button
                          type="button"
                          className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm hover:bg-white/10"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => pickProduct(item)}
                        >
                          <span className="min-w-0 truncate">{productLabel(item)}</span>
                          <span className="shrink-0 font-mono text-muted">
                            {formatQty(item.quantity, item.unit)}
                          </span>
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              )}
            </div>
          </Field>

          {selected && (
            <p className="rounded-xl bg-white/5 px-3 py-2 text-sm text-muted">
              Estoque atual:{' '}
              <span className="font-mono text-ink">{formatQty(selected.quantity, selected.unit)}</span>
            </p>
          )}

          {editing ? (
            <>
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
              <Field label="Observação">
                <input
                  value={productNotes}
                  onChange={(event) => setProductNotes(event.target.value)}
                  placeholder="Opcional"
                />
              </Field>
            </>
          ) : (
            appFeatures.canMoveStock && (
              <>
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
              </>
            )
          )}
        </div>

        {error && <p className="mt-3 rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}
        {notice && !error && (
          <p className="mt-3 rounded-xl bg-ok-soft px-3 py-2 text-sm text-accent">{notice}</p>
        )}

        {editing ? (
          <>
            <button
              type="submit"
              disabled={busy}
              className="mt-5 w-full rounded-xl bg-accent py-3.5 font-semibold text-white disabled:opacity-60"
            >
              {busy ? 'Salvando…' : 'Salvar cadastro'}
            </button>
            <div className="mt-3 flex gap-3">
              <button
                type="button"
                className="flex-1 text-sm text-muted"
                onClick={() => {
                  setEditing(false)
                  setError(null)
                  if (selected) fillEdit(selected)
                }}
              >
                Voltar
              </button>
              {appFeatures.canDeleteProducts && (
                <button type="button" className="flex-1 text-sm text-muted" onClick={() => void onDelete()}>
                  Excluir
                </button>
              )}
            </div>
          </>
        ) : (
          <>
            {appFeatures.canMoveStock && (
              <button
                type="submit"
                disabled={busy}
                className="mt-5 w-full rounded-xl bg-accent py-3.5 font-semibold text-white disabled:opacity-60"
              >
                {busy ? 'Registrando…' : `Confirmar ${type}`}
              </button>
            )}
            {appFeatures.canEditProducts && (
              <button
                type="button"
                className="mt-3 w-full text-sm text-muted"
                onClick={() => {
                  if (!selected) {
                    setError('Escolha a peça na lista.')
                    return
                  }
                  fillEdit(selected)
                  setEditing(true)
                  setError(null)
                  setNotice(null)
                }}
              >
                Alterar cadastro
              </button>
            )}
          </>
        )}
      </form>
    </div>
  )
}
