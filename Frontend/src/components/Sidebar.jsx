import { NAV } from '../data/sampleData'
import styles from './Sidebar.module.css'

export default function Sidebar({ active, setActive, user, onLogout }) {
  const initials = user.name
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

      <div className={styles.footer}>
        <div className={styles.userPill}>
          <div className={styles.avatar}>{initials}</div>
          <div>
            <div className={styles.userName}>{user.name}</div>
            <div className={styles.userEmail}>{user.email}</div>
          </div>
          <button
            className={styles.logoutBtn}
            onClick={onLogout}
            title="Logout"
          >
            ⏻
          </button>
        </div>
      </div>
    </aside>
  )
}
