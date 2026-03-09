import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { auth, signInWithGoogle, signOutUser, onAuthStateChanged } from '../firebase'
import { loginWithToken } from '../api/auth'

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      firebaseUser: null,
      loading: true,
      error: null,

      initAuth: () => {
        return onAuthStateChanged(auth, async (firebaseUser) => {
          if (firebaseUser) {
            try {
              const token = await firebaseUser.getIdToken()
              const { data } = await loginWithToken(token)
              set({ user: data.user, firebaseUser, loading: false, error: null })
            } catch (e) {
              set({ user: null, firebaseUser: null, loading: false, error: e.message })
            }
          } else {
            set({ user: null, firebaseUser: null, loading: false })
          }
        })
      },

      login: async () => {
        set({ loading: true, error: null })
        try {
          const result = await signInWithGoogle()
          const token = await result.user.getIdToken()
          const { data } = await loginWithToken(token)
          set({ user: data.user, firebaseUser: result.user, loading: false })
        } catch (e) {
          set({ loading: false, error: e.message })
          throw e
        }
      },

      logout: async () => {
        await signOutUser()
        set({ user: null, firebaseUser: null })
      },

      updateUser: (updates) => set((state) => ({ user: { ...state.user, ...updates } })),
    }),
    {
      name: 'f1-auth',
      partialize: (state) => ({ user: state.user }),
    }
  )
)

export default useAuthStore
