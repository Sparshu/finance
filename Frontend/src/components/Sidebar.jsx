import { NAV } from '../data/sampleData'
import styles from './Sidebar.module.css'

const EXTRA_NAV = [{ id: 'profile', label: 'Profile', icon: '◉' }]

export default function Sidebar({ active, setActive, user, onLogout }) {
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

      <div className={styles.footer}>
        <div className={styles.userPill} onClick={() => setActive('profile')} style={{ cursor: 'pointer' }}>
          <div className={styles.avatar}>{initials}</div>
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