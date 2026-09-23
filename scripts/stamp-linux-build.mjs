import fs from 'node:fs'
import path from 'node:path'

const modes = new Set(['demo', 'operacao', 'catalogo'])
const mode = String(process.env.VITE_APP_MODE || 'operacao').trim().toLowerCase()

if (!modes.has(mode)) {
  console.error(`Modo inválido para o build Linux: ${mode}`)
  process.exit(1)
}

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'))
const version = pkg.version
const releaseDir = path.resolve('release')

function renameArtifact(sourceName, targetName, executable) {
  const from = path.join(releaseDir, sourceName)
  if (!fs.existsSync(from)) {
    console.error(`Artefato não encontrado: ${sourceName}`)
    process.exit(1)
  }
  const to = path.join(releaseDir, targetName)
  if (from !== to) fs.renameSync(from, to)
  if (executable) fs.chmodSync(to, 0o755)
  console.log(targetName)
}

renameArtifact(`InjetBox-${version}.AppImage`, `InjetBox-${version}-${mode}.AppImage`, true)
renameArtifact(`InjetBox-${version}.deb`, `InjetBox-${version}-${mode}.deb`, false)
