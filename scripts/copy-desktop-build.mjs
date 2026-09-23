import fs from 'node:fs'
import path from 'node:path'

if (process.env.CI) process.exit(0)

const releaseDir = path.resolve('release')
if (!fs.existsSync(releaseDir)) process.exit(0)

function desktopDir() {
  if (process.env.USERPROFILE) {
    return path.join(process.env.USERPROFILE, 'Desktop', 'InjetBox')
  }
  const home = process.env.HOME
  if (!home) return ''
  const existing = ['Desktop', 'Área de Trabalho']
    .map((name) => path.join(home, name))
    .find((dir) => fs.existsSync(dir))
  return path.join(existing || path.join(home, 'Desktop'), 'InjetBox')
}

const destDir = desktopDir()
if (!destDir) process.exit(0)

const mode = String(process.env.VITE_APP_MODE || '').trim().toLowerCase()
const artifacts = fs.readdirSync(releaseDir).filter((name) => {
  const lower = name.toLowerCase()
  if (lower.endsWith('.exe')) return true
  const isLinux = lower.endsWith('.appimage') || lower.endsWith('.deb')
  if (!isLinux) return false
  return mode ? name.includes(`-${mode}.`) : true
})
if (!artifacts.length) process.exit(0)

fs.mkdirSync(destDir, { recursive: true })
for (const name of artifacts) {
  const dest = path.join(destDir, name)
  fs.copyFileSync(path.join(releaseDir, name), dest)
  if (name.toLowerCase().endsWith('.appimage')) fs.chmodSync(dest, 0o755)
  console.log(`Programa pronto: ${dest}`)
}
