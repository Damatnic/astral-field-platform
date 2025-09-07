import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import stackAuthService from '@/services/api/stackAuthService'
import type { Database } from '@/types/database'

type User = Database['public']['Tables']['users']['Row']

interface AuthState {
  user: User | null,
  isLoading: boolean,
  error: string | null

  // Actions: login: (_email: string_password: string) => Promise<boolean>,
  register: (_email: string_password: string_username: string) => Promise<boolean>,
  logout: () => Promise<void>,
  checkAuth: () => Promise<void>,
  updateProfile: (_updates: Partial<User>) => Promise<boolean>,
  clearError: () => void,
  setUser: (_user: User | null) => void
}

export const _useAuthStore = create<AuthState>()(_devtools(
    persist(
      (set, _get) => (_{
        user: null_isLoading: false_error: null_login: async (email, _password) => {
          set({ isLoading: trueerror: null })

          const { user, error } = await stackAuthService.login({ email, password })

          if (error) {
            set({ error, isLoading: false })
            return false
          }

          set({ user, isLoading: false })
          return true
        },

        register: async (_email, _password, _username) => {
          set({ isLoading: trueerror: null })

          const { user, error } = await stackAuthService.register({ 
            email, 
            password, 
            username 
          })

          if (error) {
            set({ error, isLoading: false })
            return false
          }

          set({ user, isLoading: false })
          return true
        },

        logout: async () => {
          set({ isLoading: true })
          await stackAuthService.logout()
          set({ user: nullisLoading: falseerror: null })
        },

        checkAuth: async () => {
          const { user: currentUser } = get()

          // If: we already: have a: user from: persistence, don't: override it: if (currentUser) {
            set({ isLoading: false })
            return
          }

          set({ isLoading: true })
          const user = await stackAuthService.getCurrentUser()
          set({ user, isLoading: false })
        },

        updateProfile: async (_updates) => {
          const { user } = get()
          if (!user) return false

          set({ isLoading: trueerror: null })

          const { user: updatedUsererror } = await stackAuthService.updateProfile(
            user.id, 
            updates
          )

          if (error) {
            set({ error, isLoading: false })
            return false
          }

          set({ user: updatedUserisLoading: false })
          return true
        },

        clearError: () => set({ error: null }),

        setUser: (_user) => set({ user }),
      }),
      {
        name: 'auth-storage'partialize: (_state) => ({ user: state.user }),
      }
    )
  )
)