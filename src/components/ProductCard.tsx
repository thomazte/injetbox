import { formatQty, statusLabel, stockStatus } from '../lib/format'
import type { Product } from '../types'

export function ProductCard({
  product,
  onOpen,
}: {
  product: Product
  onOpen: () => void
}) {
  const status = stockStatus(product)
  const well =
    status === 'zerado'
      ? 'bg-ink text-paper'
      : status === 'baixo'
        ? 'bg-accent text-paper'
        : 'bg-accent-soft text-accent'
  const meta = [product.category, product.tipo].filter(Boolean).join(' · ')

  return (
    <button
      type="button"
      onClick={onOpen}
      className="glass flex h-full w-full cursor-pointer items-stretch overflow-hidden rounded-2xl text-left active:brightness-110 lg:hover:brightness-110"
    >
      <span className="flex min-w-0 flex-1 flex-col justify-center px-4 py-3.5">
        {meta && (
          <span className="text-[11px] font-semibold tracking-[0.08em] text-muted uppercase">
            {meta}
          </span>
        )}
        <span className="mt-1 block text-[17px] font-semibold leading-tight tracking-tight">
          {product.code || product.brand}
        </span>
        <span className="mt-1 block text-xs text-muted">
          {product.brand ? `${product.brand} · ` : ''}
          mín. {formatQty(product.min_quantity, product.unit)}
        </span>
      </span>
      <span className={`flex w-[4.85rem] shrink-0 flex-col items-center justify-center ${well}`}>
        <span className="font-mono text-[28px] font-semibold leading-none">{product.quantity}</span>
        <span className="mt-1 text-[10px] font-semibold tracking-wide uppercase">
          {statusLabel(status)}
        </span>
      </span>
    </button>
  )
}
