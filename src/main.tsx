import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Capacitor } from '@capacitor/core'
import { SplashScreen } from '@capacitor/splash-screen'
import { StatusBar, Style } from '@capacitor/status-bar'
import './index.css'
import App from './App.tsx'

async function setupNativeShell() {
  if (!Capacitor.isNativePlatform()) return
  try {
    await StatusBar.setStyle({ style: Style.Light })
    await StatusBar.setBackgroundColor({ color: '#0a0a0a' })
    await SplashScreen.hide()
  } catch {
    /* plugins only exist no Android/iOS */
  }
}

void setupNativeShell()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

if (import.meta.env.PROD && 'serviceWorker' in navigator && !Capacitor.isNativePlatform() && !navigator.userAgent.includes('Electron')) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js')
  })
}
