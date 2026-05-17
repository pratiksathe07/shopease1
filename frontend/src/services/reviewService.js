// src/services/reviewService.js
import api from '../api/axios'

export const getReviews   = (productId) => api.get('/reviews', { params: { productId } })
export const canReview    = (productId) => api.get('/reviews/can-review', { params: { productId } })
export const addReview    = (data)       => api.post('/reviews', data)
export const updateReview = (id, data)   => api.put(`/reviews/${id}`, data)
export const deleteReview = (id)         => api.delete(`/reviews/${id}`)
