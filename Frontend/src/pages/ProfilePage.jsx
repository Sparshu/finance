import { useState } from 'react'
import { userApi } from '../api/services'
import { useToast } from '../components/Toast'

export default function ProfilePage({ user, onProfileUpdated, onLogout }) {
  const toast = useToast()

  // Profile form
  const [name,       setName]       = useState(user.name || '')
  const [profSaving, setProfSaving] = useState(false)

  // Password form
  const [oldPass,   setOldPass]   = useState('')
  const [newPass,   setNewPass]   = useState('')
  const [confPass,  setConfPass]  = useState('')
  const [pwSaving,  setPwSaving]  = useState(false)

  const initials = (user.name || 'U')
    .split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

  const handleSaveProfile = async () => {
    if (!name.trim()) return toast.error('Name cannot be empty')
    if (name.trim() === user.name) return toast.info('No changes to save')
    setProfSaving(true)
    try {
      const res = await userApi.updateProfile(name.trim())
      // res contains the updated token + name — update everything
      localStorage.setItem('finio_token', res.token)
      localStorage.setItem('finio_user', JSON.stringify({ name: res.name, email: res.email }))
      onProfileUpdated({ name: res.name, email: res.email })
      toast.success('Name updated!')
    } catch (e) {
      toast.error(e.message || 'Failed to update profile')
    } finally {
      setProfSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (!oldPass || !newPass)       return toast.error('Fill in all password fields')
    if (newPass !== confPass)        return toast.error('New passwords do not match')
    if (newPass.length < 6)         return toast.error('Password must be at least 6 characters')
    if (newPass === oldPass)        return toast.error('New password must differ from current')
    setPwSaving(true)
    try {
      await userApi.changePassword(oldPass, newPass)
      setOldPass(''); setNewPass(''); setConfPass('')
      toast.success('Password changed successfully!')
    } catch (e) {
      toast.error(e.message || 'Failed to change password')
    } finally {
      setPwSaving(false)
    }
  }

  const pwStrength = (() => {
    if (!newPass) return []
    return [
      { label: 'Min 6 chars',  ok: newPass.length >= 6 },
      { label: 'Passwords match', ok: newPass === confPass && confPass.length > 0 },
    ]
  })()

  return (
    <div className="page-anim" style={{ maxWidth: 640 }}>

      {/* Avatar + info */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 28 }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'var(--accent-soft)', border: '2px solid var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--sans)', fontWeight: 700, fontSize: 22, color: 'var(--accent)',
            flexShrink: 0,
          }}>{initials}</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 18, fontFamily: 'var(--sans)', marginBottom: 2 }}>
              {user.name || 'User'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text2)', fontFamily: 'var(--mono)' }}>
              {user.email}
            </div>
            <div style={{ marginTop: 8 }}>
              <span className="badge badge-green">Active</span>
            </div>
          </div>
        </div>

        <div className="section-title" style={{ marginBottom: 16 }}>Edit Profile</div>

        <div className="form-group">
          <label className="form-label">Full Name</label>
          <input
            className="form-input"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Your name"
            onKeyDown={e => e.key === 'Enter' && handleSaveProfile()}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Email</label>
          <input
            className="form-input"
            value={user.email}
            disabled
            style={{ opacity: 0.45, cursor: 'not-allowed' }}
          />
          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 6, fontFamily: 'var(--mono)' }}>
            Email address cannot be changed
          </div>
        </div>

        <button
          className="btn-primary"
          onClick={handleSaveProfile}
          disabled={profSaving}
          style={{ width: 'auto', padding: '10px 28px', fontSize: 13 }}
        >
          {profSaving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>

      {/* Change password */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="section-title" style={{ marginBottom: 16 }}>Change Password</div>

        <div className="form-group">
          <label className="form-label">Current Password</label>
          <input
            className="form-input" type="password"
            value={oldPass} onChange={e => setOldPass(e.target.value)}
            placeholder="••••••••"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">New Password</label>
            <input
              className="form-input" type="password"
              value={newPass} onChange={e => setNewPass(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <input
              className="form-input" type="password"
              value={confPass} onChange={e => setConfPass(e.target.value)}
              placeholder="••••••••"
              onKeyDown={e => e.key === 'Enter' && handleChangePassword()}
            />
          </div>
        </div>

        {newPass && (
          <div style={{ display: 'flex', gap: 16, marginBottom: 14 }}>
            {pwStrength.map((c, i) => (
              <span key={i} style={{ fontSize: 11, fontFamily: 'var(--mono)', color: c.ok ? 'var(--accent)' : 'var(--text3)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 14 }}>{c.ok ? '✓' : '○'}</span> {c.label}
              </span>
            ))}
          </div>
        )}

        <button
          className="btn-primary"
          onClick={handleChangePassword}
          disabled={pwSaving}
          style={{ width: 'auto', padding: '10px 28px', fontSize: 13 }}
        >
          {pwSaving ? 'Updating…' : 'Update Password'}
        </button>
      </div>

      {/* Preferences (display only) */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="section-title" style={{ marginBottom: 16 }}>Preferences</div>
        {[
          { label: 'Currency',     value: '₹ Indian Rupee (INR)' },
          { label: 'Date Format',  value: 'YYYY-MM-DD' },
          { label: 'Language',     value: 'English' },
        ].map((p, i) => (
          <div key={i} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '12px 0', borderBottom: i < 2 ? '1px solid var(--border)' : 'none'
          }}>
            <span style={{ fontSize: 13, color: 'var(--text2)' }}>{p.label}</span>
            <span style={{ fontSize: 13, fontFamily: 'var(--mono)' }}>{p.value}</span>
          </div>
        ))}
      </div>

      {/* Sign out */}
      <div className="card" style={{ borderTop: '2px solid var(--red)' }}>
        <div className="section-title" style={{ marginBottom: 6, color: 'var(--red)' }}>Account</div>
        <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 16 }}>
          Sign out of Finio on this device.
        </div>
        <button
          onClick={onLogout}
          style={{
            background: 'var(--red-soft)', border: '1px solid var(--red)',
            color: 'var(--red)', borderRadius: 10, padding: '10px 24px',
            fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--sans)',
          }}
        >
          Sign Out
        </button>
      </div>
    </div>
  )
}