import fs from 'node:fs'

const raw = process.env.GITHUB_REF_NAME || process.argv[2] || ''
const version = raw.replace(/^v/i, '')

if (!/^\d+\.\d+\.\d+$/.test(version)) {
  console.log('Sem tag vX.Y.Z; mantendo a versão do package.json')
  process.exit(0)
}

const pkgPath = 'package.json'
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
pkg.version = version
fs.writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`)

const gradlePath = 'android/app/build.gradle'
let gradle = fs.readFileSync(gradlePath, 'utf8')
gradle = gradle.replace(/versionName "[^"]+"/, `versionName "${version}"`)
fs.writeFileSync(gradlePath, gradle)

console.log(`Versão de release: ${version}`)
