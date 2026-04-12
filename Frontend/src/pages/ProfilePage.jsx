import { useState, useRef, useCallback } from 'react'
import { userApi } from '../api/services'
import { useToast } from '../components/Toast'
import styles from './ProfilePage.module.css'
import HelpLink from '../components/HelpLink'

function CameraIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
      <circle cx="12" cy="13" r="4"/>
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
    </svg>
  )
}

function cropAndResize(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const size = Math.min(img.width, img.height)
        const sx = (img.width  - size) / 2
        const sy = (img.height - size) / 2
        const canvas = document.createElement('canvas')
        canvas.width  = 200
        canvas.height = 200
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, sx, sy, size, size, 0, 0, 200, 200)
        resolve(canvas.toDataURL('image/jpeg', 0.85))
      }
      img.onerror = reject
      img.src = e.target.result
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function ProfilePage({ user, avatar, onAvatarChange, onProfileUpdated, onLogout }) {
  const toast = useToast()
  const fileInputRef = useRef(null)

  const [name,       setName]       = useState(user.name || '')
  const [profSaving, setProfSaving] = useState(false)
  const [oldPass,   setOldPass]   = useState('')
  const [newPass,   setNewPass]   = useState('')
  const [confPass,  setConfPass]  = useState('')
  const [pwSaving,  setPwSaving]  = useState(false)
  const [avatarLoading, setAvatarLoading] = useState(false)
  const [dragOver,      setDragOver]      = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)

  const initials = (user.name || 'U')
    .split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

  const processImage = useCallback(async (file) => {
    if (!file) return
    if (!file.type.startsWith('image/')) return toast.error('Please select an image file')
    if (file.size > 5 * 1024 * 1024)    return toast.error('Image must be under 5 MB')
    setAvatarLoading(true)
    try {
      const dataUrl = await cropAndResize(file)
      localStorage.setItem('finio_avatar', dataUrl)
      onAvatarChange(dataUrl)
      toast.success('Profile photo updated!')
    } catch {
      toast.error('Failed to process image')
    } finally {
      setAvatarLoading(false)
    }
  }, [onAvatarChange, toast])

  const handleFileChange = (e) => { processImage(e.target.files?.[0]); e.target.value = '' }

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false)
    processImage(e.dataTransfer.files?.[0])
  }

  const handleRemoveAvatar = () => {
    localStorage.removeItem('finio_avatar')
    onAvatarChange(null)
    toast.info('Profile photo removed')
  }

  const handleSaveProfile = async () => {
    if (!name.trim())            return toast.error('Name cannot be empty')
    if (name.trim() === user.name) return toast.info('No changes to save')
    setProfSaving(true)
    try {
      const res = await userApi.updateProfile(name.trim())
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
    if (!oldPass || !newPass) return toast.error('Fill in all password fields')
    if (newPass !== confPass)  return toast.error('New passwords do not match')
    if (newPass.length < 6)   return toast.error('Password must be at least 6 characters')
    if (newPass === oldPass)  return toast.error('New password must differ from current')
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

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'delete') return toast.error('Please type "delete" to confirm')
    setDeleteLoading(true)
    try {
      await userApi.deleteAccount()
      localStorage.clear()
      onLogout()
    } catch (e) {
      toast.error(e.message || 'Failed to delete account')
      setDeleteLoading(false)
    }
  }

  const pwStrength = newPass ? [
    { label: 'Min 6 chars',     ok: newPass.length >= 6 },
    { label: 'Passwords match', ok: newPass === confPass && confPass.length > 0 },
  ] : []

  return (
    <div className="page-anim" style={{ maxWidth: 640 }}>

      {/* Avatar + profile */}
      <div className="card" style={{ marginBottom: 16 }}>

        <div className={styles.avatarSection}>
          {/* Clickable / droppable avatar */}
          <div
            className={`${styles.avatarWrap} ${dragOver ? styles.dragOver : ''}`}
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            title="Click or drag to change photo"
          >
            {avatarLoading ? (
              <div className={styles.spinner} />
            ) : avatar ? (
              <img src={avatar} alt="Profile" className={styles.avatarImg} />
            ) : (
              <div className={styles.avatarInitials}>{initials}</div>
            )}
            <div className={styles.avatarOverlay}>
              <CameraIcon />
              <span>{avatar ? 'Change' : 'Upload'}</span>
            </div>
          </div>

          <div className={styles.avatarMeta}>
            <div className={styles.metaName}>{user.name || 'User'}</div>
            <div className={styles.metaEmail}>{user.email}</div>
            <div style={{ marginTop: 6, display: 'flex', gap: 8, alignItems: 'center' }}>
              <span className="badge badge-green">Active</span>
              {avatar && (
                <button className={styles.removeBtn} onClick={handleRemoveAvatar}>
                  <TrashIcon /> Remove photo
                </button>
              )}
            </div>
            <div className={styles.uploadHint}>
              Click photo or drag an image · Max 5 MB · Auto-cropped to square
            </div>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />

        <div className="section-title" style={{ marginBottom: 16, marginTop: 24 }}>Edit Profile</div>

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
          <input className="form-input" type="password" value={oldPass} onChange={e => setOldPass(e.target.value)} placeholder="••••••••" />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">New Password</label>
            <input className="form-input" type="password" value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="••••••••" />
          </div>
          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <input className="form-input" type="password" value={confPass} onChange={e => setConfPass(e.target.value)} placeholder="••••••••" onKeyDown={e => e.key === 'Enter' && handleChangePassword()} />
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

        <button className="btn-primary" onClick={handleChangePassword} disabled={pwSaving} style={{ width: 'auto', padding: '10px 28px', fontSize: 13 }}>
          {pwSaving ? 'Updating…' : 'Update Password'}
        </button>
      </div>

      {/* Preferences */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="section-title" style={{ marginBottom: 16 }}>Preferences</div>
        {[
          { label: 'Currency',    value: '₹ Indian Rupee (INR)' },
          { label: 'Date Format', value: 'YYYY-MM-DD' },
          { label: 'Language',    value: 'English' },
        ].map((p, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: i < 2 ? '1px solid var(--border)' : 'none' }}>
            <span style={{ fontSize: 13, color: 'var(--text2)' }}>{p.label}</span>
            <span style={{ fontSize: 13, fontFamily: 'var(--mono)' }}>{p.value}</span>
          </div>
        ))}
      </div>

      {/* Help Centre */}
      <HelpLink variant="profile" />

      {/* Delete Account */}
      <div className="card" style={{ marginBottom: 16, borderTop: '2px solid var(--red)' }}>
        <div className="section-title" style={{ marginBottom: 6, color: 'var(--red)' }}>Delete Account</div>
        <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 16, lineHeight: 1.5 }}>
          This action is <strong>permanent and irreversible</strong>. All your data — transactions, budgets, investments, goals, and bills — will be deleted immediately.
        </div>
        <div className="form-group" style={{ marginBottom: 12 }}>
          <label className="form-label" style={{ color: 'var(--red)' }}>
            Type <code style={{ background: 'var(--red-soft)', padding: '1px 6px', borderRadius: 4, fontFamily: 'var(--mono)' }}>delete</code> to confirm
          </label>
          <input
            className="form-input"
            value={deleteConfirm}
            onChange={e => setDeleteConfirm(e.target.value)}
            placeholder="delete"
            style={{ borderColor: deleteConfirm === 'delete' ? 'var(--red)' : undefined }}
            onKeyDown={e => e.key === 'Enter' && handleDeleteAccount()}
          />
        </div>
        <button
          onClick={handleDeleteAccount}
          disabled={deleteLoading || deleteConfirm !== 'delete'}
          style={{
            background: deleteConfirm === 'delete' ? 'var(--red)' : 'var(--red-soft)',
            border: '1px solid var(--red)',
            color: deleteConfirm === 'delete' ? '#fff' : 'var(--red)',
            borderRadius: 10,
            padding: '10px 24px',
            fontSize: 13,
            fontWeight: 600,
            cursor: deleteConfirm === 'delete' ? 'pointer' : 'not-allowed',
            fontFamily: 'var(--sans)',
            opacity: deleteLoading ? 0.6 : 1,
            transition: 'background 0.2s, color 0.2s',
          }}
        >
          {deleteLoading ? 'Deleting…' : 'Delete My Account'}
        </button>
      </div>

      {/* Sign out */}
      <div className="card" style={{ borderTop: '2px solid var(--red)' }}>
        <div className="section-title" style={{ marginBottom: 6, color: 'var(--red)' }}>Account</div>
        <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 16 }}>Sign out of Finio on this device.</div>
        <button onClick={onLogout} style={{ background: 'var(--red-soft)', border: '1px solid var(--red)', color: 'var(--red)', borderRadius: 10, padding: '10px 24px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--sans)' }}>
          Sign Out
        </button>
      </div>
    </div>
  )
}