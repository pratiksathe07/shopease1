// src/pages/ProfilePage.jsx
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/Toast'
import { updateProfile, changePassword } from '../services/authService'

export default function ProfilePage() {
  const { user, updateUser, logout } = useAuth()
  const toast = useToast()

  const [tab, setTab] = useState('profile') // 'profile' | 'password'
  const [saving, setSaving] = useState(false)

  const [profile, setProfile] = useState({ name: user?.name || '', mobile: user?.mobile || '' })
  const [pwds,    setPwds]    = useState({ currentPassword: '', newPassword: '' })

  async function handleSaveProfile(e) {
    e.preventDefault()
    if (!profile.name.trim()) return toast.error('Name is required')
    setSaving(true)
    try {
      const res = await updateProfile(profile)
      updateUser(res.data.data)
      toast.success('Profile updated!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed')
    } finally { setSaving(false) }
  }

  async function handleChangePassword(e) {
    e.preventDefault()
    if (pwds.newPassword.length < 6) return toast.error('New password must be at least 6 characters')
    setSaving(true)
    try {
      await changePassword(pwds)
      setPwds({ currentPassword: '', newPassword: '' })
      toast.success('Password changed! Please login again.')
      logout()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Password change failed')
    } finally { setSaving(false) }
  }

  const TAB_STYLE = (active) => ({
    padding: '10px 22px', borderRadius: 25, border: 'none', cursor: 'pointer',
    background: active ? 'linear-gradient(135deg,#667eea,#764ba2)' : '#f0f0f0',
    color: active ? '#fff' : '#555',
    fontWeight: 600, fontSize: '0.9rem', fontFamily: 'inherit',
  })

  return (
    <div style={{ paddingBottom: 60 }}>
      <div className="page-header"><h1>👤 My Profile</h1></div>
      <div className="container" style={{ maxWidth: 700 }}>

        {/* Avatar card */}
        <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', padding: 28, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 24 }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg,#667eea,#764ba2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.2rem', color: '#fff', fontWeight: 700, flexShrink: 0 }}>
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: '1.3rem', fontWeight: 700 }}>{user?.name}</div>
            <div style={{ color: '#888', marginTop: 4 }}>{user?.email}</div>
            <div style={{ display: 'inline-block', padding: '4px 12px', borderRadius: 20, background: user?.role === 'admin' ? '#fff3e0' : '#e0f7fa', color: user?.role === 'admin' ? '#e65100' : '#006064', fontSize: '0.78rem', fontWeight: 600, marginTop: 8, textTransform: 'capitalize' }}>
              {user?.role}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
          <button style={TAB_STYLE(tab === 'profile')}  onClick={() => setTab('profile')}>Edit Profile</button>
          <button style={TAB_STYLE(tab === 'password')} onClick={() => setTab('password')}>Change Password</button>
        </div>

        <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', padding: 28 }}>
          {tab === 'profile' ? (
            <form onSubmit={handleSaveProfile}>
              <h2 style={{ fontSize: '1.1rem', marginBottom: 20 }}>Personal Information</h2>
              <div className="form-group">
                <label>Full Name</label>
                <input className="form-input" value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} placeholder="Full Name" />
              </div>
              <div className="form-group">
                <label>Email <span style={{ color: '#999', fontSize: '0.8rem' }}>(cannot be changed)</span></label>
                <input className="form-input" value={user?.email || ''} disabled style={{ background: '#f5f5f5', cursor: 'not-allowed' }} />
              </div>
              <div className="form-group">
                <label>Mobile Number</label>
                <input className="form-input" value={profile.mobile} onChange={e => setProfile(p => ({ ...p, mobile: e.target.value }))} placeholder="Mobile Number" maxLength={10} />
              </div>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
            </form>
          ) : (
            <form onSubmit={handleChangePassword}>
              <h2 style={{ fontSize: '1.1rem', marginBottom: 20 }}>Security</h2>
              <div className="form-group">
                <label>Current Password</label>
                <input type="password" className="form-input" value={pwds.currentPassword} onChange={e => setPwds(p => ({ ...p, currentPassword: e.target.value }))} placeholder="Current password" />
              </div>
              <div className="form-group">
                <label>New Password</label>
                <input type="password" className="form-input" value={pwds.newPassword} onChange={e => setPwds(p => ({ ...p, newPassword: e.target.value }))} placeholder="Min 6 characters" />
              </div>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Changing...' : 'Change Password'}</button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
