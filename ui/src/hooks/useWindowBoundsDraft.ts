import { useState } from 'react'
import { parseWindowBoundsDraft, type WindowBoundsDraft } from '@/util'

export function useWindowBoundsDraft(initial?: WindowBoundsDraft | null) {
  const [width, setWidth] = useState(initial ? String(initial.width) : '')
  const [height, setHeight] = useState(initial ? String(initial.height) : '')
  const [x, setX] = useState(initial ? String(initial.x) : '')
  const [y, setY] = useState(initial ? String(initial.y) : '')

  const setBounds = (bounds: WindowBoundsDraft | null | undefined) => {
    setWidth(bounds ? String(bounds.width) : '')
    setHeight(bounds ? String(bounds.height) : '')
    setX(bounds ? String(bounds.x) : '')
    setY(bounds ? String(bounds.y) : '')
  }

  const parse = () => parseWindowBoundsDraft(width, height, x, y)

  return {
    fields: {
      width,
      height,
      x,
      y,
      onWidthChange: setWidth,
      onHeightChange: setHeight,
      onXChange: setX,
      onYChange: setY
    },
    setBounds,
    parse
  }
}
