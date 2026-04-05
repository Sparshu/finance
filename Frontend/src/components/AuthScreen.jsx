import { useState } from 'react'
import styles from './AuthScreen.module.css'
import { authApi } from '../api/services'

export default function AuthScreen({ onLogin }) {
  const [mode,    setMode]    = useState('login')
  const [email,   setEmail]   = useState('')
  const [pass,    setPass]    = useState('')
  const [name,    setName]    = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const barHeights = [40,70,55,85,60,90,50,75,65,95,48,80]
  const barColors  = [
    'var(--accent)','var(--blue)','var(--accent)','var(--amber)',
    'var(--accent)','var(--accent)','var(--blue)','var(--amber)',
    'var(--accent)','var(--accent)','var(--blue)','var(--teal)',
  ]

  return (
    <div className={styles.authWrap}>
      {/* Hero panel */}
      <div className={styles.authHero}>
        <div className={styles.heroOrb1} />
        <div className={styles.heroOrb2} />
        <div className={styles.heroBrand}>fin<span>io</span></div>

        <div className={styles.heroContent}>
          <div className={styles.heroTag}>Smart Finance Tracker</div>
          <h1 className={styles.heroHeadline}>
            Know every<br />rupee you<br /><em>own.</em>
          </h1>
          <p className={styles.heroSub}>
            Track income, expenses, budgets, savings goals, investments
            and bills — all in one beautifully designed dashboard.
          </p>

          <div className={styles.heroChart}>
            {barHeights.map((h, i) => (
              <div
                key={i}
                className={styles.heroBar}
                style={{
                  height: h + '%',
                  background: barColors[i],
                  animationDelay: i * 0.04 + 's',
                  opacity: 0.55 + (h / 100) * 0.45,
                }}
              />
            ))}
          </div>

          <div className={styles.heroStats}>
            <div>
              <div className={styles.heroStatVal}>₹12L+</div>
              <div className={styles.heroStatLabel}>avg. tracked / user</div>
            </div>
            <div>
              <div className={styles.heroStatVal}>6</div>
              <div className={styles.heroStatLabel}>finance modules</div>
            </div>
            <div>
              <div className={styles.heroStatVal}>100%</div>
              <div className={styles.heroStatLabel}>private & secure</div>
            </div>
          </div>
        </div>

        <div className={styles.heroFooter}>© 2025 Finio — Your Personal Finance Assistant</div>
      </div>

      {/* Auth panel */}
      <div className={styles.authPanel}>
        <h2 className={styles.authTitle}>
          {mode === 'login' ? 'Welcome back' : 'Create account'}
        </h2>
        <p className={styles.authSubtitle}>
          {mode === 'login'
            ? 'Sign in to your Finio dashboard'
            : 'Start tracking your finances today'}
        </p>

        <div className={styles.authForm}>
          {mode === 'register' && (
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                className="form-input"
                placeholder="Rahul Sharma"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              className="form-input"
              type="email"
              placeholder="rahul@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              className="form-input"
              type="password"
              placeholder="••••••••"
              value={pass}
              onChange={e => setPass(e.target.value)}
            />
          </div>

          {error && (
            <div className={styles.authError}>{error}</div>
          )}

          <button
            className="btn-primary"
            style={{ marginTop: 8 }}
            disabled={loading}
            onClick={async () => {
              setError('')
              setLoading(true)
              try {
                let res
                if (mode === 'login') {
                  res = await authApi.login(email, pass)
                } else {
                  res = await authApi.register(name, email, pass)
                }
                localStorage.setItem('finio_token', res.token)
                onLogin(res.name, res.email)
              } catch (e) {
                setError(e.message || 'Authentication failed')
              } finally {
                setLoading(false)
              }
            }}
          >
            {loading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>

          <div className="divider">or</div>

          <div className={styles.authLink}>
            {mode === 'login' ? (
              <>Don't have an account? <span onClick={() => setMode('register')}>Sign up free</span></>
            ) : (
              <>Already have an account? <span onClick={() => setMode('login')}>Sign in</span></>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}