import fs from 'node:fs'
import path from 'node:path'

if (process.env.CI || !process.env.USERPROFILE) process.exit(0)

const releaseDir = path.resolve('release')
if (!fs.existsSync(releaseDir)) process.exit(0)

const exe = fs.readdirSync(releaseDir).find((name) => name.toLowerCase().endsWith('.exe'))
if (!exe) process.exit(0)

const destDir = path.join(process.env.USERPROFILE, 'Desktop', 'InjetBox')
fs.mkdirSync(destDir, { recursive: true })
const dest = path.join(destDir, exe)
fs.copyFileSync(path.join(releaseDir, exe), dest)
console.log(`Programa pronto: ${dest}`)
