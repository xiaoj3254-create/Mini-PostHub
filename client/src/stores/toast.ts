import { defineStore } from 'pinia'

export interface ToastItem {
  id: number
  type: 'success' | 'error' | 'info'
  message: string
}

let seed = 0

export const useToastStore = defineStore('toast', {
  state: () => ({
    toasts: [] as ToastItem[],
  }),
  actions: {
    show(type: ToastItem['type'], message: string) {
      const id = ++seed
      this.toasts.push({ id, type, message })
      setTimeout(() => this.dismiss(id), 2600)
    },
    dismiss(id: number) {
      this.toasts = this.toasts.filter((t) => t.id !== id)
    },
    success(message: string) {
      this.show('success', message)
    },
    error(message: string) {
      this.show('error', message)
    },
    info(message: string) {
      this.show('info', message)
    },
  },
})
