// src/api/axios.js — Axios instance with JWT interceptor
import axios from 'axios'

const api = axios.create({
  baseURL: 'https://shopease1-backend-vit4.onrender.com/api',          // Vite proxy forward https://shopease1-backend-vit4.onrender.com to /api
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
})

// Attach JWT token to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('shopease_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
}, (error) => Promise.reject(error))

// Handle 401 globally — redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('shopease_token')
      localStorage.removeItem('shopease_user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
