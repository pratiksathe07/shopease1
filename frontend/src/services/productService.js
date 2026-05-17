// src/services/productService.js
import api from '../api/axios'

export const getProducts   = (params) => api.get('/products', { params })
export const getProductById = (id)    => api.get(`/products/${id}`)
export const getCategories  = ()      => api.get('/products/categories')
export const createProduct  = (data)  => api.post('/products', data)
export const updateProduct  = (id, data) => api.put(`/products/${id}`, data)
export const deleteProduct  = (id)    => api.delete(`/products/${id}`)
