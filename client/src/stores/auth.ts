import { defineStore } from 'pinia'
import * as authApi from '../api/auth'
import type { User } from '../types'

function readStoredUser(): User | null {
  try {
    const raw = localStorage.getItem('user')
    return raw ? (JSON.parse(raw) as User) : null
  } catch {
    return null
  }
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token') || '',
    user: readStoredUser(),
  }),
  getters: {
    isLoggedIn: (s) => !!s.token,
    isAdmin: (s) => s.user?.role === 'admin',
  },
  actions: {
    setAuth(token: string, user: User) {
      this.token = token
      this.user = user
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
    },
    clearAuth() {
      this.token = ''
      this.user = null
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    },
    async login(username: string, password: string) {
      const res = await authApi.login({ username, password })
      this.setAuth(res.token, res.user)
      return res.user
    },
    async register(data: { username: string; password: string; nickname?: string }) {
      const res = await authApi.register(data)
      this.setAuth(res.token, res.user)
      return res.user
    },
    async refreshUser() {
      if (!this.token) return
      const user = await authApi.getMe()
      this.user = user
      localStorage.setItem('user', JSON.stringify(user))
    },
    logout() {
      this.clearAuth()
    },
  },
})
