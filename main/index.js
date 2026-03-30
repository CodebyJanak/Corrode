/**
 * main/index.js — Corrode Browser
 * Electron main process. Creates the BrowserWindow and wires up IPC.
 */

const { app, BrowserWindow, ipcMain, session } = require('electron')
const path = require('path')
const { setupIPC } = require('./ipc')

// Determine if we're in dev (Vite dev server) or prod (built files)
const isDev = process.env.NODE_ENV !== 'production'
const VITE_DEV_URL = 'http://localhost:5173'

let mainWindow

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    frame: false,          // Custom frameless window — we draw our own chrome
    titleBarStyle: 'hidden',
    backgroundColor: '#0a0a0a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,    // Security: no Node in renderer
      contextIsolation: true,    // Security: isolated context
      webviewTag: true,          // Enable <webview> tag for browsing
      allowRunningInsecureContent: false,
    },
    icon: path.join(__dirname, '../public/icon.png'),
  })

  // Load the React app
  if (isDev) {
    mainWindow.loadURL(VITE_DEV_URL)
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  // Allow webviews to open new windows inside our tab system
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    // Send to renderer to open as a new tab
    mainWindow.webContents.send('open-new-tab', url)
    return { action: 'deny' }
  })

  mainWindow.on('closed', () => { mainWindow = null })
}

// Wire up all IPC handlers (AI, DB, window controls)
setupIPC(ipcMain)

app.whenReady().then(() => {
  // Allow webview to load any URL without CORS restrictions from renderer
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': ["default-src 'self' 'unsafe-inline' 'unsafe-eval' *"],
      },
    })
  })

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// Export so ipc.js can send events to renderer
module.exports = { getMainWindow: () => mainWindow }
