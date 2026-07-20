import { contextBridge, ipcRenderer } from 'electron'

export interface ProcessInstanceDto {
  pid: number
  imageName: string
  windowTitle: string
  memUsage: string
}

export interface WindowBoundsDto {
  x: number
  y: number
  width: number
  height: number
}

const api = {
  verifyProcesses: (title: string): Promise<ProcessInstanceDto[]> =>
    ipcRenderer.invoke('processes:verify', title),

  setWindowVisibility: (pid: number, visible: boolean): Promise<boolean> =>
    ipcRenderer.invoke('processes:setVisibility', pid, visible),

  setWindowTitle: (pid: number, title: string): Promise<boolean> =>
    ipcRenderer.invoke('processes:setTitle', pid, title),

  setWindowIcon: (pid: number, iconDataUrl: string): Promise<boolean> =>
    ipcRenderer.invoke('processes:setIcon', pid, iconDataUrl),

  focusWindow: (pid: number): Promise<boolean> => ipcRenderer.invoke('processes:focus', pid),

  hideWindowToTray: (pid: number): Promise<boolean> => ipcRenderer.invoke('processes:hideToTray', pid),

  getWindowBounds: (pid: number): Promise<WindowBoundsDto | null> =>
    ipcRenderer.invoke('processes:getBounds', pid),

  setWindowBounds: (pid: number, x: number, y: number, width: number, height: number): Promise<boolean> =>
    ipcRenderer.invoke('processes:setBounds', pid, x, y, width, height),

  pickIconFile: (): Promise<{ dataUrl: string } | null> => ipcRenderer.invoke('icon:pick')
}

contextBridge.exposeInMainWorld('api', api)

export type Api = typeof api
