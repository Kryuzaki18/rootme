import { create } from 'zustand'

export type ToastVariant = 'error' | 'success' | 'info'

export interface ToastMessage {
  id: string
  message: string
  variant: ToastVariant
}

interface ToastState {
  toasts: ToastMessage[]
  showToast: (message: string, variant?: ToastVariant) => void
  dismissToast: (id: string) => void
}

const TOAST_DURATION_MS = 4000

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],

  showToast: (message, variant = 'info') => {
    const id = crypto.randomUUID()
    set({ toasts: [...get().toasts, { id, message, variant }] })
    setTimeout(() => get().dismissToast(id), TOAST_DURATION_MS)
  },

  dismissToast: (id) => {
    set({ toasts: get().toasts.filter((toast) => toast.id !== id) })
  }
}))
