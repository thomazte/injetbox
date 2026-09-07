import { formatQty, statusLabel, stockStatus } from '../lib/format'
import type { Product } from '../types'

export function ProductCard({
  product,
  catalogView = false,
  onOpen,
}: {
  product: Product
  catalogView?: boolean
  onOpen?: () => void
}) {
  const interactive = typeof onOpen === 'function'
  const status = stockStatus(product)
  const statusStyle =
    status === 'zerado'
      ? {
          background:
            'linear-gradient(180deg, color-mix(in srgb, var(--status-zero-bg) 82%, white 18%) 0%, var(--status-zero-bg) 100%)',
          color: 'var(--status-zero-text)',
        }
      : status === 'baixo'
        ? {
            background:
              'linear-gradient(180deg, color-mix(in srgb, var(--status-low-bg) 82%, white 18%) 0%, var(--status-low-bg) 100%)',
            color: 'var(--status-low-text)',
          }
        : {
            background:
              'linear-gradient(180deg, color-mix(in srgb, var(--status-ok-bg) 82%, white 18%) 0%, var(--status-ok-bg) 100%)',
            color: 'var(--status-ok-text)',
          }
  const meta = [product.category, product.tipo].filter(Boolean).join(' · ')
  const quantityLabel = formatQty(product.quantity, product.unit)
  const body = (
    <>
      <span className="flex min-w-0 flex-1 flex-col justify-center px-4 py-3.5">
        {!catalogView && meta && (
          <span className="text-[11px] font-semibold tracking-[0.08em] text-muted uppercase">
            {meta}
          </span>
        )}
        <span className="mt-1 block text-[17px] font-semibold leading-tight tracking-tight">
          {product.code || product.brand}
        </span>
        {!catalogView ? (
          <span className="mt-1 block text-xs text-muted">
            {product.brand ? `${product.brand} · ` : ''}
            mín. {formatQty(product.min_quantity, product.unit)}
          </span>
        ) : (
          product.brand && <span className="mt-1 block text-xs text-muted">{product.brand}</span>
        )}
      </span>
      <span className="flex w-[4.85rem] shrink-0 flex-col items-center justify-center" style={statusStyle}>
        <span className="font-mono text-[24px] font-semibold leading-none">{product.quantity}</span>
        <span className="mt-1 text-[10px] font-semibold tracking-wide uppercase">
          {catalogView ? quantityLabel : statusLabel(status)}
        </span>
      </span>
    </>
  )

  if (!interactive) {
    return <div className="glass flex h-full w-full items-stretch overflow-hidden rounded-2xl text-left">{body}</div>
  }

  return (
    <button
      type="button"
      onClick={onOpen}
      className="glass flex h-full w-full cursor-pointer items-stretch overflow-hidden rounded-2xl text-left active:brightness-110 lg:hover:brightness-110"
    >
      {body}
    </button>
  )
}
