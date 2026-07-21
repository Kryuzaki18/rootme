import { create } from 'zustand'
import type { ProcessInstanceDto } from '../types/electron-api'
import { stripExeSuffix } from '../util'
import { STORAGE_KEYS } from '../constants/storage.constant'
import { MAX_RECENT_SEARCHES } from '../constants/ui.constant'

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

export interface RecentSearchEntry {
  term: string
  appNames: string[]
  timestamp: number
}

interface AppInstancesState {
  instances: AppInstance[]
  isLoading: boolean
  hasSearched: boolean
  recentSearches: RecentSearchEntry[]
  verify: (title: string) => Promise<void>
  clearSearch: () => void
  clearRecentSearches: () => void
  removeRecentSearch: (term: string) => void
  toggleVisibility: (pid: number) => Promise<void>
  focusInstance: (pid: number) => Promise<void>
  toggleEdit: (pid: number) => void
  saveEdit: (pid: number, displayName: string, iconDataUrl?: string) => Promise<void>
}

function loadRecentSearches(): RecentSearchEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RECENT_SEARCHES)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []

    return parsed
      .map((entry): RecentSearchEntry | null => {
        if (typeof entry === 'string') return { term: entry, appNames: [], timestamp: Date.now() }
        if (entry && typeof entry === 'object' && typeof entry.term === 'string') {
          return {
            term: entry.term,
            appNames: Array.isArray(entry.appNames)
              ? entry.appNames.filter((name: unknown): name is string => typeof name === 'string')
              : [],
            timestamp: typeof entry.timestamp === 'number' ? entry.timestamp : Date.now()
          }
        }
        return null
      })
      .filter((entry): entry is RecentSearchEntry => entry !== null)
  } catch {
    return []
  }
}

function persistRecentSearches(recentSearches: RecentSearchEntry[]): void {
  localStorage.setItem(STORAGE_KEYS.RECENT_SEARCHES, JSON.stringify(recentSearches))
}

function addRecentSearch(current: RecentSearchEntry[], term: string, appNames: string[]): RecentSearchEntry[] {
  const trimmed = term.trim()
  if (!trimmed) return current

  const deduped = current.filter((existing) => existing.term.toLowerCase() !== trimmed.toLowerCase())
  const entry: RecentSearchEntry = { term: trimmed, appNames, timestamp: Date.now() }
  return [entry, ...deduped].slice(0, MAX_RECENT_SEARCHES)
}

export const useAppInstancesStore = create<AppInstancesState>((set, get) => ({
  instances: [],
  isLoading: false,
  hasSearched: false,
  recentSearches: loadRecentSearches(),

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

    if (instances.length > 0) {
      const appNames = [...new Set(instances.map((instance) => instance.displayName))]
      const recentSearches = addRecentSearch(get().recentSearches, title, appNames)
      persistRecentSearches(recentSearches)
      set({ instances, isLoading: false, recentSearches })
    } else {
      set({ instances, isLoading: false })
    }
  },

  clearSearch: () => {
    set({ instances: [], isLoading: false, hasSearched: false })
  },

  clearRecentSearches: () => {
    persistRecentSearches([])
    set({ recentSearches: [] })
  },

  removeRecentSearch: (term) => {
    const recentSearches = get().recentSearches.filter((entry) => entry.term !== term)
    persistRecentSearches(recentSearches)
    set({ recentSearches })
  },

  toggleVisibility: async (pid) => {
    const instance = get().instances.find((item) => item.pid === pid)
    if (!instance) return

    const nextVisible = !instance.isVisible
    const success = nextVisible
      ? await window.api.focusWindow(instance.pid)
      : await window.api.setWindowVisibility(instance.pid, false)
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
