import { contextBridge, ipcRenderer } from 'electron'

export interface ProcessInstanceDto {
  pid: number
  imageName: string
  windowTitle: string
  memUsage: string
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

  pickIconFile: (): Promise<{ dataUrl: string } | null> => ipcRenderer.invoke('icon:pick')
}

contextBridge.exposeInMainWorld('api', api)

export type Api = typeof api
