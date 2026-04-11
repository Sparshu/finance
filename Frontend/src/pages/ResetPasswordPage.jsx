import { useState, useEffect } from 'react'
import { authApi } from '../api/services'
import styles from './ResetPasswordPage.module.css'

/**
 * ResetPasswordPage
 *
 * Rendered at the route: /reset-password?token=<uuid>
 * The App.jsx should check window.location for this route and render this page
 * instead of AuthScreen when the token param is present.
 *
 * Usage in App.jsx:
 *   const params = new URLSearchParams(window.location.search)
 *   const resetToken = params.get('token')
 *   if (window.location.pathname === '/reset-password' && resetToken) {
 *     return <ResetPasswordPage token={resetToken} onDone={() => navigate('/')} />
 *   }
 */
export default function ResetPasswordPage({ token, onDone }) {
  const [pass,    setPass]    = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [success, setSuccess] = useState(false)

  // Validate token presence
  useEffect(() => {
    if (!token) setError('Invalid or missing reset token.')
  }, [token])

  const handleReset = async () => {
    setError('')
    if (!pass || pass.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (pass !== confirm) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    try {
      await authApi.resetPassword(token, pass)
      setSuccess(true)
    } catch (e) {
      setError(e.message || 'Failed to reset password. The link may have expired.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        {/* Brand */}
        <div className={styles.brand}>fin<span>io</span></div>

        {success ? (
          /* ── Success state ── */
          <div className={styles.successBox}>
            <div className={styles.successIcon}>✅</div>
            <h2>Password reset!</h2>
            <p>Your password has been updated successfully. You can now sign in with your new password.</p>
            <button className={styles.btn} onClick={onDone}>
              Go to Sign In
            </button>
          </div>
        ) : (
          /* ── Form state ── */
          <>
            <h2 className={styles.title}>Set new password</h2>
            <p className={styles.subtitle}>Enter a new password for your Finio account.</p>

            <div className={styles.form}>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input
                  className="form-input"
                  type="password"
                  placeholder="At least 6 characters"
                  value={pass}
                  onChange={e => setPass(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <input
                  className="form-input"
                  type="password"
                  placeholder="Repeat your new password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleReset()}
                />
              </div>

              {error && <div className={styles.error}>{error}</div>}

              <button
                className={styles.btn}
                disabled={loading || !token}
                onClick={handleReset}>
                {loading ? 'Updating…' : 'Reset Password'}
              </button>

              <div className={styles.backLink}>
                <span onClick={onDone}>← Back to sign in</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}