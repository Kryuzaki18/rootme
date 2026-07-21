import { DRAG_MIME_TYPES } from '../constants/drag.constant'

export function stripExeSuffix(imageName: string): string {
  return imageName.replace(/\.exe$/i, '')
}

export function initials(text: string): string {
  return text.trim().slice(0, 2).toUpperCase() || '??'
}

export interface WindowBoundsDraft {
  width: number
  height: number
  x: number
  y: number
}

export function parseWindowBoundsDraft(
  widthDraft: string,
  heightDraft: string,
  xDraft: string,
  yDraft: string
): WindowBoundsDraft | null {
  const width = Number(widthDraft)
  const height = Number(heightDraft)
  const x = Number(xDraft)
  const y = Number(yDraft)

  const isValid = [width, height, x, y].every((value) => Number.isFinite(value))
  return isValid ? { width, height, x, y } : null
}

export function downloadJson(filename: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: DRAG_MIME_TYPES.PRESET_ITEM })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

const TRANSPARENT_PIXEL_GIF =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBTAA7'

let transparentDragImage: HTMLImageElement | null = null

export function suppressDefaultDragImage(event: { dataTransfer: DataTransfer }): void {
  if (!transparentDragImage) {
    transparentDragImage = new Image()
    transparentDragImage.src = TRANSPARENT_PIXEL_GIF
  }
  event.dataTransfer.setDragImage(transparentDragImage, 0, 0)
}
