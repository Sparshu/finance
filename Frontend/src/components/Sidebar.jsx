import { NAV } from '../data/sampleData'
import styles from './Sidebar.module.css'
import HelpLink from './HelpLink'

const EXTRA_NAV = [{ id: 'profile', label: 'Profile', icon: '◉' }]

export default function Sidebar({ active, setActive, user, avatar, onLogout, dark, onToggleTheme }) {
  const initials = (user.name || 'U')
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        fin<span>io</span>
      </div>

      <div className={styles.sectionLabel}>Navigation</div>

      {NAV.map(n => (
        <div
          key={n.id}
          className={`${styles.navItem} ${active === n.id ? styles.active : ''}`}
          onClick={() => setActive(n.id)}
        >
          <span className={styles.navIcon}>{n.icon}</span>
          {n.label}
        </div>
      ))}

      <div className={styles.sectionLabel} style={{ marginTop: 16 }}>Account</div>

      {EXTRA_NAV.map(n => (
        <div
          key={n.id}
          className={`${styles.navItem} ${active === n.id ? styles.active : ''}`}
          onClick={() => setActive(n.id)}
        >
          <span className={styles.navIcon}>{n.icon}</span>
          {n.label}
        </div>
      ))}

      {/* Help Centre */}
      <HelpLink variant="sidebar" />

      {/* Theme toggle */}
      <div style={{ padding: '8px 10px' }}>
        <div
          onClick={onToggleTheme}
          title={dark ? 'Switch to Light mode' : 'Switch to Dark mode'}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '9px 12px', borderRadius: 'var(--radius)',
            background: 'var(--bg3)', border: '1px solid var(--border2)',
            cursor: 'pointer', transition: 'background 0.15s',
            userSelect: 'none',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text2)', fontWeight: 500 }}>
            <span style={{ fontSize: 15 }}>{dark ? '☀️' : '🌙'}</span>
            {dark ? 'Light Mode' : 'Dark Mode'}
          </div>
          {/* Toggle pill */}
          <div style={{
            width: 36, height: 20, borderRadius: 100,
            background: dark ? 'var(--accent)' : 'var(--border3)',
            position: 'relative', transition: 'background 0.2s', flexShrink: 0,
          }}>
            <div style={{
              position: 'absolute', top: 2,
              left: dark ? 18 : 2,
              width: 16, height: 16, borderRadius: '50%',
              background: '#fff',
              boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
              transition: 'left 0.2s cubic-bezier(.34,1.56,.64,1)',
            }} />
          </div>
        </div>
      </div>

      <div className={styles.footer}>
        <div className={styles.userPill} onClick={() => setActive('profile')} style={{ cursor: 'pointer' }}>
          <div className={styles.avatar}>
            {avatar
              ? <img src={avatar} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
              : initials
            }
          </div>
          <div>
            <div className={styles.userName}>{user.name || 'User'}</div>
            <div className={styles.userEmail}>{user.email}</div>
          </div>
          <button
            className={styles.logoutBtn}
            onClick={e => { e.stopPropagation(); onLogout() }}
            title="Logout"
          >
            ⏻
          </button>
        </div>
      </div>
    </aside>
  )
}