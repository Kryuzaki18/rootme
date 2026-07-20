import { create } from 'zustand'
import type { ProcessInstanceDto } from '../types/electron-api'
import { stripExeSuffix } from '../util'

export interface AppInstance {
  pid: number
  imageName: string
  windowTitle: string
  memUsage: string
  displayName: string
  iconDataUrl?: string
  isVisible: boolean
  isEditing: boolean
}

interface AppInstancesState {
  instances: AppInstance[]
  isLoading: boolean
  hasSearched: boolean
  verify: (title: string) => Promise<void>
  toggleVisibility: (pid: number) => Promise<void>
  focusInstance: (pid: number) => Promise<void>
  toggleEdit: (pid: number) => void
  saveEdit: (pid: number, displayName: string, iconDataUrl?: string) => Promise<void>
}

export const useAppInstancesStore = create<AppInstancesState>((set, get) => ({
  instances: [],
  isLoading: false,
  hasSearched: false,

  verify: async (title) => {
    set({ isLoading: true, hasSearched: true })

    const processes = await window.api.verifyProcesses(title)

    const instances: AppInstance[] = (processes as ProcessInstanceDto[]).map((proc) => ({
      ...proc,
      displayName: stripExeSuffix(proc.imageName),
      iconDataUrl: undefined,
      isVisible: true,
      isCollapsed: true,
      isEditing: false
    }))

    set({ instances, isLoading: false })
  },

  toggleVisibility: async (pid) => {
    const instance = get().instances.find((item) => item.pid === pid)
    if (!instance) return

    const nextVisible = !instance.isVisible
    const success = await window.api.setWindowVisibility(instance.pid, nextVisible)
    if (!success) return

    set({
      instances: get().instances.map((item) =>
        item.pid === pid ? { ...item, isVisible: nextVisible } : item
      )
    })
  },

  focusInstance: async (pid) => {
    const success = await window.api.focusWindow(pid)
    if (!success) return

    set({
      instances: get().instances.map((item) => (item.pid === pid ? { ...item, isVisible: true } : item))
    })
  },

  toggleEdit: (pid) => {
    set({
      instances: get().instances.map((instance) =>
        instance.pid === pid ? { ...instance, isEditing: !instance.isEditing } : instance
      )
    })
  },

  saveEdit: async (pid, displayName, iconDataUrl) => {
    const instance = get().instances.find((item) => item.pid === pid)
    if (!instance) return

    const [titleUpdated] = await Promise.all([
      window.api.setWindowTitle(pid, displayName),
      iconDataUrl ? window.api.setWindowIcon(pid, iconDataUrl) : Promise.resolve(true)
    ])

    set({
      instances: get().instances.map((item) =>
        item.pid === pid
          ? {
              ...item,
              displayName,
              iconDataUrl: iconDataUrl ?? item.iconDataUrl,
              windowTitle: titleUpdated ? displayName : item.windowTitle,
              isEditing: false
            }
          : item
      )
    })
  }
}))
