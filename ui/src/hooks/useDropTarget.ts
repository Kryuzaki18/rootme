import { useState, type DragEvent } from 'react'

interface DropTargetOptions {
  stopPropagation?: boolean
}

export function useDropTarget<T>(
  mimeType: string,
  onDrop: (payload: T, event: DragEvent<HTMLDivElement>) => void,
  options: DropTargetOptions = {}
) {
  const [isDragOver, setIsDragOver] = useState(false)

  const accepts = (event: DragEvent<HTMLDivElement>) => event.dataTransfer.types.includes(mimeType)

  const dropHandlers = {
    onDragOver: (event: DragEvent<HTMLDivElement>) => {
      if (!accepts(event)) return
      event.preventDefault()
      event.dataTransfer.dropEffect = 'copy'
    },
    onDragEnter: (event: DragEvent<HTMLDivElement>) => {
      if (!accepts(event)) return
      event.preventDefault()
      if (options.stopPropagation) event.stopPropagation()
      setIsDragOver(true)
    },
    onDragLeave: (_event: DragEvent<HTMLDivElement>) => setIsDragOver(false),
    onDrop: (event: DragEvent<HTMLDivElement>) => {
      const raw = event.dataTransfer.getData(mimeType)
      setIsDragOver(false)
      if (!raw) return
      event.preventDefault()
      if (options.stopPropagation) event.stopPropagation()

      let payload: T
      try {
        payload = JSON.parse(raw)
      } catch {
        return
      }
      onDrop(payload, event)
    }
  }

  return { isDragOver, dropHandlers, close: () => setIsDragOver(false) }
}
