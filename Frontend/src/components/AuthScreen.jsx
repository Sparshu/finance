import { useState } from 'react'
import styles from './AuthScreen.module.css'

export default function AuthScreen({ onLogin }) {
  const [mode, setMode]     = useState('login')
  const [email, setEmail]   = useState('')
  const [pass, setPass]     = useState('')
  const [name, setName]     = useState('')

  const barHeights = [40,70,55,85,60,90,50,75,65,95,48,80]
  const barColors  = [
    'var(--green)','var(--blue)','var(--green)','var(--amber)',
    'var(--green)','var(--green)','var(--blue)','var(--amber)',
    'var(--green)','var(--green)','var(--blue)','var(--green)',
  ]

  return (
    <div className={styles.authWrap}>
      {/* ── Hero panel ── */}
      <div className={styles.authHero}>
        <div className={styles.heroGrid} />
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
                  opacity: 0.6 + (h / 100) * 0.4,
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

        <div className={styles.heroFooter}>© 2024 Finio — Built with Spring Boot + React</div>
      </div>

      {/* ── Auth panel ── */}
      <div className={styles.authPanel}>
        <h2 className={styles.authTitle}>
          {mode === 'login' ? 'Welcome back' : 'Create account'}
        </h2>
        <p className={styles.authSubtitle}>
          {mode === 'login'
            ? 'Sign in to your Finio dashboard'
            : 'Start tracking your finances today'}
        </p>

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

        {mode === 'login' && (
          <div style={{ textAlign: 'right', marginBottom: 20 }}>
            <a className={styles.forgotLink}>Forgot password?</a>
          </div>
        )}

        <button
          className="btn-primary"
          onClick={() => onLogin(name || 'Rahul Sharma', email || 'rahul@example.com')}
        >
          {mode === 'login' ? 'Sign In →' : 'Create Account →'}
        </button>

        <div className={styles.divider}>or</div>

        <div className={styles.authSwitch}>
          {mode === 'login' ? (
            <>Don't have an account? <a onClick={() => setMode('register')}>Sign up free</a></>
          ) : (
            <>Already have an account? <a onClick={() => setMode('login')}>Sign in</a></>
          )}
        </div>
      </div>
    </div>
  )
}
