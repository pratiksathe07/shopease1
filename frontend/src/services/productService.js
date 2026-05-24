// src/services/productService.js
import api from '../api/axios'

export const getProducts    = (params)       => api.get('/products', { params })
export const getProductById = (id)           => api.get(`/products/${id}`)
export const getCategories  = ()             => api.get('/products/categories')
export const deleteProduct  = (id)           => api.delete(`/products/${id}`)

// createProduct / updateProduct accept either a plain object (JSON)
// or a FormData instance (multipart — for file uploads).
// We auto-detect and set the correct Content-Type header.
export const createProduct = (data) => {
  const isForm = data instanceof FormData
  return api.post('/products', data, {
    headers: isForm ? { 'Content-Type': 'multipart/form-data' } : {},
  })
}

export const updateProduct = (id, data) => {
  const isForm = data instanceof FormData
  return api.put(`/products/${id}`, data, {
    headers: isForm ? { 'Content-Type': 'multipart/form-data' } : {},
  })
}
