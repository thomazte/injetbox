import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const modes = ['operacao', 'catalogo']
const bundleDir = path.resolve('release-linux')
fs.rmSync(bundleDir, { recursive: true, force: true })
fs.mkdirSync(bundleDir, { recursive: true })

for (const mode of modes) {
  const result = spawnSync('npm', ['run', 'desktop:build:linux'], {
    stdio: 'inherit',
    env: { ...process.env, VITE_APP_MODE: mode },
  })
  if (result.status !== 0) process.exit(result.status ?? 1)

  for (const name of fs.readdirSync('release')) {
    if (!name.includes(`-${mode}.`)) continue
    fs.copyFileSync(path.join('release', name), path.join(bundleDir, name))
  }
}

console.log(`Pacotes Linux em ${bundleDir}`)
