import { useEffect, useMemo, useState } from 'react'
import { Plus, Search, Upload } from 'lucide-react'
import { useInventory } from '../context/InventoryContext'
import { MovementSheet } from '../components/MovementSheet'
import { ProductCard } from '../components/ProductCard'
import { ProductForm } from '../components/ProductForm'
import { appFeatures, appMode } from '../lib/appMode'
import { ImportScreen } from './ImportScreen'
import type { Product } from '../types'

export function StockScreen() {
  const { products, lowStock, tipos, loading } = useInventory()
  const catalogMode = appMode === 'catalogo'
  const canOpenDetails = appFeatures.canMoveStock || appFeatures.canEditProducts || appFeatures.canDeleteProducts
  const [showInstallHint, setShowInstallHint] = useState(false)
  const [isIos, setIsIos] = useState(false)
  const [query, setQuery] = useState('')
  const [tipo, setTipo] = useState('Todas')
  const [selected, setSelected] = useState<Product | null>(null)
  const [creating, setCreating] = useState(false)
  const [importing, setImporting] = useState(false)

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return products.filter((item) => {
      const matchesTipo = tipo === 'Todas' || item.tipo === tipo
      const haystack = `${item.brand} ${item.code ?? ''} ${item.tipo} ${item.category}`.toLowerCase()
      return matchesTipo && (!needle || haystack.includes(needle))
    })
  }, [products, query, tipo])

  const totalQty = products.reduce((sum, item) => sum + item.quantity, 0)

  useEffect(() => {
    if (!catalogMode || typeof window === 'undefined') return
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      ('standalone' in window.navigator && window.navigator.standalone === true)
    const userAgent = window.navigator.userAgent.toLowerCase()
    const iosDevice = /iphone|ipad|ipod/.test(userAgent)
    const dismissed = window.sessionStorage.getItem('catalog.install.hint.dismissed') === '1'
    setIsIos(iosDevice)
    setShowInstallHint(!isStandalone && !dismissed)
  }, [catalogMode])

  function dismissInstallHint() {
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem('catalog.install.hint.dismissed', '1')
    }
    setShowInstallHint(false)
  }

  return (
    <div className="pb-4 lg:pb-0">
      {catalogMode && showInstallHint && (
        <section className="px-4 pt-2">
          <div className="glass rounded-2xl p-3.5">
            <p className="text-sm font-semibold">Adicionar na tela inicial</p>
            {isIos ? (
              <p className="mt-1 text-xs text-muted">
                No Safari: toque em Compartilhar e depois em Adicionar a Tela de Início.
              </p>
            ) : (
              <p className="mt-1 text-xs text-muted">
                No navegador: abra o menu e escolha Instalar app ou Adicionar a tela inicial.
              </p>
            )}
            <button
              type="button"
              onClick={dismissInstallHint}
              className="mt-3 rounded-xl bg-accent px-3 py-2 text-xs font-semibold text-white"
            >
              Entendi
            </button>
          </div>
        </section>
      )}

      {!catalogMode && (
        <section className="grid grid-cols-3 gap-2 px-4 lg:gap-4 lg:px-4">
          <Kpi label="Itens" value={String(products.length)} />
          <Kpi label="Peças" value={String(totalQty)} />
          <Kpi label="Alertas" value={String(lowStock.length)} warn={lowStock.length > 0} />
        </section>
      )}

      <div className={`flex flex-col gap-3 px-4 lg:flex-row lg:items-center ${catalogMode ? 'mt-2 lg:mt-3' : 'mt-4 lg:mt-6'}`}>
        <div className="relative flex-1">
          <Search
            size={18}
            className="pointer-events-none absolute top-1/2 left-3.5 z-10 -translate-y-1/2 text-muted"
          />
          <input
            className="search-input"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Código, marca, tipo ou categoria"
          />
        </div>
        {(appFeatures.canCreateProducts || appFeatures.canImportProducts) && (
          <div className="hidden gap-2 lg:flex lg:shrink-0">
            {appFeatures.canCreateProducts && (
              <button
                type="button"
                onClick={() => setCreating(true)}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-accent py-3 text-sm font-semibold text-white lg:flex-none lg:px-5"
              >
                <Plus size={16} />
                Novo
              </button>
            )}
            {appFeatures.canImportProducts && (
              <button
                type="button"
                onClick={() => setImporting(true)}
                className="glass flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-ink lg:flex-none lg:px-5"
              >
                <Upload size={16} />
                Planilha
              </button>
            )}
          </div>
        )}
      </div>

      <div className={`no-scrollbar mt-3 flex gap-2 overflow-x-auto px-4 pb-1 ${catalogMode ? '' : 'lg:mt-4'}`}>
        {['Todas', ...tipos].map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTipo(item)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium ${
              tipo === item ? 'bg-accent text-white' : 'glass text-muted'
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      {(appFeatures.canCreateProducts || appFeatures.canImportProducts) && (
        <div className="mt-4 flex gap-2 px-4 lg:hidden">
          {appFeatures.canCreateProducts && (
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-accent py-3 text-sm font-semibold text-white"
            >
              <Plus size={16} />
              Novo
            </button>
          )}
          {appFeatures.canImportProducts && (
            <button
              type="button"
              onClick={() => setImporting(true)}
              className="glass flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-ink"
            >
              <Upload size={16} />
              Planilha
            </button>
          )}
        </div>
      )}

      {loading && products.length === 0 ? (
        <p className="px-5 py-10 text-sm text-muted">Carregando estoque…</p>
      ) : filtered.length === 0 ? (
        <div className="px-5 py-12 text-center">
          <h2 className="text-lg font-semibold">Estoque vazio</h2>
          <p className="mt-2 text-sm text-muted">
            {appFeatures.canCreateProducts || appFeatures.canImportProducts
              ? 'Importe a planilha do Excel ou cadastre o primeiro produto.'
              : 'Nenhum item disponível para consulta.'}
          </p>
        </div>
      ) : (
        <ul className="mt-4 grid grid-cols-1 gap-2.5 px-4 lg:grid-cols-2 xl:grid-cols-3">
          {filtered.map((product) => (
            <li key={product.id}>
              <ProductCard
                product={product}
                catalogView={catalogMode}
                onOpen={canOpenDetails ? () => setSelected(product) : undefined}
              />
            </li>
          ))}
        </ul>
      )}

      {canOpenDetails && selected && (
        <MovementSheet
          product={products.find((item) => item.id === selected.id) ?? selected}
          onClose={() => setSelected(null)}
        />
      )}
      {appFeatures.canCreateProducts && creating && <ProductForm onClose={() => setCreating(false)} />}
      {appFeatures.canImportProducts && importing && <ImportScreen onClose={() => setImporting(false)} />}
    </div>
  )
}

function Kpi({ label, value, warn = false }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="glass rounded-2xl px-3 py-3 lg:px-5 lg:py-4">
      <p className="text-[11px] font-semibold tracking-[0.08em] text-muted uppercase">{label}</p>
      <p className={`mt-1 font-mono text-[26px] leading-none font-semibold lg:text-[32px] ${warn ? 'text-warn' : 'text-ink'}`}>
        {value}
      </p>
    </div>
  )
}
