// src/context/CartContext.jsx
import { createContext, useContext, useState, useCallback } from 'react'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const [cart,     setCart]     = useState([])   // { product, qty }
  const [wishlist, setWishlist] = useState([])   // product objects

  // ── Cart helpers ───────────────────────────
  const addToCart = useCallback((product, qty = 1) => {
    setCart(prev => {
      const found = prev.find(i => i.product._id === product._id)
      if (found) return prev.map(i => i.product._id === product._id ? { ...i, qty: i.qty + qty } : i)
      return [...prev, { product, qty }]
    })
  }, [])

  const removeFromCart = useCallback((productId) => {
    setCart(prev => prev.filter(i => i.product._id !== productId))
  }, [])

  const changeQty = useCallback((productId, delta) => {
    setCart(prev => prev
      .map(i => i.product._id === productId ? { ...i, qty: i.qty + delta } : i)
      .filter(i => i.qty > 0)
    )
  }, [])

  const clearCart = useCallback(() => setCart([]), [])

  const cartTotal   = cart.reduce((s, i) => s + i.product.price * i.qty, 0)
  const cartCount   = cart.reduce((s, i) => s + i.qty, 0)

  // ── Wishlist helpers ───────────────────────
  const toggleWishlist = useCallback((product) => {
    setWishlist(prev =>
      prev.some(p => p._id === product._id)
        ? prev.filter(p => p._id !== product._id)
        : [...prev, product]
    )
  }, [])

  const inWishlist = (productId) => wishlist.some(p => p._id === productId)
  const inCart     = (productId) => cart.some(i => i.product._id === productId)

  return (
    <CartContext.Provider value={{
      cart, wishlist, cartTotal, cartCount,
      addToCart, removeFromCart, changeQty, clearCart,
      toggleWishlist, inWishlist, inCart,
    }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => useContext(CartContext)
