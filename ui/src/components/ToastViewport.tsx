import { createPortal } from 'react-dom'
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react'
import { useToastStore, type ToastVariant } from '@/store/toastStore'
import IconButton from './IconButton'

const VARIANT_STYLES: Record<ToastVariant, { icon: typeof AlertTriangle; className: string }> = {
  error: {
    icon: AlertTriangle,
    className: 'border-red-200 bg-white text-red-600 dark:border-red-900/60 dark:bg-zinc-900 dark:text-red-400'
  },
  success: {
    icon: CheckCircle2,
    className:
      'border-emerald-200 bg-white text-emerald-600 dark:border-emerald-900/60 dark:bg-zinc-900 dark:text-emerald-400'
  },
  info: {
    icon: Info,
    className: 'border-zinc-200 bg-white text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300'
  }
}

export default function ToastViewport() {
  const { toasts, dismissToast } = useToastStore()

  if (toasts.length === 0) return null

  return createPortal(
    <div className="fixed right-4 bottom-4 z-50 flex w-full max-w-sm flex-col gap-2">
      {toasts.map((toast) => {
        const { icon: Icon, className } = VARIANT_STYLES[toast.variant]
        return (
          <div
            key={toast.id}
            role="alert"
            className={`animate-fade-in flex items-start gap-2 rounded-lg border px-3 py-2.5 text-xs shadow-lg shadow-zinc-950/10 dark:shadow-black/30 ${className}`}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <p className="flex-1 leading-relaxed">{toast.message}</p>
            <IconButton
              icon={X}
              label="Dismiss"
              onClick={() => dismissToast(toast.id)}
              className="shrink-0 rounded-full p-0.5 text-inherit opacity-60 transition-opacity hover:opacity-100"
              iconClassName="h-3 w-3"
            />
          </div>
        )
      })}
    </div>,
    document.body
  )
}
