// src/pages/WishlistPage.jsx
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useToast } from '../components/Toast'

const fmt = (n) => '₹' + Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2 })

export default function WishlistPage() {
  const { wishlist, toggleWishlist, addToCart } = useCart()
  const navigate = useNavigate()
  const toast    = useToast()

  if (wishlist.length === 0) return (
    <div>
      <div className="page-header"><h1>❤️ My Wishlist</h1></div>
      <div className="empty-state">
        <div className="icon">💔</div>
        <h3>Your wishlist is empty</h3>
        <p>Save products you love by clicking the ❤️ icon</p>
        <button className="btn btn-primary" onClick={() => navigate('/products')} style={{ marginTop: 20 }}>Explore Products</button>
      </div>
    </div>
  )

  return (
    <div style={{ paddingBottom: 60 }}>
      <div className="page-header"><h1>❤️ My Wishlist</h1><p>{wishlist.length} saved item{wishlist.length !== 1 ? 's' : ''}</p></div>
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 20 }}>
          {wishlist.map(p => (
            <div key={p._id} style={{ background: '#fff', borderRadius: 14, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
              <div style={{ position: 'relative' }}>
                <img src={p.images?.[0] || ''} alt={p.name} onClick={() => navigate(`/products/${p._id}`)}
                  style={{ width: '100%', height: 180, objectFit: 'cover', background: '#f0f0f0', cursor: 'pointer', display: 'block' }}
                  onError={e => e.target.style.background = '#e0e7ff'} />
                <button onClick={() => { toggleWishlist(p); toast.info('Removed from wishlist') }}
                  style={{ position: 'absolute', top: 10, right: 10, width: 36, height: 36, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.95)', cursor: 'pointer', fontSize: '1.1rem' }}>
                  ❤️
                </button>
              </div>
              <div style={{ padding: 16 }}>
                <div style={{ fontSize: '0.75rem', color: '#999', textTransform: 'uppercase', letterSpacing: 1 }}>{p.category}</div>
                <div style={{ fontWeight: 600, margin: '5px 0', lineHeight: 1.3, cursor: 'pointer' }} onClick={() => navigate(`/products/${p._id}`)}>{p.name}</div>
                <div style={{ color: '#667eea', fontWeight: 700, fontSize: '1.15rem', margin: '8px 0' }}>{fmt(p.price)}</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-primary btn-sm" style={{ flex: 1, justifyContent: 'center', borderRadius: 8 }}
                    onClick={() => { addToCart(p); toast.success('Added to cart 🛒') }}
                    disabled={p.stock === 0}>
                    🛒 Add to Cart
                  </button>
                  <button onClick={() => navigate(`/products/${p._id}`)} style={{ padding: '6px 12px', border: '1px solid #ddd', borderRadius: 8, background: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.82rem' }}>
                    View
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
