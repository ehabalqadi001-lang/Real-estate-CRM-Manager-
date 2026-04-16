import { create } from 'zustand'

interface AuthUser {
  id: string
  email: string | undefined
  role: string | null
  company_id: string | null
}

interface AuthStore {
  user: AuthUser | null
  setUser: (user: AuthUser | null) => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}))
