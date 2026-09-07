import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const androidHome =
  process.env.ANDROID_HOME ||
  process.env.ANDROID_SDK_ROOT ||
  (process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, 'Android', 'Sdk') : '')

const isWindows = process.platform === 'win32'
const gradle = isWindows ? 'gradlew.bat' : './gradlew'

const result = spawnSync(gradle, ['assembleDebug', '--no-daemon'], {
  cwd: 'android',
  stdio: 'inherit',
  env: {
    ...process.env,
    ANDROID_HOME: androidHome,
    ANDROID_SDK_ROOT: androidHome,
  },
  shell: isWindows,
})

if (result.status !== 0) {
  process.exit(result.status ?? 1)
}

const src = path.join('android', 'app', 'build', 'outputs', 'apk', 'debug', 'InjetBox.apk')
if (!fs.existsSync(src)) {
  console.error('APK não encontrado:', src)
  process.exit(1)
}

if (!process.env.CI && process.env.USERPROFILE) {
  const destDir = path.join(process.env.USERPROFILE, 'Desktop', 'InjetBox')
  fs.mkdirSync(destDir, { recursive: true })
  const dest = path.join(destDir, 'InjetBox.apk')
  fs.copyFileSync(src, dest)
  console.log(`APK pronto: ${dest}`)
} else {
  console.log(`APK pronto: ${path.resolve(src)}`)
}
