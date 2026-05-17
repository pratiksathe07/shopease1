// src/pages/CartPage.jsx
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useToast } from '../components/Toast'

const fmt = (n) => '₹' + Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2 })

export default function CartPage() {
  const { cart, cartTotal, removeFromCart, changeQty, clearCart } = useCart()
  const navigate = useNavigate()
  const toast    = useToast()

  const gst      = +(cartTotal * 0.03).toFixed(2)
  const grandTotal = +(cartTotal + gst).toFixed(2)

  if (cart.length === 0) return (
    <div>
      <div className="page-header"><h1>🛒 Your Cart</h1></div>
      <div className="empty-state">
        <div className="icon">🛒</div>
        <h3>Your cart is empty</h3>
        <p>Add some products to get started</p>
        <button className="btn btn-primary" onClick={() => navigate('/products')} style={{ marginTop: 20 }}>Browse Products</button>
      </div>
    </div>
  )

  return (
    <div style={{ paddingBottom: 60 }}>
      <div className="page-header"><h1>🛒 Your Cart</h1><p>{cart.reduce((s, i) => s + i.qty, 0)} items</p></div>
      <div className="container" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 28, alignItems: 'start' }}>

        {/* Cart items */}
        <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          <div style={{ padding: '18px 24px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '1.1rem' }}>Cart Items</h2>
            <button onClick={() => { clearCart(); toast.info('Cart cleared') }} style={{ color: '#e74c3c', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.88rem', fontFamily: 'inherit' }}>🗑 Clear All</button>
          </div>
          {cart.map(({ product: p, qty }) => (
            <div key={p._id} style={{ display: 'flex', gap: 16, padding: '18px 24px', borderBottom: '1px solid #f5f5f5', alignItems: 'center' }}>
              <img src={p.images?.[0] || ''} alt={p.name} onClick={() => navigate(`/products/${p._id}`)}
                style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 10, background: '#f0f0f0', cursor: 'pointer', flexShrink: 0 }}
                onError={e => e.target.style.background = '#e0e7ff'} />
              <div style={{ flex: 1 }}>
                <div onClick={() => navigate(`/products/${p._id}`)} style={{ fontWeight: 600, cursor: 'pointer', marginBottom: 4 }}>{p.name}</div>
                <div style={{ color: '#999', fontSize: '0.82rem', marginBottom: 8 }}>{p.category}</div>
                <div style={{ color: '#667eea', fontWeight: 700, fontSize: '1.1rem' }}>{fmt(p.price)}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button onClick={() => changeQty(p._id, -1)} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #ddd', background: '#fff', cursor: 'pointer', fontSize: '1rem' }}>−</button>
                <span style={{ fontWeight: 600, minWidth: 28, textAlign: 'center' }}>{qty}</span>
                <button onClick={() => changeQty(p._id, 1)} disabled={qty >= (p.stock || 99)} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #ddd', background: '#fff', cursor: 'pointer', fontSize: '1rem' }}>+</button>
              </div>
              <div style={{ minWidth: 90, textAlign: 'right' }}>
                <div style={{ fontWeight: 700, color: '#333' }}>{fmt(p.price * qty)}</div>
                <button onClick={() => { removeFromCart(p._id); toast.info('Item removed') }}
                  style={{ color: '#e74c3c', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.82rem', fontFamily: 'inherit', marginTop: 6 }}>Remove</button>
              </div>
            </div>
          ))}
        </div>

        {/* Order summary */}
        <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', padding: 24, position: 'sticky', top: 80 }}>
          <h2 style={{ fontSize: '1.1rem', marginBottom: 20 }}>Order Summary</h2>
          {[
            ['Subtotal', fmt(cartTotal)],
            ['Delivery', 'FREE 🎉'],
            ['GST (3%)', fmt(gst)],
          ].map(([label, val]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: '0.93rem' }}>
              <span style={{ color: '#666' }}>{label}</span>
              <span style={{ color: val === 'FREE 🎉' ? '#2ecc71' : '#333', fontWeight: val === 'FREE 🎉' ? 600 : 400 }}>{val}</span>
            </div>
          ))}
          <div style={{ borderTop: '2px solid #667eea', marginTop: 16, paddingTop: 16, display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.15rem' }}>
            <span>Total</span><span style={{ color: '#667eea' }}>{fmt(grandTotal)}</span>
          </div>
          <button className="btn btn-primary" onClick={() => navigate('/checkout')} style={{ width: '100%', justifyContent: 'center', marginTop: 20, padding: '13px', fontSize: '1rem' }}>
            Proceed to Checkout →
          </button>
          <button onClick={() => navigate('/products')} style={{ width: '100%', marginTop: 10, padding: '10px', background: 'none', border: '1px solid #ddd', borderRadius: 25, cursor: 'pointer', fontFamily: 'inherit', color: '#666' }}>
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  )
}
