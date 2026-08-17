import { useState, type FormEvent } from 'react'
import { Field } from './Field'
import { SuggestField } from './SuggestField'
import { useInventory } from '../context/InventoryContext'

export function ProductForm({ onClose }: { onClose: () => void }) {
  const { saveProduct, brands, tipos, categories, codes } = useInventory()
  const [brand, setBrand] = useState('')
  const [code, setCode] = useState('')
  const [tipo, setTipo] = useState('')
  const [category, setCategory] = useState('')
  const [quantity, setQuantity] = useState('0')
  const [minQuantity, setMinQuantity] = useState('0')
  const [unit, setUnit] = useState('un')
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await saveProduct({
        brand,
        code,
        tipo,
        category,
        quantity: Number(quantity.replace(',', '.')) || 0,
        min_quantity: Number(minQuantity.replace(',', '.')) || 0,
        unit,
        notes,
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível cadastrar')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="overlay fixed inset-0 z-40 px-3 py-6 lg:flex lg:items-center lg:justify-center" onClick={onClose}>
      <form
        className="sheet-enter glass-strong mx-auto max-h-[90dvh] max-w-lg overflow-y-auto rounded-3xl p-5 lg:w-full lg:max-w-xl"
        onClick={(event) => event.stopPropagation()}
        onSubmit={onSubmit}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Novo produto</h2>
          <button type="button" className="text-sm text-muted" onClick={onClose}>
            Fechar
          </button>
        </div>
        <div className="mt-5 space-y-3.5">
          <SuggestField
            label="Código"
            value={code}
            onChange={setCode}
            options={codes}
            placeholder="Digite ou escolha"
          />
          <SuggestField
            label="Marca"
            value={brand}
            onChange={setBrand}
            options={brands}
            placeholder="Digite ou escolha"
            required
          />
          <SuggestField
            label="Tipo"
            value={tipo}
            onChange={setTipo}
            options={tipos}
            placeholder="Digite ou escolha"
          />
          <SuggestField
            label="Categoria"
            value={category}
            onChange={setCategory}
            options={categories}
            placeholder="Digite ou escolha"
          />
          <div className="grid grid-cols-3 gap-2">
            <Field label="Qtd">
              <input
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
                inputMode="decimal"
              />
            </Field>
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
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Opcional"
            />
          </Field>
        </div>
        {error && <p className="mt-3 rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="mt-5 w-full rounded-xl bg-accent py-3.5 font-semibold text-white disabled:opacity-60"
        >
          {busy ? 'Salvando…' : 'Cadastrar'}
        </button>
      </form>
    </div>
  )
}
