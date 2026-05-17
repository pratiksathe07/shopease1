// src/services/orderService.js
import api from '../api/axios'

export const placeOrder       = (data)  => api.post('/orders', data)
export const getMyOrders       = ()      => api.get('/orders/my')
export const getOrderById      = (id)    => api.get(`/orders/${id}`)
export const cancelOrder       = (id)    => api.put(`/orders/${id}/cancel`)
export const getAllOrders       = (params)=> api.get('/orders', { params })
export const updateOrderStatus = (id, data) => api.put(`/orders/${id}/status`, data)
