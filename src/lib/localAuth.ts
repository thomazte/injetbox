export type LocalAccount = {
  id: string
  email: string
  name: string
  passwordHash: string
  createdAt: string
}

const ACCOUNTS_KEY = 'injetbox.accounts'
const SESSION_KEY = 'injetbox.session'
const LEGACY_PRODUCTS_KEY = 'carcacas.products'
const LEGACY_MOVEMENTS_KEY = 'carcacas.movements'

export function productsKey(userId: string) {
  return `injetbox.products.${userId}`
}

export function movementsKey(userId: string) {
  return `injetbox.movements.${userId}`
}

function readAccounts(): LocalAccount[] {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY)
    return raw ? (JSON.parse(raw) as LocalAccount[]) : []
  } catch {
    return []
  }
}

function writeAccounts(accounts: LocalAccount[]) {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts))
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

async function hashPassword(password: string, salt: string) {
  const bytes = new TextEncoder().encode(`${salt}:${password}`)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export function readLocalSession(): { id: string; email: string; name: string } | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const session = JSON.parse(raw) as { id?: string }
    if (!session.id) return null
    const account = readAccounts().find((item) => item.id === session.id)
    if (!account) {
      localStorage.removeItem(SESSION_KEY)
      return null
    }
    return { id: account.id, email: account.email, name: account.name }
  } catch {
    return null
  }
}

function writeSession(userId: string) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ id: userId }))
}

export function clearLocalSession() {
  localStorage.removeItem(SESSION_KEY)
}

function claimLegacyInventory(userId: string) {
  const legacyProducts = localStorage.getItem(LEGACY_PRODUCTS_KEY)
  if (!legacyProducts || localStorage.getItem(productsKey(userId))) return
  localStorage.setItem(productsKey(userId), legacyProducts)
  const legacyMovements = localStorage.getItem(LEGACY_MOVEMENTS_KEY)
  if (legacyMovements) localStorage.setItem(movementsKey(userId), legacyMovements)
  localStorage.removeItem(LEGACY_PRODUCTS_KEY)
  localStorage.removeItem(LEGACY_MOVEMENTS_KEY)
}

export async function localSignUp(name: string, email: string, password: string) {
  const normalized = normalizeEmail(email)
  const accounts = readAccounts()
  if (accounts.some((item) => item.email === normalized)) {
    throw new Error('Este e-mail já possui uma conta.')
  }

  const id = crypto.randomUUID()
  const account: LocalAccount = {
    id,
    email: normalized,
    name: name.trim(),
    passwordHash: await hashPassword(password, id),
    createdAt: new Date().toISOString(),
  }
  writeAccounts([...accounts, account])
  writeSession(id)
  if (accounts.length === 0) claimLegacyInventory(id)
  return { id: account.id, email: account.email, name: account.name }
}

export async function localSignIn(email: string, password: string) {
  const normalized = normalizeEmail(email)
  const account = readAccounts().find((item) => item.email === normalized)
  if (!account) throw new Error('E-mail ou senha incorretos.')
  const hash = await hashPassword(password, account.id)
  if (hash !== account.passwordHash) throw new Error('E-mail ou senha incorretos.')
  writeSession(account.id)
  return { id: account.id, email: account.email, name: account.name }
}
