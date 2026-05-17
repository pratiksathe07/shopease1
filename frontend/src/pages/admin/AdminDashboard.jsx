// src/pages/admin/AdminDashboard.jsx
import { useState, useEffect, useMemo } from 'react'
import { useToast } from '../../components/Toast'
import Loader from '../../components/Loader'
import { getAdminStats, getAllUsers, deleteUser, updateUserRole } from '../../services/authService'
import { getAllOrders, updateOrderStatus } from '../../services/orderService'
import { getProducts, deleteProduct, createProduct, updateProduct } from '../../services/productService'

const fmt = (n) => '₹' + Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2 })
const STATUS_OPTS = ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled']

// ─── Modal Overlay ────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }} onClick={onClose}>
      <div style={{
        background: '#fff', borderRadius: 16, padding: 28, width: '100%', maxWidth: 560,
        maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#1a1a2e' }}>{title}</h2>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#888', lineHeight: 1,
          }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

// ─── Search Bar ───────────────────────────────────────────────
function SearchBar({ value, onChange, placeholder }) {
  return (
    <div style={{ position: 'relative', marginBottom: 18 }}>
      <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: '1rem', pointerEvents: 'none', color: '#999' }}>🔍</span>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%', boxSizing: 'border-box', padding: '10px 14px 10px 38px',
          border: '1.5px solid #e0e0f0', borderRadius: 10, fontSize: '0.88rem',
          fontFamily: 'inherit', outline: 'none', background: '#f9f9ff',
          transition: 'border-color 0.2s',
        }}
        onFocus={e => e.target.style.borderColor = '#667eea'}
        onBlur={e => e.target.style.borderColor = '#e0e0f0'}
      />
    </div>
  )
}

// ─── Form Field ───────────────────────────────────────────────
function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontWeight: 600, fontSize: '0.82rem', color: '#555', marginBottom: 5 }}>{label}</label>
      {children}
    </div>
  )
}

const inputStyle = {
  width: '100%', boxSizing: 'border-box', padding: '9px 12px',
  border: '1.5px solid #e0e0f0', borderRadius: 8, fontSize: '0.88rem',
  fontFamily: 'inherit', outline: 'none',
}

// ─── Add Product Form ─────────────────────────────────────────
function AddProductModal({ onClose, onAdded }) {
  const toast = useToast()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '', description: '', category: '', brand: '',
    price: '', stock: '', images: '',
    ratingAverage: '', ratingCount: '',
  })

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim() || !form.price) return toast.error('Name and Price are required')
    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        category: form.category.trim(),
        brand: form.brand.trim(),
        price: Number(form.price),
        stock: Number(form.stock) || 0,
        images: form.images
          ? form.images.split(',').map(u => u.trim()).filter(Boolean)
          : [],
        rating: {
          average: form.ratingAverage ? Number(form.ratingAverage) : 0,
          count:   form.ratingCount   ? Number(form.ratingCount)   : 0,
        },
      }
      await createProduct(payload)
      toast.success('Product added successfully! 🎉')
      onAdded()
      onClose()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to create product')
    }
    setSaving(false)
  }

  return (
    <Modal title="➕ Add New Product" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <Field label="Product Name *">
          <input style={inputStyle} value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Nike Air Max 90" required />
        </Field>
        <Field label="Description">
          <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 80 }} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Product description..." />
        </Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Category">
            <select style={inputStyle} value={form.category} onChange={e => set('category', e.target.value)} required>
              <option value="">— Select category —</option>
              {['Electronics','Fashion','Home','Sports','Beauty','Books','Toys','Other'].map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Field label="Brand">
            <input style={inputStyle} value={form.brand} onChange={e => set('brand', e.target.value)} placeholder="e.g. Nike" />
          </Field>
          <Field label="Price (₹) *">
            <input style={inputStyle} type="number" min="0" step="0.01" value={form.price} onChange={e => set('price', e.target.value)} placeholder="999.00" required />
          </Field>
          <Field label="Stock">
            <input style={inputStyle} type="number" min="0" value={form.stock} onChange={e => set('stock', e.target.value)} placeholder="100" />
          </Field>
        </div>
        <Field label="Image URLs (comma-separated)">
          <input style={inputStyle} value={form.images} onChange={e => set('images', e.target.value)} placeholder="https://..., https://..." />
        </Field>
        <div style={{ background: '#f8f8ff', borderRadius: 10, padding: '14px 16px', marginBottom: 14 }}>
          <div style={{ fontWeight: 600, fontSize: '0.82rem', color: '#555', marginBottom: 10 }}>⭐ Rating Object</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Average (0–5)">
              <input style={inputStyle} type="number" min="0" max="5" step="0.1" value={form.ratingAverage} onChange={e => set('ratingAverage', e.target.value)} placeholder="4.5" />
            </Field>
            <Field label="Count (reviews)">
              <input style={inputStyle} type="number" min="0" value={form.ratingCount} onChange={e => set('ratingCount', e.target.value)} placeholder="120" />
            </Field>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          <button type="button" onClick={onClose} style={{
            flex: 1, padding: '11px 0', borderRadius: 10, border: '1.5px solid #ddd',
            background: '#fff', color: '#555', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
          }}>Cancel</button>
          <button type="submit" disabled={saving} style={{
            flex: 2, padding: '11px 0', borderRadius: 10, border: 'none',
            background: saving ? '#aaa' : 'linear-gradient(135deg,#667eea,#764ba2)',
            color: '#fff', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontSize: '0.93rem',
          }}>
            {saving ? '⏳ Saving...' : '✅ Add Product'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ─── Edit Product Modal ───────────────────────────────────────
const CATEGORIES = ['Electronics','Fashion','Home','Sports','Beauty','Books','Toys','Other']

function EditProductModal({ product, onClose, onSaved }) {
  const toast = useToast()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name:          product.name          || '',
    description:   product.description   || '',
    category:      product.category      || '',
    brand:         product.brand         || '',
    price:         product.price         ?? '',
    stock:         product.stock         ?? '',
    images:        (product.images || []).join(', '),
    ratingAverage: product.rating?.average ?? '',
    ratingCount:   product.rating?.count   ?? '',
    isActive:      product.isActive !== false,
  })

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim() || form.price === '') return toast.error('Name and Price are required')
    setSaving(true)
    try {
      const payload = {
        name:        form.name.trim(),
        description: form.description.trim(),
        category:    form.category,
        brand:       form.brand.trim(),
        price:       Number(form.price),
        stock:       Number(form.stock) || 0,
        images:      form.images
          ? form.images.split(',').map(u => u.trim()).filter(Boolean)
          : [],
        rating: {
          average: form.ratingAverage !== '' ? Number(form.ratingAverage) : 0,
          count:   form.ratingCount   !== '' ? Number(form.ratingCount)   : 0,
        },
        isActive: form.isActive,
      }
      const res = await updateProduct(product._id, payload)
      toast.success('Product updated! ✅')
      onSaved(res.data?.data || { ...product, ...payload })
      onClose()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update product')
    }
    setSaving(false)
  }

  return (
    <Modal title="✏️ Edit Product" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <Field label="Product Name *">
          <input style={inputStyle} value={form.name} onChange={e => set('name', e.target.value)} required />
        </Field>
        <Field label="Description">
          <textarea style={{ ...inputStyle, resize: 'vertical', minHeight: 80 }} value={form.description} onChange={e => set('description', e.target.value)} />
        </Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Category">
            <select style={inputStyle} value={form.category} onChange={e => set('category', e.target.value)} required>
              <option value="">— Select —</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Brand">
            <input style={inputStyle} value={form.brand} onChange={e => set('brand', e.target.value)} placeholder="e.g. Nike" />
          </Field>
          <Field label="Price (₹) *">
            <input style={inputStyle} type="number" min="0" step="0.01" value={form.price} onChange={e => set('price', e.target.value)} required />
          </Field>
          <Field label="Stock">
            <input style={inputStyle} type="number" min="0" value={form.stock} onChange={e => set('stock', e.target.value)} />
          </Field>
        </div>
        <Field label="Image URLs (comma-separated)">
          <input style={inputStyle} value={form.images} onChange={e => set('images', e.target.value)} placeholder="https://..." />
        </Field>
        <div style={{ background: '#f8f8ff', borderRadius: 10, padding: '14px 16px', marginBottom: 14 }}>
          <div style={{ fontWeight: 600, fontSize: '0.82rem', color: '#555', marginBottom: 10 }}>⭐ Rating Object</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Average (0–5)">
              <input style={inputStyle} type="number" min="0" max="5" step="0.1" value={form.ratingAverage} onChange={e => set('ratingAverage', e.target.value)} />
            </Field>
            <Field label="Count (reviews)">
              <input style={inputStyle} type="number" min="0" value={form.ratingCount} onChange={e => set('ratingCount', e.target.value)} />
            </Field>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16,
          background: '#f8fff8', border: '1.5px solid #d4edda', borderRadius: 8, padding: '10px 14px' }}>
          <input type="checkbox" id="isActive" checked={form.isActive} onChange={e => set('isActive', e.target.checked)}
            style={{ width: 16, height: 16, cursor: 'pointer' }} />
          <label htmlFor="isActive" style={{ fontWeight: 600, fontSize: '0.85rem', color: '#333', cursor: 'pointer' }}>
            Product is Active (visible to customers)
          </label>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          <button type="button" onClick={onClose} style={{
            flex: 1, padding: '11px 0', borderRadius: 10, border: '1.5px solid #ddd',
            background: '#fff', color: '#555', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
          }}>Cancel</button>
          <button type="submit" disabled={saving} style={{
            flex: 2, padding: '11px 0', borderRadius: 10, border: 'none',
            background: saving ? '#aaa' : 'linear-gradient(135deg,#43b89c,#2ecc71)',
            color: '#fff', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontSize: '0.93rem',
          }}>
            {saving ? '⏳ Saving...' : '💾 Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ─── Main Component ───────────────────────────────────────────
export default function AdminDashboard() {
  const toast = useToast()
  const [tab, setTab]           = useState('stats')
  const [stats, setStats]       = useState(null)
  const [orders, setOrders]     = useState([])
  const [products, setProducts] = useState([])
  const [users, setUsers]       = useState([])
  const [loading, setLoading]   = useState(false)
  const [showAddProduct,  setShowAddProduct]  = useState(false)
  const [editingProduct,  setEditingProduct]  = useState(null)  // holds product object to edit

  // ── per-tab search strings
  const [orderSearch,   setOrderSearch]   = useState('')
  const [productSearch, setProductSearch] = useState('')
  const [userSearch,    setUserSearch]    = useState('')

  // ── Fetch helpers ──────────────────────────────────────────
  async function fetchStats() {
    setLoading(true)
    try { const r = await getAdminStats(); setStats(r.data.data) } catch {}
    setLoading(false)
  }
  async function fetchOrders() {
    setLoading(true)
    try { const r = await getAllOrders({ limit: 100 }); setOrders(r.data?.data?.orders || []) } catch {}
    setLoading(false)
  }
  async function fetchProducts() {
    setLoading(true)
    try { const r = await getProducts({ limit: 100, page: 1 }); setProducts(r.data?.data?.products || []) } catch {}
    setLoading(false)
  }
  async function fetchUsers() {
    setLoading(true)
    try { const r = await getAllUsers({ limit: 100 }); setUsers(r.data?.data?.users || []) } catch {}
    setLoading(false)
  }

  useEffect(() => {
    if (tab === 'stats')    fetchStats()
    if (tab === 'orders')   fetchOrders()
    if (tab === 'products') fetchProducts()
    if (tab === 'users')    fetchUsers()
  }, [tab])

  // ── Status / Role / Delete ─────────────────────────────────
  async function handleStatusChange(orderId, newStatus) {
    try {
      await updateOrderStatus(orderId, { orderStatus: newStatus })
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, orderStatus: newStatus } : o))
      toast.success('Order status updated')
    } catch { toast.error('Update failed') }
  }
  async function handleDeleteProduct(id) {
    if (!window.confirm('Delete this product?')) return
    try { await deleteProduct(id); setProducts(p => p.filter(x => x._id !== id)); toast.success('Product deleted') }
    catch { toast.error('Delete failed') }
  }

  function handleEditSaved(updated) {
    setProducts(prev => prev.map(p => p._id === updated._id ? { ...p, ...updated } : p))
  }
  async function handleDeleteUser(id) {
    if (!window.confirm('Delete this user?')) return
    try { await deleteUser(id); setUsers(u => u.filter(x => x._id !== id)); toast.success('User deleted') }
    catch { toast.error('Delete failed') }
  }
  async function handleRoleChange(id, role) {
    try { await updateUserRole(id, role); setUsers(u => u.map(x => x._id === id ? { ...x, role } : x)); toast.success('Role updated') }
    catch { toast.error('Update failed') }
  }

  // ── Client-side search/filter ──────────────────────────────
  const filteredOrders = useMemo(() => {
    const q = orderSearch.toLowerCase().trim()
    if (!q) return orders
    return orders.filter(o =>
      o._id.toLowerCase().includes(q) ||
      (o.userId?.name  || '').toLowerCase().includes(q) ||
      (o.userId?.email || '').toLowerCase().includes(q) ||
      (o.paymentMethod || '').toLowerCase().includes(q) ||
      (o.orderStatus   || '').toLowerCase().includes(q) ||
      String(o.totalAmount).includes(q)
    )
  }, [orders, orderSearch])

  const filteredProducts = useMemo(() => {
    const q = productSearch.toLowerCase().trim()
    if (!q) return products
    return products.filter(p =>
      (p.name     || '').toLowerCase().includes(q) ||
      (p.category || '').toLowerCase().includes(q) ||
      (p.brand    || '').toLowerCase().includes(q) ||
      String(p.price).includes(q) ||
      String(p.stock).includes(q) ||
      p._id.toLowerCase().includes(q)
    )
  }, [products, productSearch])

  const filteredUsers = useMemo(() => {
    const q = userSearch.toLowerCase().trim()
    if (!q) return users
    return users.filter(u =>
      (u.name   || '').toLowerCase().includes(q) ||
      (u.email  || '').toLowerCase().includes(q) ||
      (u.mobile || '').toLowerCase().includes(q) ||
      (u.role   || '').toLowerCase().includes(q) ||
      u._id.toLowerCase().includes(q)
    )
  }, [users, userSearch])

  // ── Tab config ──────────────────────────────────────────────
  const TABS = [
    { key: 'stats',    icon: '📊', label: 'Dashboard'  },
    { key: 'orders',   icon: '📦', label: 'Orders'     },
    { key: 'products', icon: '🏷️', label: 'Products'   },
    { key: 'users',    icon: '👥', label: 'Users'      },
  ]

  return (
    <div style={{ paddingBottom: 60 }}>
      {showAddProduct && (
        <AddProductModal onClose={() => setShowAddProduct(false)} onAdded={fetchProducts} />
      )}
      {editingProduct && (
        <EditProductModal
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
          onSaved={handleEditSaved}
        />
      )}

      <div className="page-header">
        <h1>⚙️ Admin Dashboard</h1>
        <p>Manage your ShopEase store</p>
      </div>
      <div className="container">

        {/* Tab nav */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 28, flexWrap: 'wrap' }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              padding: '10px 20px', borderRadius: 25, border: 'none', cursor: 'pointer',
              background: tab === t.key ? 'linear-gradient(135deg,#667eea,#764ba2)' : '#fff',
              color: tab === t.key ? '#fff' : '#555', fontWeight: 600, fontSize: '0.9rem',
              boxShadow: tab === t.key ? '0 4px 14px rgba(102,126,234,0.3)' : '0 2px 6px rgba(0,0,0,0.06)',
              fontFamily: 'inherit',
            }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {loading ? <Loader text="Loading..." /> : (
          <>
            {/* ── Stats ── */}
            {tab === 'stats' && stats && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 18, marginBottom: 32 }}>
                  {[
                    { label: 'Total Users',     value: stats.totalUsers,    icon: '👥', color: '#667eea' },
                    { label: 'Total Products',  value: stats.totalProducts, icon: '🏷️', color: '#2ecc71' },
                    { label: 'Total Orders',    value: stats.totalOrders,   icon: '📦', color: '#f39c12' },
                    { label: 'Total Revenue',   value: fmt(stats.totalRevenue), icon: '💰', color: '#e74c3c',
                      sub: 'from delivered orders' },
                  ].map(card => (
                    <div key={card.label} style={{ background: '#fff', borderRadius: 14, padding: '22px 20px', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', borderLeft: `4px solid ${card.color}` }}>
                      <div style={{ fontSize: '2rem', marginBottom: 8 }}>{card.icon}</div>
                      <div style={{ fontSize: '1.7rem', fontWeight: 700, color: card.color }}>{card.value}</div>
                      <div style={{ color: '#888', fontSize: '0.85rem', marginTop: 4 }}>{card.label}</div>
                      {card.sub && <div style={{ color: '#bbb', fontSize: '0.75rem', marginTop: 2 }}>{card.sub}</div>}
                    </div>
                  ))}
                </div>
                <div style={{ background: '#fff', borderRadius: 14, padding: 22, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                  <h2 style={{ fontSize: '1.1rem', marginBottom: 16 }}>Recent Orders</h2>
                  {(stats.recentOrders || []).map(o => (
                    <div key={o._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f5f5f5' }}>
                      <div><div style={{ fontWeight: 600, fontSize: '0.88rem' }}>#{o._id.slice(-8).toUpperCase()}</div><div style={{ color: '#888', fontSize: '0.8rem' }}>{o.userId?.name}</div></div>
                      <span className={`status status-${o.orderStatus}`}>{o.orderStatus}</span>
                      <span style={{ fontWeight: 700, color: '#667eea' }}>{fmt(o.totalAmount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Orders ── */}
            {tab === 'orders' && (
              <div>
                <SearchBar
                  value={orderSearch}
                  onChange={setOrderSearch}
                  placeholder="Search..."
                />
                <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                    <thead><tr style={{ background: '#f8f8ff' }}>{['Order ID','Customer','Total','Payment','Status','Action'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#555', borderBottom: '1px solid #eee' }}>{h}</th>
                    ))}</tr></thead>
                    <tbody>
                      {filteredOrders.map(o => (
                        <tr key={o._id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                          <td style={{ padding: '12px 16px', fontFamily: 'monospace' }}>#{o._id.slice(-8).toUpperCase()}</td>
                          <td style={{ padding: '12px 16px' }}>{o.userId?.name || 'User'}<br /><span style={{ color: '#999', fontSize: '0.78rem' }}>{o.userId?.email}</span></td>
                          <td style={{ padding: '12px 16px', fontWeight: 700, color: '#667eea' }}>{fmt(o.totalAmount)}</td>
                          <td style={{ padding: '12px 16px' }}>{o.paymentMethod}</td>
                          <td style={{ padding: '12px 16px' }}><span className={`status status-${o.orderStatus}`}>{o.orderStatus}</span></td>
                          <td style={{ padding: '12px 16px' }}>
                            <select value={o.orderStatus} onChange={e => handleStatusChange(o._id, e.target.value)}
                              style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #ddd', fontSize: '0.82rem' }}>
                              {STATUS_OPTS.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredOrders.length === 0 && (
                    <div className="empty-state">
                      <div className="icon">{orderSearch ? '🔍' : '📦'}</div>
                      <h3>{orderSearch ? `No orders match "${orderSearch}"` : 'No orders yet'}</h3>
                    </div>
                  )}
                </div>
                {orderSearch && (
                  <div style={{ color: '#888', fontSize: '0.82rem', marginTop: 8, textAlign: 'right' }}>
                    Showing {filteredOrders.length} of {orders.length} orders
                  </div>
                )}
              </div>
            )}

            {/* ── Products ── */}
            {tab === 'products' && (
              <div>
                {/* Header row: search + Add button */}
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 0 }}>
                  <div style={{ flex: 1 }}>
                    <SearchBar
                      value={productSearch}
                      onChange={setProductSearch}
                      placeholder="Search..."
                    />
                  </div>
                  <button
                    onClick={() => setShowAddProduct(true)}
                    style={{
                      padding: '10px 18px', borderRadius: 10, border: 'none', cursor: 'pointer',
                      background: 'linear-gradient(135deg,#667eea,#764ba2)', color: '#fff',
                      fontWeight: 700, fontSize: '0.88rem', fontFamily: 'inherit', whiteSpace: 'nowrap',
                      boxShadow: '0 4px 14px rgba(102,126,234,0.35)', flexShrink: 0,
                    }}
                  >
                    ➕ Add Product
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 18 }}>
                  {filteredProducts.map(p => (
                    <div key={p._id} style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 10px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
                      <img src={p.images?.[0] || ''} alt={p.name} style={{ width: '100%', height: 140, objectFit: 'cover', background: '#f0f0f0', display: 'block' }}
                        onError={e => e.target.style.background = '#e0e7ff'} />
                      <div style={{ padding: '14px 15px' }}>
                        <div style={{ fontWeight: 600, fontSize: '0.92rem', marginBottom: 4, lineHeight: 1.3 }}>{p.name}</div>
                        <div style={{ color: '#667eea', fontWeight: 700, marginBottom: 4 }}>{fmt(p.price)}</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#888', marginBottom: 4 }}>
                          <span>{p.category}</span>
                          <span>Stock: {p.stock}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#aaa', marginBottom: 12 }}>
                          <span>⭐ {p.rating?.average?.toFixed(1) || '0.0'} ({p.rating?.count || 0})</span>
                          <span style={{ color: p.isActive ? '#2ecc71' : '#e74c3c', fontWeight: 600 }}>
                            {p.isActive ? '● Active' : '○ Hidden'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            onClick={() => setEditingProduct(p)}
                            style={{
                              flex: 1, padding: '7px 0', borderRadius: 8, border: '1.5px solid #667eea',
                              background: '#f0f4ff', color: '#667eea', fontWeight: 700,
                              cursor: 'pointer', fontSize: '0.82rem', fontFamily: 'inherit',
                            }}
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p._id)}
                            style={{
                              flex: 1, padding: '7px 0', borderRadius: 8, border: '1.5px solid #e74c3c',
                              background: '#fff5f5', color: '#e74c3c', fontWeight: 700,
                              cursor: 'pointer', fontSize: '0.82rem', fontFamily: 'inherit',
                            }}
                          >
                            🗑 Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {filteredProducts.length === 0 && (
                  <div className="empty-state">
                    <div className="icon">{productSearch ? '🔍' : '🏷️'}</div>
                    <h3>{productSearch ? `No products match "${productSearch}"` : 'No products'}</h3>
                  </div>
                )}
                {productSearch && (
                  <div style={{ color: '#888', fontSize: '0.82rem', marginTop: 8, textAlign: 'right' }}>
                    Showing {filteredProducts.length} of {products.length} products
                  </div>
                )}
              </div>
            )}

            {/* ── Users ── */}
            {tab === 'users' && (
              <div>
                <SearchBar
                  value={userSearch}
                  onChange={setUserSearch}
                  placeholder="Search..."
                />
                <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                    <thead><tr style={{ background: '#f8f8ff' }}>{['Name','Email','Mobile','Role','Action'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#555', borderBottom: '1px solid #eee' }}>{h}</th>
                    ))}</tr></thead>
                    <tbody>
                      {filteredUsers.map(u => (
                        <tr key={u._id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                          <td style={{ padding: '12px 16px', fontWeight: 500 }}>{u.name}</td>
                          <td style={{ padding: '12px 16px', color: '#555' }}>{u.email}</td>
                          <td style={{ padding: '12px 16px', color: '#555' }}>{u.mobile}</td>
                          <td style={{ padding: '12px 16px' }}>
                            <select value={u.role} onChange={e => handleRoleChange(u._id, e.target.value)}
                              style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #ddd', fontSize: '0.82rem', background: u.role === 'admin' ? '#fff3e0' : '#f0f4ff' }}>
                              <option value="user">User</option>
                              <option value="admin">Admin</option>
                            </select>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <button onClick={() => handleDeleteUser(u._id)} className="btn btn-danger btn-sm">Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredUsers.length === 0 && (
                    <div className="empty-state">
                      <div className="icon">{userSearch ? '🔍' : '👥'}</div>
                      <h3>{userSearch ? `No users match "${userSearch}"` : 'No users'}</h3>
                    </div>
                  )}
                </div>
                {userSearch && (
                  <div style={{ color: '#888', fontSize: '0.82rem', marginTop: 8, textAlign: 'right' }}>
                    Showing {filteredUsers.length} of {users.length} users
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
