import Cookies from 'js-cookie'
import { create } from 'zustand'

interface AuthState {
  token: string | null
  setToken: (token: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  token: Cookies.get('token') ?? null,
  setToken: (token) => {
    Cookies.set('token', token, { expires: 1 })
    set({ token })
  },
  logout: () => {
    Cookies.remove('token')
    set({ token: null })
  },
}))
