import fs from 'node:fs'
import path from 'node:path'

const modes = new Set(['operacao', 'catalogo'])
const mode = String(process.env.VITE_APP_MODE || 'operacao').trim().toLowerCase()

if (!modes.has(mode)) {
  console.error(`Modo inválido para o build Linux: ${mode}`)
  process.exit(1)
}

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'))
const version = pkg.version
const releaseDir = path.resolve('release')

if (!fs.existsSync(releaseDir)) {
  console.error(`Pasta de release não encontrada: ${releaseDir}`)
  process.exit(1)
}

function findUnstamped(ext) {
  const files = fs.readdirSync(releaseDir)
  const preferred = `InjetBox-${version}.${ext}`
  if (files.includes(preferred)) return preferred

  const lowerExt = `.${ext.toLowerCase()}`
  const match = files.find((name) => {
    const lower = name.toLowerCase()
    if (!lower.endsWith(lowerExt)) return false
    return ![...modes].some((item) => lower.includes(`-${item}.`))
  })
  if (!match) {
    console.error(`Artefato .${ext} não encontrado em ${releaseDir}: ${files.join(', ') || '(vazio)'}`)
    process.exit(1)
  }
  return match
}

function renameArtifact(sourceName, targetName, executable) {
  const from = path.join(releaseDir, sourceName)
  const to = path.join(releaseDir, targetName)
  if (from !== to) fs.renameSync(from, to)
  if (executable) fs.chmodSync(to, 0o755)
  console.log(targetName)
}

renameArtifact(findUnstamped('AppImage'), `InjetBox-${version}-${mode}.AppImage`, true)
renameArtifact(findUnstamped('deb'), `InjetBox-${version}-${mode}.deb`, false)
