import { create } from 'zustand'

export interface PresetItem {
  id: string
  title: string
  iconDataUrl?: string
  width: number
  height: number
  x: number
  y: number
}

export interface PresetGroup {
  id: string
  items: PresetItem[]
}

interface PresetsState {
  groups: PresetGroup[]
  addGroup: () => string
  deleteGroup: (groupId: string) => void
  addItem: (groupId: string, item: Omit<PresetItem, 'id'>) => void
  updateItem: (groupId: string, itemId: string, item: Omit<PresetItem, 'id'>) => void
  deleteItem: (groupId: string, itemId: string) => void
  importGroups: (data: unknown) => void
}

const STORAGE_KEY = 'rootme.presets'

// Accepts either the current group format or a legacy flat preset list.
function normalizeGroupsData(parsed: unknown): PresetGroup[] {
  if (!Array.isArray(parsed) || parsed.length === 0) return []

  if (!('items' in parsed[0])) {
    return [{ id: crypto.randomUUID(), items: parsed as PresetItem[] }]
  }

  return parsed as PresetGroup[]
}

function loadGroups(): PresetGroup[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return normalizeGroupsData(JSON.parse(raw))
  } catch {
    return []
  }
}

function persistGroups(groups: PresetGroup[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(groups))
}

export const usePresetsStore = create<PresetsState>((set, get) => ({
  groups: loadGroups(),

  addGroup: () => {
    const id = crypto.randomUUID()
    const groups = [...get().groups, { id, items: [] }]
    persistGroups(groups)
    set({ groups })
    return id
  },

  deleteGroup: (groupId) => {
    const groups = get().groups.filter((group) => group.id !== groupId)
    persistGroups(groups)
    set({ groups })
  },

  addItem: (groupId, item) => {
    const groups = get().groups.map((group) =>
      group.id === groupId ? { ...group, items: [...group.items, { ...item, id: crypto.randomUUID() }] } : group
    )
    persistGroups(groups)
    set({ groups })
  },

  updateItem: (groupId, itemId, item) => {
    const groups = get().groups.map((group) =>
      group.id === groupId
        ? { ...group, items: group.items.map((existing) => (existing.id === itemId ? { ...item, id: itemId } : existing)) }
        : group
    )
    persistGroups(groups)
    set({ groups })
  },

  deleteItem: (groupId, itemId) => {
    const groups = get().groups.map((group) =>
      group.id === groupId ? { ...group, items: group.items.filter((existing) => existing.id !== itemId) } : group
    )
    persistGroups(groups)
    set({ groups })
  },

  importGroups: (data) => {
    const imported = normalizeGroupsData(data).map((group) => ({
      id: crypto.randomUUID(),
      items: group.items.map((item) => ({ ...item, id: crypto.randomUUID() }))
    }))
    if (imported.length === 0) return

    const groups = [...get().groups, ...imported]
    persistGroups(groups)
    set({ groups })
  }
}))
