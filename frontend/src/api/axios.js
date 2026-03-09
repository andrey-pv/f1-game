import axios from 'axios'
import { auth } from '../firebase'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  timeout: 15000,
})

api.interceptors.request.use(async (config) => {
  const user = auth.currentUser
  if (user) {
    try {
      const token = await user.getIdToken()
      config.headers.Authorization = `Bearer ${token}`
    } catch (e) {
      // token fetch failed — proceed without auth header
    }
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const user = auth.currentUser
        if (user) {
          const token = await user.getIdToken(true) // force refresh
          original.headers.Authorization = `Bearer ${token}`
          return api(original)
        }
      } catch (e) {
        // refresh failed
      }
    }
    return Promise.reject(error)
  }
)

export default api
