// src/components/ProductCard.jsx
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useToast } from './Toast'

const fmt = (n) => '₹' + Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2 })
const stars = (n) => '★'.repeat(Math.round(n || 0)) + '☆'.repeat(5 - Math.round(n || 0))

export default function ProductCard({ product }) {
  const navigate = useNavigate()
  const { addToCart, toggleWishlist, inWishlist, inCart } = useCart()
  const toast = useToast()

  const img    = product.images?.[0] || 'https://images.unsplash.com/photo-1560472355-536de3962603?w=400&q=80'
  const wished = inWishlist(product._id)
  const carted = inCart(product._id)

  function handleAddCart(e) {
    e.stopPropagation()
    addToCart(product)
    toast.success('Added to cart 🛒')
  }

  function handleWish(e) {
    e.stopPropagation()
    toggleWishlist(product)
    toast.info(wished ? 'Removed from wishlist' : '❤️ Added to wishlist')
  }

  return (
    <div
      style={{
        background: '#fff', borderRadius: 14, overflow: 'hidden',
        boxShadow: '0 2px 12px rgba(0,0,0,0.07)', transition: 'transform 0.2s, box-shadow 0.2s',
        cursor: 'pointer', position: 'relative',
      }}
      onClick={() => navigate(`/products/${product._id}`)}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(102,126,234,0.18)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.07)' }}
    >
      {/* Wishlist button */}
      <button
        onClick={handleWish}
        style={{
          position: 'absolute', top: 10, right: 10, zIndex: 1,
          width: 36, height: 36, borderRadius: '50%', border: 'none',
          background: 'rgba(255,255,255,0.95)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
          fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'transform 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.15)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'none'}
        title={wished ? 'Remove from wishlist' : 'Add to wishlist'}
      >
        {wished ? '❤️' : '🤍'}
      </button>

      {/* Product image */}
      <img
        src={img} alt={product.name}
        style={{ width: '100%', height: 180, objectFit: 'cover', background: '#f0f0f0', display: 'block' }}
        onError={e => { e.target.src = 'https://images.unsplash.com/photo-1560472355-536de3962603?w=400&q=80' }}
      />

      {/* Info */}
      <div style={{ padding: '14px 15px' }}>
        <div style={{ fontSize: '0.72rem', color: '#999', textTransform: 'uppercase', letterSpacing: 1 }}>
          {product.category}
        </div>
        <div style={{ fontWeight: 600, margin: '5px 0', fontSize: '0.97rem', lineHeight: 1.3 }}>
          {product.name}
        </div>
        <div style={{ color: '#f1c40f', fontSize: '0.85rem', letterSpacing: 2 }}>
          {stars(product.rating?.average)}
          <span style={{ color: '#999', marginLeft: 4 }}>({product.rating?.count || 0})</span>
        </div>
        <div style={{ fontSize: '1.2rem', color: 'var(--primary)', fontWeight: 700, margin: '8px 0' }}>
          {fmt(product.price)}
        </div>
        {product.stock === 0 && (
          <div style={{ color: 'var(--danger)', fontSize: '0.8rem', marginBottom: 6, fontWeight: 500 }}>Out of stock</div>
        )}
      </div>

      {/* Actions */}
      <div style={{ padding: '0 15px 15px', display: 'flex', gap: 8 }}>
        <button
          className="btn btn-primary btn-sm"
          style={{ flex: 1, justifyContent: 'center', borderRadius: 8 }}
          onClick={handleAddCart}
          disabled={product.stock === 0}
        >
          {carted ? '✓ In Cart' : '🛒 Add'}
        </button>
        <button
          className="btn btn-sm"
          style={{ flex: 1, justifyContent: 'center', background: '#ff9800', color: '#fff', borderRadius: 8 }}
          onClick={(e) => { e.stopPropagation(); addToCart(product); navigate('/checkout') }}
          disabled={product.stock === 0}
        >
          ⚡ Buy
        </button>
      </div>
    </div>
  )
}
