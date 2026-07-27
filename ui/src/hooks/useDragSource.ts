import { useState, type DragEvent } from 'react'
import { suppressDefaultDragImage } from '@/util'

export function useDragSource<T>(mimeType: string, getPayload: () => T) {
  const [isDragging, setIsDragging] = useState(false)

  const dragHandlers = {
    draggable: true as const,
    onDragStart: (event: DragEvent<HTMLDivElement>) => {
      event.dataTransfer.effectAllowed = 'copy'
      event.dataTransfer.setData(mimeType, JSON.stringify(getPayload()))
      suppressDefaultDragImage(event)
      setIsDragging(true)
    },
    onDragEnd: () => setIsDragging(false)
  }

  return { isDragging, dragHandlers }
}
