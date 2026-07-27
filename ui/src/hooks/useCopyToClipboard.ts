import { useState } from 'react'
import { PID_COPIED_RESET_MS } from '@/constants/ui.constant'

export function useCopyToClipboard(resetMs: number = PID_COPIED_RESET_MS) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const copy = async (key: string, value: string) => {
    if (!value.trim()) return
    try {
      await navigator.clipboard.writeText(value)
      setCopiedKey(key)
      setTimeout(() => setCopiedKey((current) => (current === key ? null : current)), resetMs)
    } catch {
      // ignore clipboard failures
    }
  }

  return { copiedKey, copy }
}
