// src/pages/CheckoutPage.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/Toast'
import { placeOrder } from '../services/orderService'

const fmt = (n) => '₹' + Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2 })

const STEPS = ['1. Address', '2. Summary', '3. Payment']

// ── Only COD and UPI ──────────────────────────────────────
const PAYMENT_OPTS = [
  {
    value: 'COD',
    icon:  '💵',
    label: 'Cash on Delivery',
    desc:  'Pay when product arrives at your doorstep',
  },
  {
    value: 'UPI',
    icon:  '📱',
    label: 'UPI Payment',
    desc:  'PhonePe, Google Pay, Paytm, BHIM & more',
  },
]

export default function CheckoutPage() {
  const { cart, cartTotal, clearCart } = useCart()
  const { user }  = useAuth()
  const toast     = useToast()
  const navigate  = useNavigate()

  const [step,    setStep]    = useState(0)
  const [addr,    setAddr]    = useState({
    fullName: user?.name   || '',
    mobile:   user?.mobile || '',
    street: '', city: '', state: '', pincode: '', country: 'India',
  })
  const [addrErr, setAddrErr] = useState({})
  const [payment, setPayment] = useState('COD')
  const [placing, setPlacing] = useState(false)

  const gst        = +(cartTotal * 0.03).toFixed(2)
  const grandTotal = +(cartTotal + gst).toFixed(2)

  if (cart.length === 0) return (
    <div>
      <div className="page-header"><h1>Checkout</h1></div>
      <div className="empty-state">
        <div className="icon">🛒</div>
        <h3>Your cart is empty</h3>
        <button className="btn btn-primary" onClick={() => navigate('/products')} style={{ marginTop: 20 }}>
          Shop Now
        </button>
      </div>
    </div>
  )

  // ── Address validation ─────────────────────────────────────
  function validateAddr() {
    const e = {}
    if (!addr.fullName.trim()) e.fullName = 'Full name is required'
    if (!addr.mobile.trim())   e.mobile   = 'Mobile number is required'
    else if (!/^[6-9][0-9]{9}$/.test(addr.mobile.trim())) e.mobile = 'Enter a valid 10-digit mobile number'
    if (!addr.street.trim())   e.street   = 'Street address is required'
    if (!addr.city.trim())     e.city     = 'City is required'
    if (!addr.state.trim())    e.state    = 'State is required'
    if (!addr.pincode.trim())  e.pincode  = 'Pincode is required'
    else if (!/^[0-9]{6}$/.test(addr.pincode.trim())) e.pincode = '6-digit pincode required'
    setAddrErr(e)
    return Object.keys(e).length === 0
  }

  // ── Place order ────────────────────────────────────────────
  async function handlePlaceOrder() {
    setPlacing(true)
    try {
      await placeOrder({
        items: cart.map(({ product, qty }) => ({ productId: product._id, quantity: qty })),
        shippingAddress: addr,
        paymentMethod:   payment,
      })
      clearCart()
      toast.success('🎉 Order placed successfully!')
      navigate('/orders')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Order failed. Please try again.')
    } finally { setPlacing(false) }
  }

  // ── Address field helper ───────────────────────────────────
  const field = (label, key, type = 'text', colSpan = 2, maxLength) => (
    <div style={{ gridColumn: `span ${colSpan}` }} key={key}>
      <label style={{ display: 'block', fontWeight: 500, fontSize: '0.88rem', marginBottom: 5, color: '#555' }}>{label}</label>
      <input
        type={type}
        className={`form-input${addrErr[key] ? ' error' : ''}`}
        placeholder={label}
        value={addr[key]}
        maxLength={maxLength}
        onChange={e => { setAddr(p => ({ ...p, [key]: e.target.value })); setAddrErr(p => ({ ...p, [key]: '' })) }}
      />
      {addrErr[key] && <div className="form-error">{addrErr[key]}</div>}
    </div>
  )

  return (
    <div style={{ paddingBottom: 60 }}>
      <div className="page-header"><h1>Checkout</h1></div>
      <div className="container" style={{ maxWidth: 960 }}>

        {/* ── Step indicator ── */}
        <div style={{ display: 'flex', marginBottom: 32, gap: 4 }}>
          {STEPS.map((s, i) => (
            <div key={s} style={{
              flex: 1, padding: '11px 8px', textAlign: 'center',
              fontSize: '0.87rem', fontWeight: 600, borderRadius: 8,
              background: i < step
                ? '#2ecc71'
                : i === step
                  ? 'linear-gradient(135deg,#667eea,#764ba2)'
                  : '#f0f0f0',
              color: i <= step ? '#fff' : '#888',
              transition: 'all 0.3s',
            }}>
              {i < step ? `✓ ${s}` : s}
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24, alignItems: 'start' }}>

          {/* ── Main step panel ── */}
          <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', padding: 28 }}>

            {/* Step 1 — Address */}
            {step === 0 && (
              <>
                <h2 style={{ fontSize: '1.15rem', marginBottom: 22 }}>📍 Delivery Address</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  {field('Full Name',       'fullName', 'text', 2)}
                  {field('Mobile Number',   'mobile',   'tel',  2, 10)}
                  {field('Street / Flat No','street',   'text', 2)}
                  {field('City',            'city',     'text', 1)}
                  {field('State',           'state',    'text', 1)}
                  {field('Pincode',         'pincode',  'number', 1,2)}
                  {field('Country',         'country',  'text', 1)}
                </div>
                <button className="btn btn-primary" style={{ marginTop: 20, width: '100%', justifyContent: 'center' }}
                  onClick={() => validateAddr() && setStep(1)}>
                  Save & Continue →
                </button>
              </>
            )}

            {/* Step 2 — Order Summary */}
            {step === 1 && (
              <>
                <h2 style={{ fontSize: '1.15rem', marginBottom: 20 }}>📦 Order Summary</h2>
                <div style={{ maxHeight: 300, overflowY: 'auto', marginBottom: 20 }}>
                  {cart.map(({ product: p, qty }) => (
                    <div key={p._id} style={{ display: 'flex', gap: 14, padding: '12px 0', borderBottom: '1px solid #eee', alignItems: 'center' }}>
                      <img src={p.images?.[0] || ''} alt={p.name}
                        style={{ width: 54, height: 54, objectFit: 'cover', borderRadius: 8, background: '#f0f0f0', flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.93rem' }}>{p.name}</div>
                        <div style={{ color: '#667eea', fontWeight: 700 }}>{fmt(p.price)} × {qty}</div>
                      </div>
                      <div style={{ fontWeight: 700 }}>{fmt(p.price * qty)}</div>
                    </div>
                  ))}
                </div>
                {/* Address preview */}
                <div style={{ background: '#f8f8ff', borderRadius: 8, padding: 14, marginBottom: 20, fontSize: '0.87rem', color: '#555' }}>
                  <strong style={{ display: 'block', marginBottom: 4 }}>📍 Delivering to:</strong>
                  {addr.fullName} • {addr.mobile}<br />
                  {addr.street}, {addr.city}, {addr.state} — {addr.pincode}
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setStep(0)}
                    style={{ flex: 1, padding: 10, border: '1px solid #ddd', borderRadius: 25, cursor: 'pointer', fontFamily: 'inherit', background: '#fff' }}>
                    ← Edit Address
                  </button>
                  <button className="btn btn-primary" onClick={() => setStep(2)} style={{ flex: 2, justifyContent: 'center' }}>
                    Choose Payment →
                  </button>
                </div>
              </>
            )}

            {/* Step 3 — Payment */}
            {step === 2 && (
              <>
                <h2 style={{ fontSize: '1.15rem', marginBottom: 20 }}>💳 Select Payment Method</h2>

                {/* COD + UPI only */}
                {PAYMENT_OPTS.map(opt => (
                  <div key={opt.value} onClick={() => setPayment(opt.value)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 16,
                      padding: 18, borderRadius: 12, marginBottom: 14,
                      border: `2px solid ${payment === opt.value ? '#667eea' : '#eee'}`,
                      background: payment === opt.value ? '#f0f3ff' : '#fff',
                      cursor: 'pointer', transition: 'all 0.2s',
                      boxShadow: payment === opt.value ? '0 4px 14px rgba(102,126,234,0.15)' : 'none',
                    }}>
                    <div style={{ fontSize: '2rem', lineHeight: 1 }}>{opt.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: '1rem' }}>{opt.label}</div>
                      <div style={{ color: '#888', fontSize: '0.83rem', marginTop: 2 }}>{opt.desc}</div>
                    </div>
                    {/* Radio indicator */}
                    <div style={{
                      width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                      border: `2px solid ${payment === opt.value ? '#667eea' : '#ccc'}`,
                      background: payment === opt.value ? '#667eea' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {payment === opt.value && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />}
                    </div>
                  </div>
                ))}

                {/* UPI QR Code */}
                {payment === 'UPI' && (
                  <div style={{ textAlign: 'center', background: '#f8f8ff', borderRadius: 12, padding: '20px 16px', marginBottom: 20, border: '1px solid #e0e7ff' }}>
                    <p style={{ fontWeight: 600, color: '#333', marginBottom: 12 }}>Scan QR to pay {fmt(grandTotal)}</p>
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`upi://pay?pa=8668458898@ybl&pn=ShopEase&am=${grandTotal}&cu=INR&tn=ShopEase+Order`)}`}
                      alt="UPI QR Code"
                      style={{ width: 200, height: 200, borderRadius: 12, border: '3px solid #667eea', display: 'block', margin: '0 auto' }}
                    />
                    <div style={{ marginTop: 12, color: '#667eea', fontWeight: 700, fontSize: '0.95rem' }}></div>
                    <p style={{ color: '#888', fontSize: '0.82rem', marginTop: 4 }}>
                      Open any UPI app and scan the QR code above
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 12 }}>
                      {['PhonePe', 'GPay', 'Paytm', 'Navi'].map(app => (
                        <span key={app} style={{ padding: '3px 10px', background: '#e8edff', borderRadius: 20, fontSize: '0.78rem', color: '#667eea', fontWeight: 500 }}>{app}</span>
                      ))}
                    </div>
                  </div>
                  
                )}

                {payment === 'COD' && (
                  <div style={{ background: '#f0fff4', borderRadius: 10, padding: 14, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10, border: '1px solid #b7ebc8' }}>
                    <span style={{ fontSize: '1.3rem' }}>💵</span>
                    <div>
                      <strong style={{ color: '#155724', fontSize: '0.92rem' }}>Cash on Delivery selected</strong>
                      <p style={{ color: '#155724', fontSize: '0.82rem', marginTop: 2 }}>
                        Keep <strong>{fmt(grandTotal)}</strong> ready when your order arrives.
                      </p>
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setStep(1)}
                    style={{ flex: 1, padding: 10, border: '1px solid #ddd', borderRadius: 25, cursor: 'pointer', fontFamily: 'inherit', background: '#fff' }}>
                    ← Back
                  </button>
                  <button className="btn btn-primary" onClick={handlePlaceOrder} disabled={placing}
                    style={{ flex: 2, justifyContent: 'center', padding: '12px 20px' }}>
                    {placing ? '⏳ Placing order...' : `✓ Place Order — ${fmt(grandTotal)}`}
                  </button>
                </div>
              </>
            )}
          </div>

          {/* ── Sticky order summary sidebar ── */}
          <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', padding: 20, position: 'sticky', top: 80 }}>
            <h3 style={{ fontSize: '1rem', marginBottom: 16, color: '#333' }}>🧾 Order Total</h3>
            {cart.map(({ product: p, qty }) => (
              <div key={p._id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.85rem', gap: 8 }}>
                <span style={{ color: '#555', flex: 1, lineHeight: 1.3 }}>{p.name} <span style={{ color: '#999' }}>×{qty}</span></span>
                <span style={{ fontWeight: 600, flexShrink: 0 }}>{fmt(p.price * qty)}</span>
              </div>
            ))}
            <div style={{ borderTop: '1px solid #eee', marginTop: 12, paddingTop: 12 }}>
              {[
                ['Subtotal',    fmt(cartTotal)],
                ['Delivery',    'FREE '],
                ['GST (3%)',    fmt(gst)],
              ].map(([label, val]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.85rem' }}>
                  <span style={{ color: '#666' }}>{label}</span>
                  <span style={{ color: val === 'FREE 🎉' ? '#2ecc71' : '#333', fontWeight: val === 'FREE 🎉' ? 600 : 400 }}>{val}</span>
                </div>
              ))}
              <div style={{ borderTop: '2px solid #667eea', marginTop: 10, paddingTop: 12, display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.1rem' }}>
                <span>Total</span>
                <span style={{ color: '#667eea' }}>{fmt(grandTotal)}</span>
              </div>
            </div>
            {/* Payment badge */}
            {step === 2 && (
              <div style={{ marginTop: 14, padding: '8px 14px', background: payment === 'COD' ? '#f0fff4' : '#f0f3ff', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem' }}>
                <span>{payment === 'COD' ? '💵' : '📱'}</span>
                <span style={{ fontWeight: 600, color: payment === 'COD' ? '#155724' : '#3d3d9f' }}>
                  {payment === 'COD' ? 'Cash on Delivery' : 'UPI Payment'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
