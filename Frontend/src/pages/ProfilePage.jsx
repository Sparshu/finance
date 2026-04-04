import { useState } from 'react'
import { useToast } from '../components/Toast'

export default function ProfilePage({ user, onLogout }) {
  const toast = useToast()
  const [name,    setName]    = useState(user.name || '')
  const [saving,  setSaving]  = useState(false)

  // Password change state
  const [oldPass,  setOldPass]  = useState('')
  const [newPass,  setNewPass]  = useState('')
  const [confPass, setConfPass] = useState('')
  const [pwSaving, setPwSaving] = useState(false)

  const handleSaveProfile = async () => {
    if (!name.trim()) return toast.error('Name cannot be empty')
    setSaving(true)
    // In a real app this would call PATCH /api/users/me — backend endpoint can be added later
    await new Promise(r => setTimeout(r, 600))
    toast.success('Profile updated!')
    setSaving(false)
  }

  const handleChangePassword = async () => {
    if (!oldPass || !newPass) return toast.error('Fill in all password fields')
    if (newPass !== confPass)  return toast.error('New passwords do not match')
    if (newPass.length < 6)    return toast.error('Password must be at least 6 characters')
    setPwSaving(true)
    await new Promise(r => setTimeout(r, 600))
    toast.success('Password changed!')
    setOldPass(''); setNewPass(''); setConfPass('')
    setPwSaving(false)
  }

  const initials = (user.name || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div className="page-anim" style={{ maxWidth: 640 }}>
      {/* Avatar + basic info */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'var(--green-bg)',
            border: '2px solid var(--green)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--display)', fontWeight: 700,
            fontSize: 22, color: 'var(--green)',
            flexShrink: 0,
          }}>{initials}</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 18, fontFamily: 'var(--display)', marginBottom: 2 }}>{user.name || 'User'}</div>
            <div style={{ fontSize: 12, color: 'var(--text2)', fontFamily: 'var(--mono)' }}>{user.email}</div>
            <div style={{ marginTop: 6 }}>
              <span className="badge badge-green">Active</span>
            </div>
          </div>
        </div>

        <div className="section-title" style={{ marginBottom: 16 }}>Edit Profile</div>
        <div className="form-group">
          <label className="form-label">Full Name</label>
          <input className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
        </div>
        <div className="form-group">
          <label className="form-label">Email</label>
          <input className="form-input" value={user.email} disabled
            style={{ opacity: 0.5, cursor: 'not-allowed' }} />
          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 6, fontFamily: 'var(--mono)' }}>
            Email cannot be changed
          </div>
        </div>
        <button className="btn-primary" onClick={handleSaveProfile} disabled={saving} style={{ width: 'auto', padding: '10px 24px', fontSize: 13 }}>
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>

      {/* Password */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="section-title" style={{ marginBottom: 16 }}>Change Password</div>
        <div className="form-group">
          <label className="form-label">Current Password</label>
          <input className="form-input" type="password" value={oldPass} onChange={e => setOldPass(e.target.value)} placeholder="••••••••" />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">New Password</label>
            <input className="form-input" type="password" value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="••••••••" />
          </div>
          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <input className="form-input" type="password" value={confPass} onChange={e => setConfPass(e.target.value)} placeholder="••••••••" />
          </div>
        </div>
        {newPass && (
          <div style={{ display: 'flex', gap: 6, marginBottom: 12, alignItems: 'center' }}>
            {[
              { label: 'Length', ok: newPass.length >= 6 },
              { label: 'Matches', ok: newPass === confPass && confPass },
            ].map((c, i) => (
              <span key={i} style={{ fontSize: 11, fontFamily: 'var(--mono)', color: c.ok ? 'var(--green)' : 'var(--text3)' }}>
                {c.ok ? '✓' : '○'} {c.label}
              </span>
            ))}
          </div>
        )}
        <button className="btn-primary" onClick={handleChangePassword} disabled={pwSaving} style={{ width: 'auto', padding: '10px 24px', fontSize: 13 }}>
          {pwSaving ? 'Updating…' : 'Update Password'}
        </button>
      </div>

      {/* Preferences */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="section-title" style={{ marginBottom: 16 }}>Preferences</div>
        {[
          { label: 'Currency', value: '₹ Indian Rupee (INR)' },
          { label: 'Date Format', value: 'DD/MM/YYYY' },
          { label: 'Language', value: 'English' },
        ].map((p, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontSize: 13, color: 'var(--text2)' }}>{p.label}</span>
            <span style={{ fontSize: 13, fontFamily: 'var(--mono)' }}>{p.value}</span>
          </div>
        ))}
      </div>

      {/* Danger zone */}
      <div className="card" style={{ borderColor: 'var(--red)', borderTop: '2px solid var(--red)' }}>
        <div className="section-title" style={{ marginBottom: 8, color: 'var(--red)' }}>Account</div>
        <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 16 }}>
          Sign out of your Finio account on this device.
        </div>
        <button
          onClick={onLogout}
          style={{
            background: 'var(--red-bg)', border: '1px solid var(--red)', color: 'var(--red)',
            borderRadius: 10, padding: '10px 24px', fontSize: 13, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'var(--display)',
          }}>
          Sign Out
        </button>
      </div>
    </div>
  )
}