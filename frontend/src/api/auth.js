import api from './axios'

export const loginWithToken = (idToken) => api.post('/api/auth/login', { id_token: idToken })
export const getMe = () => api.get('/api/auth/me')
