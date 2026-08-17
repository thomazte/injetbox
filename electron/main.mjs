import { app, BrowserWindow, shell } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const electronDir = path.dirname(fileURLToPath(import.meta.url))

function createWindow() {
  const window = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 420,
    minHeight: 640,
    title: 'InjetBox  © ZamohtExe',
    backgroundColor: '#0a0a0a',
    autoHideMenuBar: true,
    show: false,
    icon: path.join(electronDir, '../public/icon-512.png'),
    webPreferences: {
      preload: path.join(electronDir, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  window.once('ready-to-show', () => window.show())
  window.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url)
    return { action: 'deny' }
  })

  if (app.isPackaged) {
    void window.loadFile(path.join(electronDir, '../dist/index.html'))
  } else {
    void window.loadURL('http://localhost:5173')
  }
}

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
