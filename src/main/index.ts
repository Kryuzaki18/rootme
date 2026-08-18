import { app, BrowserWindow, ipcMain, dialog, Tray, Menu, nativeImage } from 'electron'
import { join, dirname } from 'path'
import { readFileSync, writeFileSync } from 'fs'
import {
  verifyProcesses,
  setWindowVisibility,
  setWindowTitle,
  setWindowIcon,
  focusWindow,
  hideWindowToTray,
  getWindowBounds,
  setWindowBounds
} from './processManager'

app.disableHardwareAcceleration()
app.commandLine.appendSwitch('no-sandbox')

let tray: Tray | null = null
let isQuitting = false

function getIconPickerStateFile(): string {
  return join(app.getPath('userData'), 'icon-picker-state.json')
}

function readLastIconDir(): string | undefined {
  try {
    const raw = readFileSync(getIconPickerStateFile(), 'utf-8')
    return (JSON.parse(raw) as { lastIconDir?: string }).lastIconDir
  } catch {
    return undefined
  }
}

function writeLastIconDir(dir: string): void {
  try {
    writeFileSync(getIconPickerStateFile(), JSON.stringify({ lastIconDir: dir }))
  } catch {
    // ignore persistence failures
  }
}

function createTray(mainWindow: BrowserWindow): Tray {
  const icon = nativeImage.createFromPath(join(__dirname, '../../ui/public/rootme-logo.png'))
  const trayIcon = new Tray(icon.isEmpty() ? icon : icon.resize({ width: 16, height: 16 }))
  trayIcon.setToolTip('RootMe')

  const showWindow = (): void => {
    mainWindow.show()
    mainWindow.focus()
  }

  trayIcon.setContextMenu(
    Menu.buildFromTemplate([
      { label: 'Open RootMe', click: showWindow },
      { type: 'separator' },
      { label: 'Force Close', click: () => app.quit() }
    ])
  )
  trayIcon.on('click', showWindow)

  return trayIcon
}

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    resizable: false,
    maximizable: false,
    icon: join(__dirname, '../../ui/public/rootme-logo.png'),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      backgroundThrottling: false,
    }
  })

  mainWindow.on('ready-to-show', () => mainWindow.show())

  // Closing the window hides it to the tray instead of quitting, unless the
  // user explicitly force-closed (tray menu or the in-app Force Close button).
  mainWindow.on('close', (event) => {
    if (isQuitting) return
    event.preventDefault()
    mainWindow.hide()
  })

  if (process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  tray = createTray(mainWindow)
}

function registerIpcHandlers(): void {
  ipcMain.handle('processes:verify', (_event, title: string) => verifyProcesses(title))

  ipcMain.handle('processes:setVisibility', (_event, pid: number, visible: boolean) =>
    setWindowVisibility(pid, visible)
  )

  ipcMain.handle('processes:setTitle', (_event, pid: number, title: string) => setWindowTitle(pid, title))

  ipcMain.handle('processes:setIcon', (_event, pid: number, iconDataUrl: string) =>
    setWindowIcon(pid, iconDataUrl)
  )

  ipcMain.handle('processes:focus', (_event, pid: number) => focusWindow(pid))

  ipcMain.handle('processes:hideToTray', (_event, pid: number) => hideWindowToTray(pid))

  ipcMain.handle('processes:getBounds', (_event, pid: number) => getWindowBounds(pid))

  ipcMain.handle(
    'processes:setBounds',
    (_event, pid: number, x: number, y: number, width: number, height: number) =>
      setWindowBounds(pid, x, y, width, height)
  )

  ipcMain.handle('app:forceQuit', () => app.quit())

  ipcMain.handle('icon:pick', async () => {
    const win = BrowserWindow.getFocusedWindow()
    const lastIconDir = readLastIconDir()
    const dialogOptions: Electron.OpenDialogOptions = {
      title: 'Choose app icon',
      properties: ['openFile'],
      filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'ico', 'svg'] }],
      ...(lastIconDir ? { defaultPath: lastIconDir } : {})
    }
    const result = win
      ? await dialog.showOpenDialog(win, dialogOptions)
      : await dialog.showOpenDialog(dialogOptions)

    if (result.canceled || result.filePaths.length === 0) return null

    const filePath = result.filePaths[0]
    const buffer = readFileSync(filePath)
    const ext = filePath.split('.').pop()?.toLowerCase() ?? 'png'
    const mime = ext === 'svg' ? 'image/svg+xml' : ext === 'ico' ? 'image/x-icon' : `image/${ext}`

    writeLastIconDir(dirname(filePath))

    return { dataUrl: `data:${mime};base64,${buffer.toString('base64')}` }
  })
}

void app.whenReady().then(() => {
  registerIpcHandlers()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('before-quit', () => {
  isQuitting = true
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
