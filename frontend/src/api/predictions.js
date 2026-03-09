import api from './axios'

export const submitPrediction = (data) => api.post('/api/predictions', data)
export const getPrediction = (raceId) => api.get(`/api/predictions/${raceId}`)
export const getPredictionHistory = () => api.get('/api/predictions/history')
