import { useInventory } from '../context/InventoryContext'
import { ProductCard } from '../components/ProductCard'

export function AlertsScreen() {
  const { lowStock, loading } = useInventory()

  if (loading && lowStock.length === 0) {
    return <p className="px-5 py-10 text-sm text-muted">Checando alertas…</p>
  }

  if (lowStock.length === 0) {
    return (
      <div className="px-5 py-12 text-center">
        <h2 className="text-lg font-semibold">Nenhum alerta agora</h2>
        <p className="mt-2 text-sm text-muted">
          Quando um item ficar zerado ou abaixo do mínimo, ele aparece nesta lista.
        </p>
      </div>
    )
  }

  return (
    <ul className="grid grid-cols-1 gap-2.5 px-4 pb-4 lg:grid-cols-2 xl:grid-cols-3">
      {lowStock.map((product) => (
        <li key={product.id}>
          <ProductCard product={product} />
        </li>
      ))}
    </ul>
  )
}
