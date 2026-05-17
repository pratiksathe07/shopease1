// src/pages/LoginPage.jsx
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/Toast'

const emailRe  = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const mobileRe = /^[6-9][0-9]{9}$/

export default function LoginPage() {
  const { login, register } = useAuth()
  const toast    = useToast()
  const navigate = useNavigate()

  const [mode,    setMode]    = useState('login')  // 'login' | 'register'
  const [loading, setLoading] = useState(false)
  const [errors,  setErrors]  = useState({})

  // Login form state
  const [loginData, setLoginData] = useState({ email: '', password: '', role: 'user' })

  // Register form state
  const [regData, setRegData] = useState({ name: '', email: '', mobile: '', password: '' })

  // ── Validate ─────────────────────────────────
  function validateLogin() {
    const e = {}
    if (!loginData.email)             e.email    = 'Email is required'
    else if (!emailRe.test(loginData.email)) e.email = 'Enter a valid email'
    if (!loginData.password)          e.password = 'Password is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function validateRegister() {
    const e = {}
    if (!regData.name || regData.name.trim().length < 2) e.name = 'Name must be at least 2 characters'
    if (!regData.email)                                   e.email = 'Email is required'
    else if (!emailRe.test(regData.email))                e.email = 'Enter a valid email'
    if (!regData.mobile)                                  e.mobile = 'Mobile is required'
    else if (!mobileRe.test(regData.mobile))              e.mobile = 'Enter a valid 10-digit Indian mobile number'
    if (!regData.password || regData.password.length < 6) e.password = 'Password must be at least 6 characters'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  // ── Submit Login ──────────────────────────────
  async function handleLogin(e) {
    e.preventDefault()
    if (!validateLogin()) return
    setLoading(true)
    // Pass role so backend can verify admin access
    const result = await login(loginData.email.trim(), loginData.password, loginData.role)
    setLoading(false)
    if (!result.success) { toast.error(result.message); return }
    toast.success(`Welcome back, ${result.user.name}! 🎉`)
    navigate(result.user.role === 'admin' ? '/admin' : '/')
  }

  // ── Submit Register ───────────────────────────
  async function handleRegister(e) {
    e.preventDefault()
    if (!validateRegister()) return
    setLoading(true)
    const result = await register(regData.name.trim(), regData.email.trim(), regData.mobile.trim(), regData.password)
    setLoading(false)
    if (!result.success) { toast.error(result.message); return }
    toast.success('Account created! Please sign in.')
    setMode('login')
    setRegData({ name: '', email: '', mobile: '', password: '' })
    setErrors({})
  }

  const field = (label, key, type = 'text', state, setState, placeholder = '') => (
    <div className="form-group" key={key}>
      <label>{label}</label>
      <input
        type={type}
        className={`form-input${errors[key] ? ' error' : ''}`}
        placeholder={placeholder || label}
        value={state[key]}
        onChange={e => { setState(p => ({ ...p, [key]: e.target.value })); setErrors(p => ({ ...p, [key]: '' })) }}
        maxLength={key === 'mobile' ? 10 : undefined}
      />
      {errors[key] && <div className="form-error">{errors[key]}</div>}
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
        <div style={{ width: '100%', maxWidth: 900, minHeight: 520, display: 'flex', borderRadius: 16, overflow: 'hidden', background: '#fff', boxShadow: '0 15px 40px rgba(102,126,234,0.18)' }}>

          {/* ── Left: Form ── */}
          <div style={{ width: '55%', padding: '50px 44px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            {/* Brand mini */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
              <img src="/logo.png" alt="ShopEase" style={{ height: 40, width: 40, objectFit: 'contain' }} onError={e => e.target.style.display = 'none'} />
              <span style={{ fontSize: '1.3rem', fontWeight: 700, background: 'linear-gradient(135deg,#667eea,#764ba2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>ShopEase</span>
            </div>

            {mode === 'login' ? (
              <form onSubmit={handleLogin} noValidate>
                <h2 style={{ fontSize: '1.7rem', marginBottom: 6, color: '#222' }}>Welcome back</h2>
                <p style={{ color: '#888', fontSize: '0.9rem', marginBottom: 24 }}>Sign in to continue shopping</p>

                {field('Email', 'email', 'email', loginData, setLoginData, 'your@email.com')}
                {field('Password', 'password', 'password', loginData, setLoginData, 'Min 6 characters')}

                <div className="form-group">
                  <label>Login as</label>
                  <select className="form-input" value={loginData.role} onChange={e => setLoginData(p => ({ ...p, role: e.target.value }))}>
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 8, borderRadius: 25 }} disabled={loading}>
                  {loading ? 'Signing in...' : 'SIGN IN'}
                </button>

                <p style={{ marginTop: 18, textAlign: 'center', fontSize: '0.88rem', color: '#666' }}>
                  New here?{' '}
                  <span onClick={() => { setMode('register'); setErrors({}) }} style={{ color: '#667eea', fontWeight: 600, cursor: 'pointer' }}>
                    Create an account
                  </span>
                </p>
              </form>
            ) : (
              <form onSubmit={handleRegister} noValidate>
                <h2 style={{ fontSize: '1.7rem', marginBottom: 6, color: '#222' }}>Create account</h2>
                <p style={{ color: '#888', fontSize: '0.9rem', marginBottom: 24 }}>Join ShopEase in seconds</p>

                {field('Full Name', 'name', 'text', regData, setRegData, 'Your full name')}
                {field('Email', 'email', 'email', regData, setRegData, 'your@email.com')}
                {field('Mobile Number', 'mobile', 'tel', regData, setRegData, '10-digit mobile')}
                {field('Password', 'password', 'password', regData, setRegData, 'Min 6 characters')}

                <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 8, borderRadius: 25 }} disabled={loading}>
                  {loading ? 'Creating account...' : 'REGISTER'}
                </button>

                <p style={{ marginTop: 18, textAlign: 'center', fontSize: '0.88rem', color: '#666' }}>
                  Already have an account?{' '}
                  <span onClick={() => { setMode('login'); setErrors({}) }} style={{ color: '#667eea', fontWeight: 600, cursor: 'pointer' }}>
                    Sign in
                  </span>
                </p>
              </form>
            )}
          </div>

          {/* ── Right: Banner ── */}
          <div style={{ width: '45%', background: 'linear-gradient(135deg,#667eea,#764ba2)', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 30px', textAlign: 'center' }}>
            <img src="/logo.png" alt="ShopEase" style={{ width: 120, height: 120, objectFit: 'contain', background: '#fff', borderRadius: '50%', padding: 20, boxShadow: '0 10px 30px rgba(0,0,0,0.2)', marginBottom: 28 }} onError={e => { e.target.style.fontSize = '4rem'; e.target.src = '' }} />
            <h3 style={{ fontSize: '1.5rem', marginBottom: 10 }}>Shop smarter</h3>
            <p style={{ opacity: 0.9, lineHeight: 1.6, fontSize: '0.93rem' }}>
              <b><i>Shop Smart, Shop Easy, Shop Online.</i></b>
              <br /><br />
              Discover thousands of products at unbeatable prices.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
