import { create } from 'zustand'
import { createClient } from '@/shared/supabase/browser'

interface AuthUser {
  id: string
  email: string | undefined
  role: string | null
  company_id: string | null
}

interface AuthStore {
  user: AuthUser | null
  setUser: (user: AuthUser | null) => void
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  logout: async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    set({ user: null })
  },
}))
