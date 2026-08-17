import type { Product, StockStatus } from '../types'

export function stockStatus(product: Product): StockStatus {
  if (product.quantity <= 0) return 'zerado'
  if (product.quantity <= product.min_quantity) return 'baixo'
  return 'ok'
}

export function formatQty(value: number, unit = 'un'): string {
  const abs = Number.isInteger(value) ? String(value) : value.toLocaleString('pt-BR')
  return `${abs} ${unit}`
}

export function formatWhen(iso: string): string {
  const date = new Date(iso)
  const diff = Date.now() - date.getTime()
  const minute = 60_000
  const hour = 60 * minute
  const day = 24 * hour

  if (diff < minute) return 'agora'
  if (diff < hour) return `há ${Math.floor(diff / minute)} min`
  if (diff < day) return `há ${Math.floor(diff / hour)} h`
  if (diff < 2 * day) return 'ontem'

  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function greeting(): string {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 12) return 'Bom dia'
  if (hour >= 12 && hour < 18) return 'Boa tarde'
  return 'Boa noite'
}

export function statusLabel(status: StockStatus): string {
  if (status === 'zerado') return 'Zerado'
  if (status === 'baixo') return 'Baixo'
  return 'OK'
}
