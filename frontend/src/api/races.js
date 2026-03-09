import api from './axios'

export const getRaces = (year) => api.get('/api/races', { params: year ? { season_year: year } : {} })
export const getRace = (id) => api.get(`/api/races/${id}`)
export const getDrivers = () => api.get('/api/drivers')
export const getTeams = () => api.get('/api/teams')
