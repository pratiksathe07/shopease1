// src/pages/HomePage.jsx
import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import Loader from '../components/Loader'
import { getProducts } from '../services/productService'

const CATEGORIES = ['Electronics', 'Fashion', 'Home', 'Sports', 'Beauty', 'Books', 'Toys']

export default function HomePage() {
  const [featured, setFeatured] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    getProducts({ limit: 8, sort: '-createdAt' })
      .then(res => setFeatured(res.data?.data?.products || []))
      .catch(() => { })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      {/* ── Hero ── */}
      {/* <section style={{ background: 'linear-gradient(135deg,#667eea,#764ba2)', color: '#fff', padding: '70px 20px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.8rem', fontWeight: 700, marginBottom: 14 }}>
          Welcome to <i>ShopEase</i>
        </h1>
        <p style={{ fontSize: '1.15rem', opacity: 0.9, marginBottom: 32 }}>
          Shop Smart, Shop Easy, Shop Online.
        </p>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => navigate('/products')} className="btn"
            style={{ background: '#fff', color: '#667eea', fontWeight: 700, fontSize: '1rem', padding: '13px 32px', borderRadius: 30, boxShadow: '0 6px 20px rgba(0,0,0,0.15)' }}>
            🛍️ Shop Now
          </button>
          <button onClick={() => navigate('/products?category=Electronics')} className="btn"
            style={{ background: 'rgba(255,255,255,0.18)', color: '#fff', border: '2px solid rgba(255,255,255,0.6)', fontWeight: 600, fontSize: '1rem', padding: '13px 32px', borderRadius: 30 }}>
            ⚡ Best Deals
          </button>
        </div>
      </section> */}

      {/* ── Stats bar ── */}
      {/* <section style={{ background: '#fff', padding: '22px 20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'center', gap: 50, flexWrap: 'wrap' }}>
          {[['🛍️', '10,000+', 'Products'], ['👥', '50,000+', 'Happy Customers'], ['⚡', 'Free', 'Delivery'], ['🔒', 'Secure', 'Payments']].map(([icon, val, label]) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem' }}>{icon}</div>
              <div style={{ fontWeight: 700, fontSize: '1.2rem', color: '#667eea' }}>{val}</div>
              <div style={{ fontSize: '0.82rem', color: '#888' }}>{label}</div>
            </div>
          ))}
        </div>
      </section> */}

      {/* ── Categories ── */}
      <section style={{ padding: '50px 20px' }}>
        <div className="container">
          {/* <h2 style={{ textAlign: 'center', fontSize: '1.8rem', marginBottom: 8 }}>Shop by Category</h2>
          <p style={{ textAlign: 'center', color: '#888', marginBottom: 36 }}>Find exactly what you're looking for</p> */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 16 }}>
            {CATEGORIES.map((cat, i) => {
              const icons = { Electronics: '📱', Fashion: '👗', Home: '🏠', Sports: '⚽', Beauty: '💄', Books: '📚', Toys: '🧸' }
              const colors = ['#e3f2fd', '#fce4ec', '#f3e5f5', '#e8f5e9', '#fff3e0', '#e0f7fa', '#fff8e1']
              return (
                <button key={cat} onClick={() => navigate(`/products?category=${cat}`)}
                  style={{ padding: '22px 12px', background: colors[i], borderRadius: 14, border: 'none', cursor: 'pointer', textAlign: 'center', transition: 'transform 0.2s, box-shadow 0.2s', fontFamily: 'inherit' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.12)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}>
                  <div style={{ fontSize: '2rem', marginBottom: 8 }}>{icons[cat]}</div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#333' }}>{cat}</div>
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Featured Products ── */}
      <section style={{ padding: '20px 20px 60px', background: '#f9f9ff' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
            {/* <div>
              <h2 style={{ fontSize: '1.8rem' }}>Featured Products</h2>
              <p style={{ color: '#888', marginTop: 4 }}>Handpicked just for you</p>
            </div> */}
            <button onClick={() => navigate('/products')} className="btn btn-outline btn-sm">View All →</button>
          </div>
          {loading ? <Loader text="Loading products..." /> : (
            featured.length === 0 ? (
              <div className="empty-state">
                <div className="icon">📦</div>
                <h3>No products yet</h3>
                <p>Run the seed script to populate products</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(230px,1fr))', gap: 20 }}>
                {featured.map(p => <ProductCard key={p._id} product={p} />)}
              </div>
            )
          )}
        </div>
      </section>

      {/* ── Promo Banner ── */}
      <section style={{ padding: '60px 20px', background: 'linear-gradient(135deg,#1a1a2e,#16213e)' }}>
        <div className="container" style={{ textAlign: 'center', color: '#fff' }}>
          <h2 style={{ fontSize: '2rem', marginBottom: 12 }}>🎉 Special Offer</h2>
          <p style={{ fontSize: '1.1rem', opacity: 0.85, marginBottom: 28 }}>Get free delivery on orders above ₹499. Limited time offer!</p>
          <button onClick={() => navigate('/products')} className="btn"
            style={{ background: 'linear-gradient(135deg,#667eea,#764ba2)', color: '#fff', fontSize: '1rem', padding: '14px 36px', borderRadius: 30, boxShadow: '0 6px 20px rgba(102,126,234,0.4)' }}>
            Grab the Deal
          </button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ background: '#0f172a', color: '#94a3b8', padding: '40px 20px', textAlign: 'center' }}>
        <div style={{ fontSize: '1.4rem', fontWeight: 700, background: 'linear-gradient(135deg,#667eea,#764ba2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 10 }}>ShopEase</div>
        <p style={{ fontSize: '0.85rem' }}>© 2024 ShopEase. All rights reserved. | Shop Smart, Shop Easy, Shop Online.</p>
      </footer>
    </div>
  )
}
