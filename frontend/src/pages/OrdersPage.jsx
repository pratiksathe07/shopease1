// src/pages/OrdersPage.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Loader from '../components/Loader'
import { useToast } from '../components/Toast'
import { getMyOrders, cancelOrder } from '../services/orderService'
import { addReview } from '../services/reviewService'

const fmt = (n) => '₹' + Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2 })
const STATUS_COLORS = {
  Pending:   'status-Pending',
  Confirmed: 'status-Confirmed',
  Shipped:   'status-Shipped',
  Delivered: 'status-Delivered',
  Cancelled: 'status-Cancelled',
}

export default function OrdersPage() {
  const [orders,   setOrders]   = useState([])
  const [loading,  setLoading]  = useState(true)
  const [expanded, setExpanded] = useState(null)

  // Review modal state
  const [reviewModal, setReviewModal] = useState(null)  // { productId, productName }
  const [rating,   setRating]   = useState(5)
  const [comment,  setComment]  = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [reviewed, setReviewed] = useState(new Set()) // productIds already reviewed

  const toast    = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    getMyOrders()
      .then(res => {
        const data = res.data?.data || []
        setOrders(data)
        // Auto-expand the first delivered order
        const firstDelivered = data.find(o => o.orderStatus === 'Delivered')
        if (firstDelivered) setExpanded(firstDelivered._id)
      })
      .catch(() => setOrders([]))
      .finally(() => setLoading(false))
  }, [])

  async function handleCancel(id) {
    if (!window.confirm('Cancel this order?')) return
    try {
      await cancelOrder(id)
      setOrders(prev => prev.map(o => o._id === id ? { ...o, orderStatus: 'Cancelled' } : o))
      toast.success('Order cancelled')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not cancel order')
    }
  }

  function openReview(productId, productName) {
    setReviewModal({ productId, productName })
    setRating(5)
    setComment('')
  }

  async function handleSubmitReview(e) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await addReview({ productId: reviewModal.productId, rating, comment })
      setReviewed(prev => new Set([...prev, reviewModal.productId]))
      setReviewModal(null)
      toast.success('⭐ Review submitted! Thank you.')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review')
    } finally { setSubmitting(false) }
  }

  if (loading) return <Loader text="Loading your orders..." />

  return (
    <div style={{ paddingBottom: 60 }}>
      <div className="page-header">
        <h1>📦 My Orders</h1>
        <p>{orders.length} order{orders.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="container" style={{ maxWidth: 860 }}>
        {orders.length === 0 ? (
          <div className="empty-state">
            <div className="icon">📦</div>
            <h3>No orders yet</h3>
            <p>Your orders will appear here after checkout</p>
            <button className="btn btn-primary" onClick={() => navigate('/products')} style={{ marginTop: 20 }}>
              Start Shopping
            </button>
          </div>
        ) : (
          orders.map(order => (
            <div key={order._id} style={{ background: '#fff', borderRadius: 14, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: 20, overflow: 'hidden' }}>

              {/* ── Order header ── */}
              <div style={{ padding: '16px 22px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#999', marginBottom: 2 }}>Order ID</div>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', fontFamily: 'monospace', color: '#333' }}>
                    #{order._id.slice(-10).toUpperCase()}
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: '#999', marginBottom: 2 }}>Date</div>
                  <div style={{ fontWeight: 500, fontSize: '0.88rem' }}>
                    {new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </div>
                </div>
                <div>
                  <span className={`status ${STATUS_COLORS[order.orderStatus] || ''}`}>
                    {order.orderStatus === 'Delivered' ? '✅ ' : ''}{order.orderStatus}
                  </span>
                </div>
                <div style={{ fontWeight: 700, color: '#667eea', fontSize: '1.05rem' }}>
                  {fmt(order.totalAmount)}
                </div>
                <button
                  onClick={() => setExpanded(e => e === order._id ? null : order._id)}
                  style={{ padding: '6px 14px', border: '1px solid #ddd', borderRadius: 20, background: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.85rem' }}>
                  {expanded === order._id ? 'Hide ▲' : 'Details ▼'}
                </button>
              </div>

              {/* ── Delivered banner ── */}
              {order.orderStatus === 'Delivered' && (
                <div style={{ padding: '10px 22px', background: 'linear-gradient(135deg,#2ecc71,#27ae60)', color: '#fff', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>🎉</span>
                  <strong>Delivered!</strong>
                  <span style={{ opacity: 0.9 }}>— You can now review the products in this order.</span>
                </div>
              )}

              {/* ── Expanded details ── */}
              {expanded === order._id && (
                <div style={{ padding: '18px 22px' }}>
                  {/* Items list */}
                  {order.items?.map((item, i) => (
                    <div key={i} style={{ display: 'flex', gap: 14, padding: '12px 0', borderBottom: '1px solid #f5f5f5', alignItems: 'center' }}>
                      <img src={item.image || ''} alt={item.name}
                        style={{ width: 58, height: 58, objectFit: 'cover', borderRadius: 8, background: '#f0f0f0', flexShrink: 0 }}
                        onError={e => e.target.style.background = '#e0e7ff'} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.93rem', marginBottom: 2 }}>{item.name}</div>
                        <div style={{ color: '#888', fontSize: '0.82rem' }}>
                          Qty: {item.quantity} × {fmt(item.price)}
                        </div>
                      </div>
                      <div style={{ fontWeight: 700, color: '#333', marginRight: 12 }}>
                        {fmt(item.price * item.quantity)}
                      </div>

                      {/* Write Review button — only for delivered orders */}
                      {order.orderStatus === 'Delivered' && (
                        reviewed.has(item.productId?.toString() || item.productId) ? (
                          <div style={{ padding: '6px 14px', background: '#d4edda', borderRadius: 20, fontSize: '0.82rem', color: '#155724', fontWeight: 600, whiteSpace: 'nowrap' }}>
                            ✅ Reviewed
                          </div>
                        ) : (
                          <button
                            onClick={() => openReview(item.productId?.toString() || item.productId, item.name)}
                            style={{ padding: '7px 14px', background: 'linear-gradient(135deg,#667eea,#764ba2)', color: '#fff', border: 'none', borderRadius: 20, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, fontSize: '0.82rem', whiteSpace: 'nowrap', boxShadow: '0 2px 8px rgba(102,126,234,0.3)' }}>
                            ⭐ Review
                          </button>
                        )
                      )}
                    </div>
                  ))}

                  {/* Shipping + Payment info */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
                    <div style={{ background: '#fafafa', borderRadius: 8, padding: 14 }}>
                      <div style={{ fontWeight: 600, marginBottom: 8, fontSize: '0.88rem' }}>📍 Delivery Address</div>
                      <div style={{ color: '#555', fontSize: '0.83rem', lineHeight: 1.7 }}>
                        {order.shippingAddress?.fullName}<br />
                        {order.shippingAddress?.street}, {order.shippingAddress?.city}<br />
                        {order.shippingAddress?.state} — {order.shippingAddress?.pincode}
                      </div>
                    </div>
                    <div style={{ background: '#fafafa', borderRadius: 8, padding: 14 }}>
                      <div style={{ fontWeight: 600, marginBottom: 8, fontSize: '0.88rem' }}>💳 Payment</div>
                      <div style={{ fontSize: '0.83rem', color: '#555', lineHeight: 1.7 }}>
                        <div>Method: <strong>{order.paymentMethod}</strong></div>
                        <div>
                          Status:{' '}
                          <span style={{ color: order.paymentStatus === 'Paid' ? '#2ecc71' : '#f39c12', fontWeight: 600 }}>
                            {order.paymentStatus}
                          </span>
                        </div>
                        <div>Total: <strong style={{ color: '#667eea' }}>{fmt(order.totalAmount)}</strong></div>
                      </div>
                    </div>
                  </div>

                  {/* Cancel button */}
                  {!['Shipped', 'Delivered', 'Cancelled'].includes(order.orderStatus) && (
                    <button onClick={() => handleCancel(order._id)}
                      style={{ marginTop: 16, padding: '8px 20px', background: 'none', border: '2px solid #e74c3c', borderRadius: 20, color: '#e74c3c', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, fontSize: '0.88rem' }}>
                      Cancel Order
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* ── Review Modal ── */}
      {reviewModal && (
        <div className="modal-overlay" onClick={() => setReviewModal(null)}>
          <div className="modal" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 style={{ fontSize: '1.1rem' }}>⭐ Write a Review</h2>
                <p style={{ color: '#888', fontSize: '0.82rem', marginTop: 2 }}>{reviewModal.productName}</p>
              </div>
              <button className="close-btn" onClick={() => setReviewModal(null)}>✕</button>
            </div>
            <form onSubmit={handleSubmitReview}>
              <div className="modal-body">
                {/* Stars */}
                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontWeight: 600, display: 'block', marginBottom: 10 }}>Your Rating</label>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {[1,2,3,4,5].map(n => (
                      <span key={n} onClick={() => setRating(n)}
                        style={{ fontSize: '2.2rem', cursor: 'pointer', color: n <= rating ? '#f1c40f' : '#ddd', transition: 'color 0.15s, transform 0.1s' }}
                        onMouseEnter={e => e.target.style.transform = 'scale(1.2)'}
                        onMouseLeave={e => e.target.style.transform = 'none'}>★</span>
                    ))}
                    <span style={{ color: '#667eea', fontWeight: 700, fontSize: '0.95rem', marginLeft: 8 }}>
                      {['','Poor','Fair','Good','Very Good','Excellent!'][rating]}
                    </span>
                  </div>
                </div>

                {/* Comment */}
                <div className="form-group">
                  <label>Your Review (optional)</label>
                  <textarea
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    placeholder="Tell others what you thought about this product..."
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 8, minHeight: 100, resize: 'vertical', fontFamily: 'inherit', fontSize: '0.9rem', outline: 'none' }}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setReviewModal(null)}
                  style={{ padding: '9px 20px', border: '1px solid #ddd', borderRadius: 20, background: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? '⏳ Submitting...' : '✓ Submit Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
