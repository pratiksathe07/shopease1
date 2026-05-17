// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react'
import api from '../api/axios'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(() => JSON.parse(localStorage.getItem('shopease_user') || 'null'))
  const [token,   setToken]   = useState(() => localStorage.getItem('shopease_token') || null)
  const [loading, setLoading] = useState(false)

  const isLoggedIn = !!token
  const isAdmin    = user?.role === 'admin'

  // ── Login ──────────────────────────────────
  const login = async (email, password, role = 'user') => {
    setLoading(true)
    try {
      const { data } = await api.post('/auth/login', { email, password, role })
      localStorage.setItem('shopease_token', data.data.token)
      localStorage.setItem('shopease_user',  JSON.stringify(data.data.user))
      setToken(data.data.token)
      setUser(data.data.user)
      return { success: true, user: data.data.user }
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Login failed' }
    } finally { setLoading(false) }
  }

  // ── Register ───────────────────────────────
  const register = async (name, email, mobile, password) => {
    setLoading(true)
    try {
      const { data } = await api.post('/auth/register', { name, email, mobile, password })
      return { success: true }
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Registration failed' }
    } finally { setLoading(false) }
  }

  // ── Logout ─────────────────────────────────
  const logout = () => {
    localStorage.removeItem('shopease_token')
    localStorage.removeItem('shopease_user')
    setToken(null)
    setUser(null)
  }

  // ── Update local user after profile edit ───
  const updateUser = (updatedUser) => {
    setUser(updatedUser)
    localStorage.setItem('shopease_user', JSON.stringify(updatedUser))
  }

  return (
    <AuthContext.Provider value={{ user, token, isLoggedIn, isAdmin, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
