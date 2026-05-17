// src/pages/ProductsPage.jsx
import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import Loader from '../components/Loader'
import { getProducts } from '../services/productService'

const CATEGORIES = ['All', 'Electronics', 'Fashion', 'Home', 'Sports', 'Beauty', 'Books', 'Toys']
const SORTS = [
  { value: '-createdAt', label: 'Newest First'        },
  { value: 'price',      label: 'Price: Low → High'   },
  { value: '-price',     label: 'Price: High → Low'   },
  { value: '-rating',    label: 'Top Rated'           },
  { value: 'name',       label: 'Name A–Z'            },
]

// Debounce hook
function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

export default function ProductsPage() {
  const [urlParams, setUrlParams] = useSearchParams()
  const navigate = useNavigate()

  // Read URL params
  const category   = urlParams.get('category') || 'All'
  const urlSearch  = urlParams.get('search')   || ''
  const sort       = urlParams.get('sort')     || '-createdAt'
  const page       = parseInt(urlParams.get('page') || '1')

  // Local search input — updates URL with debounce
  const [localSearch, setLocalSearch] = useState(urlSearch)
  const debouncedSearch = useDebounce(localSearch, 350)
  const inputRef = useRef(null)

  const [products,   setProducts]   = useState([])
  const [loading,    setLoading]    = useState(true)
  const [searching,  setSearching]  = useState(false)
  const [pagination, setPagination] = useState({})

  // Sync localSearch when URL changes (e.g. from header)
  useEffect(() => {
    setLocalSearch(urlSearch)
  }, [urlSearch])

  // Push debounced search to URL
  useEffect(() => {
    const next = new URLSearchParams(urlParams)
    if (debouncedSearch.trim()) next.set('search', debouncedSearch.trim())
    else next.delete('search')
    next.set('page', '1')
    setUrlParams(next, { replace: true })
  }, [debouncedSearch])

  // Fetch products when URL params change
  useEffect(() => {
    setLoading(true)
    setSearching(!!urlSearch)
    const q = { sort, page, limit: 12 }
    if (urlSearch)       q.search   = urlSearch
    if (category !== 'All') q.category = category

    getProducts(q)
      .then(res => {
        setProducts(res.data?.data?.products || [])
        setPagination(res.data?.data?.pagination || {})
      })
      .catch(() => setProducts([]))
      .finally(() => { setLoading(false); setSearching(false) })
  }, [category, urlSearch, sort, page])

  function setQ(key, val) {
    const next = new URLSearchParams(urlParams)
    next.set(key, val)
    if (key !== 'page') next.set('page', '1')
    setUrlParams(next)
  }

  function clearSearch() {
    setLocalSearch('')
    const next = new URLSearchParams(urlParams)
    next.delete('search')
    next.set('page', '1')
    setUrlParams(next)
    inputRef.current?.focus()
  }

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <h1>🛍️ {category !== 'All' ? category : urlSearch ? `Results for "${urlSearch}"` : 'All Products'}</h1>
        {urlSearch && (
          <p>Showing live results for <strong>"{urlSearch}"</strong></p>
        )}
      </div>

      <div className="container" style={{ paddingBottom: 60 }}>

        {/* ── Smart Search Bar (inline, inside products page) ── */}
        <div style={{
          background: '#fff', borderRadius: 14, padding: '18px 20px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: 24,
          display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap',
        }}>
          <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
            {/* <input
              ref={inputRef}
              value={localSearch}
              onChange={e => setLocalSearch(e.target.value)}
              placeholder="Type to search products instantly..."
              style={{
                width: '100%', padding: '10px 44px 10px 16px',
                border: '2px solid', borderRadius: 25, fontSize: '0.93rem',
                outline: 'none', fontFamily: 'inherit',
                borderColor: localSearch ? '#667eea' : '#eee',
                background: localSearch ? '#f8f8ff' : '#fafafa',
                transition: 'all 0.2s',
              }}
            /> */}
            {/* Live indicator dot */}
            {localSearch && (
              <div style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', gap: 6 }}>
                {searching
                  ? <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f39c12', animation: 'pulse 0.8s infinite' }} />
                  : <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#2ecc71' }} />
                }
              </div>
            )}
            {localSearch && (
              <button onClick={clearSearch} style={{
                position: 'absolute', right: 30, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', fontSize: '0.95rem', lineHeight: 1,
              }}>✕</button>
            )}
          </div>

          {/* Sort dropdown */}
          {/* <select value={sort} onChange={e => setQ('sort', e.target.value)}
            style={{ padding: '10px 14px', border: '1px solid #ddd', borderRadius: 8, fontSize: '0.87rem', background: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}>
            {SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select> */}
        </div>

        {/* ── Category Pills ── */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setQ('category', cat)}
              style={{
                padding: '7px 16px', borderRadius: 20, border: '2px solid',
                cursor: 'pointer', fontWeight: 500, fontSize: '0.85rem',
                transition: 'all 0.18s', fontFamily: 'inherit',
                borderColor: category === cat ? '#667eea' : '#ddd',
                background:  category === cat ? '#667eea' : '#fff',
                color:       category === cat ? '#fff'    : '#333',
              }}>
              {cat}
            </button>
          ))}
        </div>

        {/* Result count */}
        {!loading && (
          <p style={{ color: '#888', fontSize: '0.87rem', marginBottom: 18 }}>
            {pagination.total || 0} product{pagination.total !== 1 ? 's' : ''} found
            {urlSearch && <span style={{ color: '#667eea', fontWeight: 500 }}> for "{urlSearch}"</span>}
          </p>
        )}

        {/* ── Product Grid ── */}
        {loading ? (
          <Loader text={urlSearch ? `Searching for "${urlSearch}"...` : 'Loading products...'} />
        ) : products.length === 0 ? (
          <div className="empty-state">
            <div className="icon">🔍</div>
            <h3>No products found</h3>
            <p>
              {urlSearch
                ? `No results for "${urlSearch}". Try a different keyword.`
                : 'Try a different category.'}
            </p>
            <button className="btn btn-outline" onClick={clearSearch} style={{ marginTop: 16 }}>Clear Search</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(230px,1fr))', gap: 20 }}>
            {products.map(p => <ProductCard key={p._id} product={p} />)}
          </div>
        )}

        {/* ── Pagination ── */}
        {pagination.pages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 40, flexWrap: 'wrap' }}>
            <button onClick={() => setQ('page', page - 1)} disabled={page <= 1}
              className="btn btn-outline btn-sm">← Prev</button>
            {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setQ('page', p)}
                className="btn btn-sm"
                style={{ background: p === page ? '#667eea' : '#fff', color: p === page ? '#fff' : '#333', border: '1px solid #ddd' }}>
                {p}
              </button>
            ))}
            <button onClick={() => setQ('page', page + 1)} disabled={page >= pagination.pages}
              className="btn btn-outline btn-sm">Next →</button>
          </div>
        )}
      </div>

      {/* Pulse animation for live search dot */}
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>
    </div>
  )
}
