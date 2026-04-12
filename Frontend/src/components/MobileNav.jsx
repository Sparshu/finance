import styles from './MobileNav.module.css'

// Show 5 key pages in bottom nav, rest accessible via "More" 
const BOTTOM_NAV = [
  { id: 'dashboard',    label: 'Home',     icon: '⊞' },
  { id: 'transactions', label: 'Txns',     icon: '↕' },
  { id: 'budgets',      label: 'Budgets',  icon: '◎' },
  { id: 'goals',        label: 'Goals',    icon: '◈' },
  { id: 'profile',      label: 'Profile',  icon: '◉' },
]

export default function MobileNav({ active, setActive }) {
  return (
    <nav className={styles.mobileNav}>
      {BOTTOM_NAV.map(n => (
        <button
          key={n.id}
          className={`${styles.navBtn} ${active === n.id ? styles.active : ''}`}
          onClick={() => setActive(n.id)}
        >
          <span className={styles.icon}>{n.icon}</span>
          <span className={styles.label}>{n.label}</span>
        </button>
      ))}
    </nav>
  )
}