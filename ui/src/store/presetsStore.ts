import { create } from 'zustand'

export interface Preset {
  id: string
  title: string
  iconDataUrl?: string
  width: number
  height: number
  x: number
  y: number
}

interface PresetsState {
  presets: Preset[]
  savePreset: (preset: Omit<Preset, 'id'>) => void
  updatePreset: (id: string, preset: Omit<Preset, 'id'>) => void
  deletePreset: (id: string) => void
}

const STORAGE_KEY = 'rootme.presets'

function loadPresets(): Preset[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Preset[]) : []
  } catch {
    return []
  }
}

function persistPresets(presets: Preset[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(presets))
}

export const usePresetsStore = create<PresetsState>((set, get) => ({
  presets: loadPresets(),

  savePreset: (preset) => {
    const presets = [...get().presets, { ...preset, id: crypto.randomUUID() }]
    persistPresets(presets)
    set({ presets })
  },

  updatePreset: (id, preset) => {
    const presets = get().presets.map((item) => (item.id === id ? { ...preset, id } : item))
    persistPresets(presets)
    set({ presets })
  },

  deletePreset: (id) => {
    const presets = get().presets.filter((preset) => preset.id !== id)
    persistPresets(presets)
    set({ presets })
  }
}))
