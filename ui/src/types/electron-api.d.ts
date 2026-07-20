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

export interface ElectronApi {
  verifyProcesses: (title: string) => Promise<ProcessInstanceDto[]>
  setWindowVisibility: (pid: number, visible: boolean) => Promise<boolean>
  setWindowTitle: (pid: number, title: string) => Promise<boolean>
  setWindowIcon: (pid: number, iconDataUrl: string) => Promise<boolean>
  focusWindow: (pid: number) => Promise<boolean>
  hideWindowToTray: (pid: number) => Promise<boolean>
  getWindowBounds: (pid: number) => Promise<WindowBoundsDto | null>
  setWindowBounds: (pid: number, x: number, y: number, width: number, height: number) => Promise<boolean>
  pickIconFile: () => Promise<{ dataUrl: string } | null>
}

declare global {
  interface Window {
    api: ElectronApi
  }
}
