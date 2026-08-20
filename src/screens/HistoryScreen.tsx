import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { useInventory } from '../context/InventoryContext'
import { Field } from '../components/Field'
import { formatQty, formatWhen } from '../lib/format'
import type { Movement } from '../types'

const typeLabel = {
  entrada: 'Entrada',
  saida: 'Saída',
  ajuste: 'Ajuste',
} as const

const searchTypes = [
  { id: 'todas', label: 'Todas' },
  { id: 'entrada', label: 'Entrada' },
  { id: 'saida', label: 'Saída' },
] as const

type SearchType = (typeof searchTypes)[number]['id']

export function HistoryScreen() {
  const { movements, loading } = useInventory()
  const [searching, setSearching] = useState(false)
  const [query, setQuery] = useState('')
  const [type, setType] = useState<SearchType>('todas')
  const [draftQuery, setDraftQuery] = useState('')
  const [draftType, setDraftType] = useState<SearchType>('todas')

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return movements.filter((item) => {
      const matchesType = type === 'todas' || item.type === type
      const haystack =
        `${item.product_brand} ${item.product_code ?? ''} ${item.user_name} ${item.notes ?? ''}`.toLowerCase()
      return matchesType && (!needle || haystack.includes(needle))
    })
  }, [movements, query, type])

  function openSearch() {
    setDraftQuery(query)
    setDraftType(type)
    setSearching(true)
  }

  function applySearch() {
    setQuery(draftQuery)
    setType(draftType)
    setSearching(false)
  }

  if (loading && movements.length === 0) {
    return <p className="px-5 py-10 text-sm text-muted">Carregando histórico…</p>
  }

  if (movements.length === 0) {
    return (
      <div className="px-5 py-12 text-center">
        <h2 className="text-lg font-semibold">Nenhuma movimentação ainda</h2>
        <p className="mt-2 text-sm text-muted">
          Quando alguém der entrada ou saída, o registro aparece aqui com quem alterou e o horário.
        </p>
      </div>
    )
  }

  return (
    <div className="pb-4 lg:pb-0">
      <div className="px-4 pb-3">
        <button
          type="button"
          onClick={openSearch}
          className="glass flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-ink lg:w-auto lg:px-5"
        >
          <Search size={16} />
          Buscar
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="px-5 py-12 text-center">
          <h2 className="text-lg font-semibold">Nada encontrado</h2>
          <p className="mt-2 text-sm text-muted">Tente outro código, marca ou tipo.</p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-2 px-4 pb-4 lg:grid-cols-2">
          {filtered.map((item) => (
            <HistoryCard key={item.id} item={item} />
          ))}
        </ul>
      )}

      {searching && (
        <SearchSheet
          draftQuery={draftQuery}
          draftType={draftType}
          onQueryChange={setDraftQuery}
          onTypeChange={setDraftType}
          onClose={() => setSearching(false)}
          onApply={applySearch}
        />
      )}
    </div>
  )
}

function HistoryCard({ item }: { item: Movement }) {
  const positive = item.type === 'entrada' || (item.type === 'ajuste' && item.quantity > 0)

  return (
    <li className="glass rounded-2xl p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold tracking-tight">{item.product_code || item.product_brand}</p>
          <p className="mt-1 text-xs text-muted">
            {item.user_name} · {formatWhen(item.created_at)}
            {item.product_code && item.product_brand ? ` · ${item.product_brand}` : ''}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-xl px-2.5 py-1 font-mono text-sm font-semibold ${
            positive ? 'bg-accent-soft text-accent' : 'bg-ink text-paper'
          }`}
        >
          {positive ? '+' : '−'}
          {formatQty(Math.abs(item.quantity))}
        </span>
      </div>
      <p className="mt-2 text-xs text-muted">
        {typeLabel[item.type]} · {formatQty(item.previous_quantity)} → {formatQty(item.new_quantity)}
        {item.notes ? ` · ${item.notes}` : ''}
      </p>
    </li>
  )
}

function SearchSheet({
  draftQuery,
  draftType,
  onQueryChange,
  onTypeChange,
  onClose,
  onApply,
}: {
  draftQuery: string
  draftType: SearchType
  onQueryChange: (value: string) => void
  onTypeChange: (value: SearchType) => void
  onClose: () => void
  onApply: () => void
}) {
  return (
    <div
      className="overlay fixed inset-0 z-40 flex items-center justify-center px-3 py-6"
      onClick={onClose}
    >
      <form
        className="sheet-enter sheet-panel mx-auto w-full max-w-lg rounded-3xl p-5 lg:max-w-md"
        onClick={(event) => event.stopPropagation()}
        onSubmit={(event) => {
          event.preventDefault()
          onApply()
        }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Buscar no histórico</h2>
          <button type="button" className="text-sm text-muted" onClick={onClose}>
            Fechar
          </button>
        </div>

        <div className="mt-5 space-y-3.5">
          <Field label="Busca">
            <input
              value={draftQuery}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Código, marca ou quem movimentou"
            />
          </Field>

          <div className="grid grid-cols-3 gap-2">
            {searchTypes.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onTypeChange(item.id)}
                className={`rounded-xl py-3.5 text-sm font-semibold ${
                  draftType === item.id ? 'bg-accent text-white' : 'glass text-muted'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <button type="submit" className="mt-5 w-full rounded-xl bg-accent py-3.5 font-semibold text-white">
          Filtrar
        </button>
      </form>
    </div>
  )
}
