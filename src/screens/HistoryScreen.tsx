import { formatQty, formatWhen } from '../lib/format'
import { useInventory } from '../context/InventoryContext'

const typeLabel = {
  entrada: 'Entrada',
  saida: 'Saída',
  ajuste: 'Ajuste',
} as const

export function HistoryScreen() {
  const { movements, loading } = useInventory()

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
    <ul className="grid grid-cols-1 gap-2 px-4 pb-4 lg:grid-cols-2">
      {movements.map((item) => {
        const positive = item.type === 'entrada' || (item.type === 'ajuste' && item.quantity > 0)
        return (
          <li key={item.id} className="glass rounded-2xl p-4">
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
      })}
    </ul>
  )
}
