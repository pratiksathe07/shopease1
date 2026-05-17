// src/components/Header.jsx
import { useState, useRef, useCallback } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useToast } from './Toast'

// Debounce helper
function useDebounce(fn, delay) {
  const timer = useRef(null)
  return useCallback((...args) => {
    clearTimeout(timer.current)
    timer.current = setTimeout(() => fn(...args), delay)
  }, [fn, delay])
}

export default function Header() {
  const { user, isLoggedIn, isAdmin, logout } = useAuth()
  const { cartCount, wishlist }               = useCart()
  const [menuOpen, setMenuOpen] = useState(false)
  const [search,   setSearch]   = useState('')
  const navigate = useNavigate()
  const toast    = useToast()

  // Debounced navigation — fires 350ms after user stops typing
  const debouncedSearch = useDebounce((val) => {
    if (val.trim()) navigate(`/products?search=${encodeURIComponent(val.trim())}&page=1`)
    else            navigate('/products')
  }, 350)

  function handleSearchChange(e) {
    const val = e.target.value
    setSearch(val)
    debouncedSearch(val)
  }

  function handleSearchSubmit(e) {
    e.preventDefault()
    if (search.trim()) navigate(`/products?search=${encodeURIComponent(search.trim())}&page=1`)
  }

  function handleLogout() {
    logout()
    toast.success('Logged out successfully')
    navigate('/login')
  }

  return (
    <header style={{
      background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      position: 'sticky', top: 0, zIndex: 100,
    }}>
      <div className="container" style={{
        display: 'flex', alignItems: 'center', gap: 16,
        padding: '12px 20px', flexWrap: 'wrap',
      }}>
        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', flexShrink: 0 }}>
          <img src="/logo.png" alt="ShopEase"
            style={{ height: 38, width: 38, objectFit: 'contain', borderRadius: 6 }}
            onError={e => e.target.style.display = 'none'} />
          <span style={{
            fontSize: '1.55rem', fontWeight: 700,
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>ShopEase</span>
        </Link>

        {/* Smart Search — live search with debounce */}
        <form onSubmit={handleSearchSubmit} style={{
          flex: 1, minWidth: 180, maxWidth: 480,
          display: 'flex', border: '2px solid #eee', borderRadius: 25,
          overflow: 'hidden', transition: 'border-color 0.2s',
        }}
          onFocusCapture={e => e.currentTarget.style.borderColor = '#667eea'}
          onBlurCapture={e => e.currentTarget.style.borderColor = '#eee'}>
          <input
            value={search}
            onChange={handleSearchChange}
            placeholder="Search products..."
            style={{ flex: 1, padding: '9px 16px', border: 'none', outline: 'none', fontSize: '0.93rem', background: 'transparent' }}
          />
          {search && (
            <button type="button" onClick={() => { setSearch(''); navigate('/products') }}
              style={{ padding: '0 10px', background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: '1rem' }}>✕</button>
          )}
          <button type="submit"
            style={{ padding: '0 18px', background: '#667eea', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
            🔍
          </button>
        </form>

        {/* Nav actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 'auto' }}>
          {/* Wishlist */}
          <Link to="/wishlist" style={{ position: 'relative', padding: '8px 12px', background: '#f5f5f5', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 4, color: '#333', fontWeight: 500, fontSize: '0.9rem', textDecoration: 'none' }}>
            ❤️ <span style={{ fontSize: '0.85rem' }}>Wish</span>
            {wishlist.length > 0 && (
              <span className="badge" style={{ position: 'absolute', top: -4, right: -4 }}>{wishlist.length}</span>
            )}
          </Link>

          {/* Cart */}
          <Link to="/cart" style={{ position: 'relative', padding: '8px 14px', background: '#667eea', color: '#fff', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, fontSize: '0.9rem', textDecoration: 'none' }}>
            🛒 Cart
            {cartCount > 0 && (
              <span className="badge" style={{ position: 'absolute', top: -4, right: -4 }}>{cartCount}</span>
            )}
          </Link>

          {/* Account dropdown */}
          {isLoggedIn ? (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setMenuOpen(v => !v)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: '#f5f5f5', border: '1px solid #ddd', borderRadius: 20, fontWeight: 500, fontSize: '0.9rem', cursor: 'pointer', fontFamily: 'inherit' }}>
                👤 {user?.name?.split(' ')[0]} ▾
              </button>

              {menuOpen && (
                <div style={{ position: 'absolute', right: 0, top: '110%', minWidth: 200, background: '#fff', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.15)', overflow: 'hidden', zIndex: 200 }}
                  onClick={() => setMenuOpen(false)}>
                  <div style={{ padding: '12px 16px', background: 'linear-gradient(135deg,#667eea,#764ba2)', color: '#fff' }}>
                    <strong style={{ display: 'block', fontSize: '0.93rem' }}>{user?.name}</strong>
                    <span style={{ fontSize: '0.78rem', opacity: 0.9 }}>{user?.email}</span>
                  </div>
                  {[
                    { to: '/profile',  icon: '👤', label: 'My Profile' },
                    { to: '/orders',   icon: '📦', label: 'My Orders'  },
                    { to: '/wishlist', icon: '❤️', label: 'Wishlist'   },
                    ...(isAdmin ? [{ to: '/admin', icon: '⚙️', label: 'Admin Dashboard' }] : []),
                  ].map(item => (
                    <Link key={item.to} to={item.to}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', color: '#333', fontSize: '0.9rem', borderTop: '1px solid #f0f0f0', textDecoration: 'none' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f8f8ff'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      {item.icon} {item.label}
                    </Link>
                  ))}
                  <button onClick={handleLogout}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', color: '#e74c3c', fontSize: '0.9rem', borderTop: '1px solid #f0f0f0', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                    🚪 Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="btn btn-primary btn-sm">Sign In</Link>
          )}
        </div>
      </div>

      {menuOpen && <div onClick={() => setMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 99 }} />}
    </header>
  )
}
