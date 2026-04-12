import { NAV } from '../data/sampleData'
import styles from './MobileNav.module.css'

const ALL_NAV = [
  ...NAV,
  { id: 'profile', label: 'Profile', icon: '◉' },
]

export default function MobileNav({ active, setActive }) {
  return (
    <nav className={styles.mobileNav}>
      <div className={styles.scrollTrack}>
        {ALL_NAV.map(n => (
          <button
            key={n.id}
            className={`${styles.navBtn} ${active === n.id ? styles.active : ''}`}
            onClick={() => setActive(n.id)}
          >
            <span className={styles.icon}>{n.icon}</span>
            <span className={styles.label}>{n.label}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}