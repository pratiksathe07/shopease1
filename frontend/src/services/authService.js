// src/services/authService.js
import api from '../api/axios'

export const getMe          = ()     => api.get('/auth/me')
export const updateProfile  = (data) => api.put('/auth/me', data)
export const changePassword = (data) => api.put('/auth/change-password', data)
export const getAllUsers     = (params) => api.get('/auth/admin/users', { params })
export const updateUserRole = (id, role) => api.put(`/auth/admin/users/${id}/role`, { role })
export const deleteUser     = (id)   => api.delete(`/auth/admin/users/${id}`)
export const getAdminStats  = ()     => api.get('/auth/admin/stats')
