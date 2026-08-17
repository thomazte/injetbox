import { useMemo, useState, type FormEvent } from 'react'
import { parseWorkbook, rowsToDrafts } from '../lib/excel'
import { useInventory } from '../context/InventoryContext'
import type { ColumnMapping, ParsedSheet } from '../types'

const fields: { key: keyof ColumnMapping; label: string; required?: boolean }[] = [
  { key: 'code', label: 'Código' },
  { key: 'brand', label: 'Marca', required: true },
  { key: 'tipo', label: 'Tipo' },
  { key: 'category', label: 'Categoria' },
  { key: 'quantity', label: 'Quantidade' },
  { key: 'min_quantity', label: 'Estoque mínimo' },
  { key: 'unit', label: 'Unidade' },
  { key: 'notes', label: 'Observação' },
]

export function ImportScreen({ onClose }: { onClose: () => void }) {
  const { importProducts } = useInventory()
  const [sheet, setSheet] = useState<ParsedSheet | null>(null)
  const [mapping, setMapping] = useState<ColumnMapping | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const preview = useMemo(() => {
    if (!sheet || !mapping) return []
    return rowsToDrafts(sheet.rows, mapping).slice(0, 6)
  }, [sheet, mapping])

  async function onFile(file: File | undefined) {
    if (!file) return
    setError(null)
    setMessage(null)
    try {
      const parsed = await parseWorkbook(file)
      setSheet(parsed)
      setMapping(parsed.mapping)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível ler a planilha')
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (!sheet || !mapping || !mapping.brand) return
    setBusy(true)
    setError(null)
    try {
      const drafts = rowsToDrafts(sheet.rows, mapping)
      const count = await importProducts(drafts)
      setMessage(`${count} produtos importados.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha na importação')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="overlay fixed inset-0 z-40 px-3 py-6 lg:flex lg:items-center lg:justify-center">
      <form
        onSubmit={onSubmit}
        className="sheet-enter glass-strong mx-auto flex max-h-[90dvh] max-w-lg flex-col overflow-hidden rounded-3xl lg:w-full lg:max-w-xl"
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="text-lg font-semibold">Importar planilha</h2>
          <button type="button" className="text-sm text-muted" onClick={onClose}>
            Fechar
          </button>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <label className="block text-sm font-medium">
            Arquivo Excel
            <input
              className="mt-2"
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(event) => void onFile(event.target.files?.[0])}
            />
          </label>

          {sheet && mapping && (
            <>
              <p className="text-sm text-muted">
                Confira se as colunas foram reconhecidas. Você pode ajustar antes de importar.
              </p>
              {fields.map((field) => (
                <label key={field.key} className="block text-sm font-medium">
                  {field.label}
                  <select
                    className="mt-1"
                    required={field.required}
                    value={mapping[field.key]}
                    onChange={(event) =>
                      setMapping({ ...mapping, [field.key]: event.target.value })
                    }
                  >
                    {!field.required && <option value="">Ignorar</option>}
                    {sheet.headers.map((header) => (
                      <option key={header} value={header}>
                        {header}
                      </option>
                    ))}
                  </select>
                </label>
              ))}

              {preview.length > 0 && (
                <div className="glass rounded-2xl p-3">
                  <p className="text-xs font-medium tracking-wide text-muted uppercase">Prévia</p>
                  <ul className="mt-2 space-y-1 text-sm">
                    {preview.map((row) => (
                      <li key={`${row.brand}-${row.code}-${row.tipo}`}>
                        {row.code || row.brand} · {row.brand} · {row.quantity} {row.unit}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}

          {error && <p className="rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}
          {message && <p className="rounded-xl bg-ok-soft px-3 py-2 text-sm text-ok">{message}</p>}
        </div>
        <div className="border-t border-line p-4">
          <button
            type="submit"
            disabled={!sheet || busy}
            className="w-full rounded-xl bg-accent py-3 font-semibold text-white disabled:opacity-50"
          >
            {busy ? 'Importando…' : 'Importar produtos'}
          </button>
        </div>
      </form>
    </div>
  )
}
