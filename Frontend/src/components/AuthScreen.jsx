import { useState } from 'react'
import styles from './AuthScreen.module.css'
import { authApi } from '../api/services'
import HelpLink from './HelpLink'

/*
 * modes:
 *   'login'        – email + password
 *   'register'     – name + email + password
 *   'otp'          – 6-digit OTP (reached after login OR register)
 *   'forgot'       – enter email to receive reset link
 *   'forgot-sent'  – confirmation screen
 */

export default function AuthScreen({ onLogin }) {
  const [mode,    setMode]    = useState('login')
  const [email,   setEmail]   = useState('')
  const [pass,    setPass]    = useState('')
  const [name,    setName]    = useState('')
  const [otp,     setOtp]     = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [info,    setInfo]    = useState('')

  const barHeights = [40,70,55,85,60,90,50,75,65,95,48,80]
  const barColors  = [
    'var(--accent)','var(--blue)','var(--accent)','var(--amber)',
    'var(--accent)','var(--accent)','var(--blue)','var(--amber)',
    'var(--accent)','var(--accent)','var(--blue)','var(--teal)',
  ]

  const reset = (nextMode) => {
    setMode(nextMode)
    setError('')
    setInfo('')
    setOtp('')
  }

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setError('')
    setInfo('')
    setLoading(true)
    try {
      if (mode === 'login') {
        // Step 1: verify password → backend sends OTP if correct
        await authApi.login(email, pass)
        setMode('otp')
        setInfo('A 6-digit OTP has been sent to ' + email)

      } else if (mode === 'register') {
        // Step 1: create account → backend sends OTP
        await authApi.register(name, email, pass)
        setMode('otp')
        setInfo('A 6-digit OTP has been sent to ' + email)

      } else if (mode === 'otp') {
        // Step 2: verify OTP → get JWT → log in
        const res = await authApi.verifyOtp(email, otp)
        localStorage.setItem('finio_token', res.token)
        onLogin(res.name, res.email)

      } else if (mode === 'forgot') {
        await authApi.forgotPassword(email)
        setMode('forgot-sent')
      }
    } catch (e) {
      const msg = e.message || 'Something went wrong. Please try again.'
      // Unverified account tried to log in — backend resends OTP, take them to verify screen
      if (msg.toLowerCase().includes('verify your email')) {
        setMode('otp')
        setInfo('Your account isn\'t verified yet. A new code has been sent to ' + email)
      } else {
        setError(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleResendOtp = async () => {
    setError('')
    setLoading(true)
    try {
      await authApi.resendOtp(email)
      setInfo('New OTP sent to ' + email)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  // ── Titles / subtitles ──────────────────────────────────────────────────────
  const titles = {
    'login':       'Welcome back',
    'register':    'Create account',
    'otp':         'Verify your identity',
    'forgot':      'Forgot password?',
    'forgot-sent': 'Check your inbox',
  }
  const subtitles = {
    'login':       'Sign in to your Finio dashboard',
    'register':    'Start tracking your finances today',
    'otp':         `Enter the 6-digit code sent to ${email}`,
    'forgot':      'We\'ll send a reset link to your Gmail',
    'forgot-sent': `A password reset link was sent to ${email}`,
  }
  const btnLabels = {
    'login':    'Sign In',
    'register': 'Create Account',
    'otp':      'Verify & Continue',
    'forgot':   'Send Reset Link',
  }

  return (
    <div className={styles.authWrap}>
      {/* ── Hero panel ───────────────────────────────────────────────────── */}
      <div className={styles.authHero}>
        <div className={styles.heroOrb1} />
        <div className={styles.heroOrb2} />
        <div className={styles.heroBrand}>fin<span>io</span></div>
        <div className={styles.heroContent}>
          <div className={styles.heroTag}>Smart Finance Tracker</div>
          <h1 className={styles.heroHeadline}>Know every<br />rupee you<br /><em>own.</em></h1>
          <p className={styles.heroSub}>
            Track income, expenses, budgets, savings goals, investments
            and bills — all in one beautifully designed dashboard.
          </p>
          <div className={styles.heroChart}>
            {barHeights.map((h, i) => (
              <div key={i} className={styles.heroBar} style={{
                height: h + '%', background: barColors[i],
                animationDelay: i * 0.04 + 's', opacity: 0.55 + (h / 100) * 0.45,
              }} />
            ))}
          </div>
          <div className={styles.heroStats}>
            <div><div className={styles.heroStatVal}>₹12L+</div><div className={styles.heroStatLabel}>avg. tracked / user</div></div>
            <div><div className={styles.heroStatVal}>6</div><div className={styles.heroStatLabel}>finance modules</div></div>
            <div><div className={styles.heroStatVal}>100%</div><div className={styles.heroStatLabel}>private & secure</div></div>
          </div>
        </div>
        <div className={styles.heroFooter}>© 2026 Finio — Your Personal Finance Assistant</div>
      </div>

      {/* ── Auth panel ───────────────────────────────────────────────────── */}
      <div className={styles.authPanel}>
        <h2 className={styles.authTitle}>{titles[mode]}</h2>
        <p className={styles.authSubtitle}>{subtitles[mode]}</p>

        <div className={styles.authForm}>

          {/* ── forgot-sent success state ─────────────────────────────── */}
          {mode === 'forgot-sent' && (
            <div className={styles.successBox}>
              <div className={styles.successIcon}>✉️</div>
              <p>
                If <strong>{email}</strong> is registered with Finio,
                a password-reset link has been sent to your Gmail inbox.
              </p>
              <p style={{ color: 'var(--muted)', fontSize: '0.82rem', marginTop: 8 }}>
                The link expires in 30 minutes. Check your spam folder if you don't see it.
              </p>
            </div>
          )}

          {/* ── register: full name ───────────────────────────────────── */}
          {mode === 'register' && (
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-input" placeholder="Rahul Sharma"
                value={name} onChange={e => setName(e.target.value)} />
            </div>
          )}

          {/* ── email field ───────────────────────────────────────────── */}
          {['login', 'register', 'forgot'].includes(mode) && (
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" placeholder="rahul@example.com"
                value={email} onChange={e => setEmail(e.target.value)} />
            </div>
          )}

          {/* ── password field ────────────────────────────────────────── */}
          {['login', 'register'].includes(mode) && (
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-input" type="password" placeholder="••••••••"
                value={pass} onChange={e => setPass(e.target.value)} />
            </div>
          )}

          {/* ── forgot password link ──────────────────────────────────── */}
          {mode === 'login' && (
            <div style={{ textAlign: 'right', marginTop: -4, marginBottom: 8 }}>
              <span
                onClick={() => reset('forgot')}
                style={{ fontSize: '0.82rem', color: 'var(--accent)', cursor: 'pointer' }}>
                Forgot password?
              </span>
            </div>
          )}

          {/* ── OTP input ─────────────────────────────────────────────── */}
          {mode === 'otp' && (
            <>
              <div className={styles.otpHint}>
                <span>📧</span> Code sent to <strong>{email}</strong>
              </div>
              <div className="form-group">
                <label className="form-label">OTP Code</label>
                <input
                  className="form-input"
                  type="text"
                  inputMode="numeric"
                  placeholder="123456"
                  maxLength={6}
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                  style={{ letterSpacing: '0.3em', fontSize: '1.4rem', textAlign: 'center' }}
                  autoFocus
                />
              </div>
            </>
          )}

          {/* ── Error / info messages ─────────────────────────────────── */}
          {error && <div className={styles.authError}>{error}</div>}
          {info  && (
            <div style={{ color: 'var(--accent)', fontSize: '0.85rem', marginBottom: 8 }}>
              {info}
            </div>
          )}

          {/* ── Primary action button ─────────────────────────────────── */}
          {mode !== 'forgot-sent' && (
            <button
              className="btn-primary"
              style={{ marginTop: 8 }}
              disabled={loading}
              onClick={handleSubmit}>
              {loading ? 'Please wait…' : btnLabels[mode]}
            </button>
          )}

          {/* ── Resend OTP ────────────────────────────────────────────── */}
          {mode === 'otp' && (
            <button
              onClick={handleResendOtp}
              disabled={loading}
              style={{
                marginTop: 10, background: 'none', border: 'none',
                color: 'var(--accent)', cursor: 'pointer', fontSize: '0.85rem',
              }}>
              Didn't receive it? Resend OTP
            </button>
          )}

          <div className="divider">or</div>

          {/* ── Bottom navigation links ───────────────────────────────── */}
          <div className={styles.authLink}>
            {mode === 'login' && (
              <>Don't have an account?{' '}
                <span onClick={() => reset('register')}>Sign up free</span>
              </>
            )}
            {mode === 'register' && (
              <>Already have an account?{' '}
                <span onClick={() => reset('login')}>Sign in</span>
              </>
            )}
            {mode === 'otp' && (
              <>Wrong account?{' '}
                <span onClick={() => reset('login')}>Start over</span>
              </>
            )}
            {(mode === 'forgot' || mode === 'forgot-sent') && (
              <>Remembered it?{' '}
                <span onClick={() => reset('login')}>Back to sign in</span>
              </>
            )}
          </div>

        </div>

        {/* Help Centre link */}
        <HelpLink variant="auth" />
      </div>
    </div>
  )
}