import * as XLSX from 'xlsx'
import type { ColumnMapping, ParsedSheet, ProductDraft } from '../types'

function fold(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

const BRAND_HINTS = ['marca', 'brand', 'fabricante', 'nome']
const CODE_HINTS = ['codigo', 'sku', 'ref', 'referencia']
const TIPO_HINTS = ['tipo', 'classe', 'grupo', 'familia']
const CATEGORY_HINTS = ['categoria', 'category']
const QTY_HINTS = ['quantidade', 'qtd', 'qtde', 'estoque', 'saldo']
const MIN_HINTS = ['minimo', 'estoque minimo', 'qtd min', 'min']
const UNIT_HINTS = ['unidade', 'un', 'um']
const NOTES_HINTS = ['obs', 'observacao', 'notas', 'comentario']

function pickHeader(headers: string[], hints: string[], used: Set<string>): string {
  for (const header of headers) {
    if (used.has(header)) continue
    const folded = fold(header)
    if (hints.some((hint) => folded === hint || folded.includes(hint))) {
      used.add(header)
      return header
    }
  }
  return ''
}

function suggestMapping(headers: string[]): ColumnMapping {
  const used = new Set<string>()
  const brand = pickHeader(headers, BRAND_HINTS, used) || headers[0] || ''
  if (brand) used.add(brand)
  return {
    brand,
    code: pickHeader(headers, CODE_HINTS, used),
    tipo: pickHeader(headers, TIPO_HINTS, used),
    category: pickHeader(headers, CATEGORY_HINTS, used),
    quantity: pickHeader(headers, QTY_HINTS, used),
    min_quantity: pickHeader(headers, MIN_HINTS, used),
    unit: pickHeader(headers, UNIT_HINTS, used),
    notes: pickHeader(headers, NOTES_HINTS, used),
  }
}

function cellText(value: unknown): string {
  if (value == null) return ''
  return String(value).trim()
}

function cellNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  const text = cellText(value).replace(/\./g, '').replace(',', '.')
  const parsed = Number.parseFloat(text)
  return Number.isFinite(parsed) ? parsed : 0
}

export async function parseWorkbook(file: File): Promise<ParsedSheet> {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array' })
  const first = workbook.SheetNames[0]
  if (!first) {
    throw new Error('A planilha está vazia.')
  }
  const sheet = workbook.Sheets[first]
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' })
  const headers = rows[0] ? Object.keys(rows[0]) : []
  return {
    headers,
    rows,
    mapping: suggestMapping(headers),
  }
}

export function rowsToDrafts(
  rows: Record<string, unknown>[],
  mapping: ColumnMapping,
): ProductDraft[] {
  return rows
    .map((row) => {
      const brand = mapping.brand ? cellText(row[mapping.brand]) : ''
      const code = mapping.code ? cellText(row[mapping.code]) : ''
      return {
        brand,
        code,
        tipo: mapping.tipo ? cellText(row[mapping.tipo]) : 'Geral',
        category: mapping.category ? cellText(row[mapping.category]) : '',
        quantity: mapping.quantity ? cellNumber(row[mapping.quantity]) : 0,
        min_quantity: mapping.min_quantity ? cellNumber(row[mapping.min_quantity]) : 0,
        unit: mapping.unit ? cellText(row[mapping.unit]) || 'un' : 'un',
        notes: mapping.notes ? cellText(row[mapping.notes]) : '',
      }
    })
    .filter((row) => row.brand.length > 0 || row.code.length > 0)
}
