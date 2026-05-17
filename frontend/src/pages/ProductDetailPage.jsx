// src/pages/ProductDetailPage.jsx
import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Loader from '../components/Loader'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/Toast'
import { getProductById } from '../services/productService'
import { getReviews, addReview, canReview as checkCanReview } from '../services/reviewService'

const fmt   = (n) => '₹' + Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2 })
const stars = (n) => '★'.repeat(Math.round(n || 0)) + '☆'.repeat(5 - Math.round(n || 0))

export default function ProductDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addToCart, inCart } = useCart()
  const { isLoggedIn } = useAuth()
  const toast = useToast()

  const [product,      setProduct]      = useState(null)
  const [reviews,      setReviews]      = useState([])
  const [loading,      setLoading]      = useState(true)
  const [imgIdx,       setImgIdx]       = useState(0)
  const [qty,          setQty]          = useState(1)
  const [reviewStatus, setReviewStatus] = useState(null) // { canReview, hasPurchased, alreadyReviewed }
  const [rating,       setRating]       = useState(5)
  const [comment,      setComment]      = useState('')
  const [submitting,   setSubmitting]   = useState(false)
  const reviewFormRef = useRef(null)

  useEffect(() => {
    const fetches = [getProductById(id), getReviews(id)]
    if (isLoggedIn) fetches.push(checkCanReview(id))

    Promise.all(fetches)
      .then(([pRes, rRes, crRes]) => {
        setProduct(pRes.data?.data)
        setReviews(rRes.data?.data || [])
        if (crRes) {
          const status = crRes.data?.data
          setReviewStatus(status)
          // Auto-scroll to review form if user can review
          if (status?.canReview) {
            setTimeout(() => reviewFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 400)
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id, isLoggedIn])

  async function handleReview(e) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await addReview({ productId: id, rating, comment })
      setReviews(prev => [res.data.data, ...prev])
      setReviewStatus(prev => ({ ...prev, canReview: false, alreadyReviewed: true }))
      setComment('')
      toast.success('⭐ Review submitted successfully!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review')
    } finally { setSubmitting(false) }
  }

  if (loading) return <Loader text="Loading product..." />
  if (!product) return (
    <div className="empty-state" style={{ marginTop: 80 }}>
      <div className="icon">😕</div><h3>Product not found</h3>
      <button className="btn btn-primary" onClick={() => navigate('/products')} style={{ marginTop: 20 }}>Back to Products</button>
    </div>
  )

  const images = product.images?.length > 0 ? product.images
    : ['https://images.unsplash.com/photo-1560472355-536de3962603?w=600&q=80']

  // ── Review section rendering ──────────────────────────────
  function renderReviewSection() {
    if (!isLoggedIn) {
      return (
        <div style={{ background: '#f0f3ff', borderRadius: 10, padding: 18, marginBottom: 24, textAlign: 'center' }}>
          <span>Please </span>
          <span style={{ color: '#667eea', cursor: 'pointer', fontWeight: 600 }} onClick={() => navigate('/login')}>login</span>
          <span> to see if you can review this product.</span>
        </div>
      )
    }

    if (reviewStatus?.alreadyReviewed) {
      return (
        <div style={{ background: '#d4edda', borderRadius: 10, padding: 16, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: '1.4rem' }}>✅</span>
          <div>
            <strong style={{ color: '#155724' }}>You've already reviewed this product</strong>
            <p style={{ color: '#155724', fontSize: '0.85rem', marginTop: 2 }}>Thank you for your feedback!</p>
          </div>
        </div>
      )
    }

    if (reviewStatus?.canReview) {
      return (
        <div ref={reviewFormRef}>
          {/* Auto-open highlight banner */}
          <div style={{ background: 'linear-gradient(135deg,#667eea,#764ba2)', borderRadius: 10, padding: '14px 18px', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: '1.5rem' }}>🎉</span>
            <div>
              <strong style={{ color: '#fff' }}>You purchased this product!</strong>
              <p style={{ color: 'rgba(255,255,255,0.88)', fontSize: '0.85rem', marginTop: 2 }}>Share your experience to help others.</p>
            </div>
          </div>

          <form onSubmit={handleReview} style={{ background: '#f8f8ff', borderRadius: 10, padding: 20, marginBottom: 28, border: '2px solid #667eea' }}>
            <h3 style={{ marginBottom: 14, fontSize: '1rem', color: '#333' }}>⭐ Write Your Review</h3>

            {/* Star selector */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: '0.88rem', color: '#555', display: 'block', marginBottom: 6 }}>Your Rating</label>
              <div style={{ display: 'flex', gap: 6 }}>
                {[1,2,3,4,5].map(n => (
                  <span key={n} onClick={() => setRating(n)}
                    style={{ fontSize: '2rem', cursor: 'pointer', color: n <= rating ? '#f1c40f' : '#ddd', transition: 'color 0.15s, transform 0.1s' }}
                    onMouseEnter={e => e.target.style.transform = 'scale(1.2)'}
                    onMouseLeave={e => e.target.style.transform = 'none'}>★</span>
                ))}
                <span style={{ marginLeft: 8, color: '#667eea', fontWeight: 600, alignSelf: 'center' }}>
                  {['','Poor','Fair','Good','Very Good','Excellent'][rating]}
                </span>
              </div>
            </div>

            {/* Comment */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: '0.88rem', color: '#555', display: 'block', marginBottom: 6 }}>Your Review (optional)</label>
              <textarea value={comment} onChange={e => setComment(e.target.value)}
                placeholder="Share your experience with this product..."
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 8, minHeight: 90, resize: 'vertical', fontFamily: 'inherit', fontSize: '0.9rem', outline: 'none' }} />
            </div>

            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? '⏳ Submitting...' : '✓ Submit Review'}
            </button>
          </form>
        </div>
      )
    }

    if (reviewStatus?.hasPurchased === false) {
      return (
        <div style={{ background: '#fff3cd', borderRadius: 10, padding: 16, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: '1.4rem' }}>🔒</span>
          <div>
            <strong style={{ color: '#856404' }}>Purchase required to review</strong>
            <p style={{ color: '#856404', fontSize: '0.85rem', marginTop: 2 }}>Buy this product and receive it to unlock the review form.</p>
          </div>
        </div>
      )
    }

    // Still loading eligibility
    return null
  }

  return (
    <div style={{ paddingBottom: 60 }}>
      <div className="container" style={{ paddingTop: 32 }}>
        {/* Breadcrumb */}
        <p style={{ color: '#888', fontSize: '0.85rem', marginBottom: 24 }}>
          <span onClick={() => navigate('/')} style={{ cursor: 'pointer', color: '#667eea' }}>Home</span>
          {' / '}
          <span onClick={() => navigate('/products')} style={{ cursor: 'pointer', color: '#667eea' }}>Products</span>
          {' / '}
          {product.name}
        </p>

        {/* Product grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, marginBottom: 50 }}>
          {/* Images */}
          <div>
            <img src={images[imgIdx]} alt={product.name}
              style={{ width: '100%', height: 380, objectFit: 'cover', borderRadius: 14, background: '#f0f0f0', display: 'block' }}
              onError={e => { e.target.src = 'https://images.unsplash.com/photo-1560472355-536de3962603?w=600&q=80' }} />
            {images.length > 1 && (
              <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
                {images.map((img, i) => (
                  <img key={i} src={img} alt="" onClick={() => setImgIdx(i)}
                    style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8, cursor: 'pointer',
                      border: i === imgIdx ? '2px solid #667eea' : '2px solid transparent', transition: 'border 0.15s' }} />
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            <span style={{ fontSize: '0.78rem', color: '#999', textTransform: 'uppercase', letterSpacing: 1 }}>{product.category}</span>
            <h1 style={{ fontSize: '1.7rem', marginTop: 6, marginBottom: 12, lineHeight: 1.3 }}>{product.name}</h1>

            <div style={{ color: '#f1c40f', fontSize: '1.1rem', letterSpacing: 2, marginBottom: 4 }}>
              {stars(product.rating?.average)}
              <span style={{ color: '#888', fontSize: '0.85rem', marginLeft: 8 }}>
                {product.rating?.average?.toFixed(1) || '0.0'} ({reviews.length} reviews)
              </span>
            </div>

            <div style={{ fontSize: '2rem', color: '#667eea', fontWeight: 700, margin: '16px 0' }}>
              {fmt(product.price)}
            </div>

            {product.description && (
              <p style={{ color: '#555', lineHeight: 1.7, marginBottom: 20 }}>{product.description}</p>
            )}

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
              {product.brand && (
                <div><span style={{ fontWeight: 600 }}>Brand: </span><span style={{ color: '#667eea' }}>{product.brand}</span></div>
              )}
              <div>
                <span style={{ fontWeight: 600 }}>Stock: </span>
                <span style={{ color: product.stock > 0 ? '#2ecc71' : '#e74c3c', fontWeight: 600 }}>
                  {product.stock > 0 ? `${product.stock} available` : 'Out of stock'}
                </span>
              </div>
            </div>

            {/* Quantity */}
            {product.stock > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                <span style={{ fontWeight: 600 }}>Qty:</span>
                <button onClick={() => setQty(q => Math.max(1, q - 1))}
                  style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid #ddd', background: '#fff', fontSize: '1.1rem', cursor: 'pointer' }}>−</button>
                <span style={{ fontWeight: 600, minWidth: 28, textAlign: 'center' }}>{qty}</span>
                <button onClick={() => setQty(q => Math.min(product.stock, q + 1))}
                  style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid #ddd', background: '#fff', fontSize: '1.1rem', cursor: 'pointer' }}>+</button>
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}
                onClick={() => { for (let i = 0; i < qty; i++) addToCart(product); toast.success('Added to cart 🛒') }}
                disabled={product.stock === 0}>
                🛒 {inCart(product._id) ? 'Add More' : 'Add to Cart'}
              </button>
              <button className="btn" style={{ flex: 1, justifyContent: 'center', background: '#ff9800', color: '#fff' }}
                onClick={() => { addToCart(product, qty); navigate('/checkout') }}
                disabled={product.stock === 0}>
                ⚡ Buy Now
              </button>
            </div>
          </div>
        </div>

        {/* Reviews section */}
        <div style={{ background: '#fff', borderRadius: 14, padding: 28, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <h2 style={{ fontSize: '1.3rem', marginBottom: 24 }}>⭐ Customer Reviews</h2>

          {/* Review eligibility / form */}
          {renderReviewSection()}

          {/* Existing reviews list */}
          {reviews.length === 0 ? (
            <p style={{ color: '#999', textAlign: 'center', padding: '24px 0', fontSize: '0.93rem' }}>No reviews yet. Be the first to review after purchase!</p>
          ) : (
            reviews.map(r => (
              <div key={r._id} style={{ borderBottom: '1px solid #eee', paddingBottom: 16, marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#667eea,#764ba2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '0.9rem', flexShrink: 0 }}>
                      {r.userId?.name?.charAt(0).toUpperCase()}
                    </div>
                    <strong style={{ fontSize: '0.95rem' }}>{r.userId?.name || 'Customer'}</strong>
                  </div>
                  <span style={{ color: '#f1c40f', letterSpacing: 2, fontSize: '1rem' }}>{stars(r.rating)}</span>
                </div>
                {r.comment && <p style={{ color: '#555', lineHeight: 1.6, fontSize: '0.9rem', marginLeft: 46 }}>{r.comment}</p>}
                <div style={{ color: '#bbb', fontSize: '0.78rem', marginTop: 6, marginLeft: 46 }}>
                  {new Date(r.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
