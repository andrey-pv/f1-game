import { create } from 'zustand'
import { getLeaderboard, getMyRank } from '../api/leaderboard'

const useLeaderboardStore = create((set) => ({
  entries: [],
  total: 0,
  myRank: null,
  loading: false,
  error: null,

  fetchLeaderboard: async (params = {}) => {
    set({ loading: true, error: null })
    try {
      const { data } = await getLeaderboard(params)
      set({ entries: data.entries, total: data.total, loading: false })
    } catch (e) {
      set({ loading: false, error: e.message })
    }
  },

  fetchMyRank: async () => {
    try {
      const { data } = await getMyRank()
      set({ myRank: data })
    } catch (e) {
      // not authenticated — ignore
    }
  },
}))

export default useLeaderboardStore
