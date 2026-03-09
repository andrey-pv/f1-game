import api from './axios'

export const getLeaderboard = (params) => api.get('/api/leaderboard', { params })
export const getMyRank = () => api.get('/api/leaderboard/me')
export const getBadges = () => api.get('/api/badges')
export const getUserStats = (userId) => api.get(`/api/stats/${userId}`)
