export interface ProcessInstanceDto {
  pid: number
  imageName: string
  windowTitle: string
  memUsage: string
}

export interface ElectronApi {
  verifyProcesses: (title: string) => Promise<ProcessInstanceDto[]>
  setWindowVisibility: (pid: number, visible: boolean) => Promise<boolean>
  setWindowTitle: (pid: number, title: string) => Promise<boolean>
  setWindowIcon: (pid: number, iconDataUrl: string) => Promise<boolean>
  focusWindow: (pid: number) => Promise<boolean>
  pickIconFile: () => Promise<{ dataUrl: string } | null>
}

declare global {
  interface Window {
    api: ElectronApi
  }
}
