import type { PresetItem } from '@/store/presetsStore'

export interface DraggedAppInstanceEntry {
  pid: number
  title: string
  iconDataUrl?: string
}

export interface DraggedAppInstancePayload {
  instances: DraggedAppInstanceEntry[]
}

export interface DraggedPresetItemPayload extends PresetItem {
  groupId: string
}

export interface DraggedPresetGroupPayload {
  groupId: string
}
