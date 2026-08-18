import { useEffect, useRef, useState, type DragEvent } from 'react'

interface DropTargetOptions {
  stopPropagation?: boolean
  dropEffect?: 'copy' | 'move' | 'link' | 'none'
}

// Native dragenter/dragleave pairing is unreliable across nested children (an element's
// dragenter/dragleave can fire once per descendant boundary crossed instead of once per
// element, so a naive enter/leave toggle - or even an enter/leave counter - can get stuck
// "on"). Instead we treat "isDragOver" as "did an onDragOver land recently": onDragOver
// fires repeatedly while the pointer is over a target, so we flip on immediately and flip
// off via a short timer that keeps getting pushed back - it self-heals the moment events
// stop arriving, with no enter/leave bookkeeping to get out of sync.
const HOVER_TIMEOUT_MS = 200

export function useDropTarget<T>(
  mimeType: string,
  onDrop: (payload: T, event: DragEvent<HTMLDivElement>) => void,
  options: DropTargetOptions = {}
) {
  const [isDragOver, setIsDragOver] = useState(false)
  const clearTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dropEffect = options.dropEffect ?? 'copy'

  useEffect(() => () => {
    if (clearTimer.current) clearTimeout(clearTimer.current)
  }, [])

  const accepts = (event: DragEvent<HTMLDivElement>) => event.dataTransfer.types.includes(mimeType)

  const reset = () => {
    if (clearTimer.current) {
      clearTimeout(clearTimer.current)
      clearTimer.current = null
    }
    setIsDragOver(false)
  }

  const dropHandlers = {
    onDragOver: (event: DragEvent<HTMLDivElement>) => {
      if (!accepts(event)) return
      event.preventDefault()
      event.dataTransfer.dropEffect = dropEffect
      setIsDragOver(true)
      if (clearTimer.current) clearTimeout(clearTimer.current)
      clearTimer.current = setTimeout(() => setIsDragOver(false), HOVER_TIMEOUT_MS)
    },
    onDragEnter: (event: DragEvent<HTMLDivElement>) => {
      if (!accepts(event)) return
      event.preventDefault()
      if (options.stopPropagation) event.stopPropagation()
    },
    onDragLeave: (_event: DragEvent<HTMLDivElement>) => {},
    onDrop: (event: DragEvent<HTMLDivElement>) => {
      const raw = event.dataTransfer.getData(mimeType)
      reset()
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

  return { isDragOver, dropHandlers, close: reset }
}
