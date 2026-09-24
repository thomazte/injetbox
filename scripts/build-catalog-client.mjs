import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

function usage() {
  console.log(`Uso:
  node scripts/build-catalog-client.mjs --name "Cliente" [--logo "https://..."] [--slug cliente] [--deploy]

Exemplos:
  npm run catalogo:cliente -- --name "Cliente Exemplo" --logo "https://exemplo.com/logo.png"
  npm run catalogo:cliente -- --name "Cliente Exemplo" --deploy`)
}

function slugify(input) {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
}

function parseArgs(argv) {
  const out = { name: '', logo: '', slug: '', deploy: false, worker: '' }
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '--name') out.name = argv[++i] || ''
    else if (arg === '--logo') out.logo = argv[++i] || ''
    else if (arg === '--slug') out.slug = argv[++i] || ''
    else if (arg === '--worker') out.worker = argv[++i] || ''
    else if (arg === '--deploy') out.deploy = true
    else if (arg === '--help' || arg === '-h') {
      usage()
      process.exit(0)
    }
  }
  return out
}

function run(command, args, env = process.env) {
  const result = spawnSync(command, args, { stdio: 'inherit', env })
  if (result.status !== 0) process.exit(result.status ?? 1)
}

const opts = parseArgs(process.argv.slice(2))
if (!opts.name.trim()) {
  console.error('Informe o nome do cliente com --name')
  usage()
  process.exit(1)
}

const clientName = opts.name.trim()
const slug = (opts.slug || slugify(clientName) || 'cliente').trim()
const workerName = (opts.worker || `injetbox-catalogo-${slug}`).trim()

const env = {
  ...process.env,
  VITE_APP_MODE: 'catalogo',
  VITE_CATALOG_COMPANY_NAME: clientName,
}
if (opts.logo.trim()) env.VITE_CATALOG_LOGO_URL = opts.logo.trim()

run('npm', ['run', 'build'], env)

const outputRoot = path.resolve('release-web')
const outputDir = path.join(outputRoot, `catalogo-${slug}`)
fs.rmSync(outputDir, { recursive: true, force: true })
fs.mkdirSync(outputRoot, { recursive: true })
fs.cpSync(path.resolve('dist'), outputDir, { recursive: true })

const meta = {
  client: clientName,
  slug,
  workerName,
  appMode: 'catalogo',
  logoUrl: opts.logo.trim() || null,
  builtAt: new Date().toISOString(),
}
fs.writeFileSync(path.join(outputDir, 'build-meta.json'), `${JSON.stringify(meta, null, 2)}\n`)

console.log(`\nCatalogo pronto em: ${outputDir}`)
console.log(`Worker sugerido: ${workerName}`)

if (opts.deploy) {
  console.log('\nPublicando no Cloudflare Worker...')
  run('npx', ['wrangler', 'deploy', '--config', 'wrangler.jsonc', '--name', workerName], env)
}
