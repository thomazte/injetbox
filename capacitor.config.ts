import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'br.injetbox.app',
  appName: 'InjetBox',
  webDir: 'dist',
  android: {
    allowMixedContent: false,
    backgroundColor: '#0a0a0a',
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      backgroundColor: '#0a0a0a',
      showSpinner: false,
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#0a0a0a',
    },
  },
}

export default config
