import type { PresetItem } from '@/store/presetsStore'

export interface DraggedAppInstancePayload {
  pid: number
  title: string
  iconDataUrl?: string
}

export interface DraggedPresetItemPayload extends PresetItem {
  groupId: string
}
