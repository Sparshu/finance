import { GOALS, fmt } from '../data/sampleData'
import styles from './GoalsPage.module.css'

export default function GoalsPage() {
  return (
    <div className="page-anim">
      <div className="grid-4">
        {GOALS.map((g, i) => {
          const pct = Math.round(g.saved / g.target * 100)
          return (
            <div className={styles.goalCard} key={i} style={{ animationDelay: i * 0.08 + 's' }}>
              <div className={styles.goalIcon}>{g.icon}</div>
              <div className={styles.goalName}>{g.name}</div>
              <div className={styles.goalTarget}>{fmt(g.saved)} of {fmt(g.target)}</div>
              <div className={styles.goalPct}>{pct}%</div>
              <div className="progress-wrap" style={{ marginTop: 8 }}>
                <div className="progress-fill" style={{ width: pct + '%', background: 'var(--green)' }} />
              </div>
              <div style={{ marginTop: 10, fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--text2)' }}>
                {fmt(g.target - g.saved)} left to go
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
