import { useState } from 'react'
import type { PresetGroup, PresetItem } from '@/store/presetsStore'

function setPidsIn(current: Set<number>, pids: number[], focused: boolean): Set<number> {
  const next = new Set(current)
  for (const pid of pids) {
    if (focused) next.add(pid)
    else next.delete(pid)
  }
  return next
}

function focusItemAtPosition(item: PresetItem & { pid: number }) {
  return Promise.all([
    window.api.focusWindow(item.pid),
    window.api.setWindowBounds(item.pid, item.x, item.y, item.width, item.height),
    item.iconDataUrl ? window.api.setWindowIcon(item.pid, item.iconDataUrl) : Promise.resolve(true)
  ]).then(([focused]) => focused)
}

export function usePresetFocus() {
  const [focusedPids, setFocusedPids] = useState<Set<number>>(new Set())

  const setPidsFocused = (pids: number[], focused: boolean) => {
    setFocusedPids((current) => setPidsIn(current, pids, focused))
  }

  const isItemFocused = (item: PresetItem) => item.pid !== undefined && focusedPids.has(item.pid)

  const toggleItemFocus = (item: PresetItem) => {
    if (item.pid === undefined) return

    const pid = item.pid
    const nextFocused = !focusedPids.has(pid)
    setPidsFocused([pid], nextFocused)

    const request = nextFocused
      ? focusItemAtPosition(item as PresetItem & { pid: number })
      : window.api.hideWindowToTray(pid)
    request.then((success) => {
      if (!success) setPidsFocused([pid], !nextFocused)
    })
  }

  const isGroupFocused = (group: PresetGroup) => {
    const pids = group.items.map((item) => item.pid).filter((pid): pid is number => pid !== undefined)
    return pids.length > 0 && pids.every((pid) => focusedPids.has(pid))
  }

  const toggleGroupFocus = (group: PresetGroup) => {
    const items = group.items.filter((item): item is PresetItem & { pid: number } => item.pid !== undefined)
    if (items.length === 0) return

    const nextFocused = !isGroupFocused(group)
    const pids = items.map((item) => item.pid)
    setPidsFocused(pids, nextFocused)

    Promise.all(
      items.map((item) => (nextFocused ? focusItemAtPosition(item) : window.api.hideWindowToTray(item.pid)))
    ).then((results) => {
      const failedPids = pids.filter((_, index) => !results[index])
      if (failedPids.length > 0) setPidsFocused(failedPids, !nextFocused)
    })
  }

  return { isItemFocused, toggleItemFocus, isGroupFocused, toggleGroupFocus }
}
