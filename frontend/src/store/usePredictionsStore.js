import { create } from 'zustand'
import { submitPrediction, getPrediction, getPredictionHistory } from '../api/predictions'

const usePredictionsStore = create((set, get) => ({
  predictions: {},
  history: [],
  loading: false,
  error: null,

  fetchPrediction: async (raceId) => {
    try {
      const { data } = await getPrediction(raceId)
      set((state) => ({ predictions: { ...state.predictions, [raceId]: data } }))
      return data
    } catch (e) {
      if (e.response?.status === 404) return null
      throw e
    }
  },

  fetchHistory: async () => {
    set({ loading: true })
    try {
      const { data } = await getPredictionHistory()
      set({ history: data, loading: false })
    } catch (e) {
      set({ loading: false, error: e.message })
    }
  },

  submitPrediction: async (raceId, winnerId, poleId) => {
    set({ loading: true, error: null })
    try {
      const { data } = await submitPrediction({
        race_id: raceId,
        predicted_winner_id: winnerId,
        predicted_pole_id: poleId,
      })
      set((state) => ({
        predictions: { ...state.predictions, [raceId]: data },
        loading: false,
      }))
      return data
    } catch (e) {
      set({ loading: false, error: e.response?.data?.detail || e.message })
      throw e
    }
  },
}))

export default usePredictionsStore
