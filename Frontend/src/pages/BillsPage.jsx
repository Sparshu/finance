import { BILLS, fmt } from '../data/sampleData'
import styles from './BillsPage.module.css'

export default function BillsPage() {
  const totalDue = BILLS.reduce((s, b) => s + b.amount, 0)

  return (
    <div className="page-anim">
      <div className="grid-3 mb12">
        {[
          { label: 'Total Due This Month', val: fmt(totalDue),                                    color: 'var(--amber)', borderColor: 'var(--amber)' },
          { label: 'Upcoming Bills',       val: BILLS.filter(b => b.status === 'upcoming').length, color: 'var(--text)',  borderColor: 'transparent' },
          { label: 'Due Soon',             val: BILLS.filter(b => b.status === 'due').length,      color: 'var(--red)',   borderColor: 'transparent' },
        ].map((c, i) => (
          <div className="card" key={i} style={{ borderTop: `2px solid ${c.borderColor}` }}>
            <div className="card-label">{c.label}</div>
            <div className="card-value" style={{ color: c.color, fontSize: 24 }}>{c.val}</div>
          </div>
        ))}
      </div>

      <div className="mt16">
        {BILLS.map((b, i) => (
          <div
            className={styles.billRow}
            key={i}
            style={{
              animationDelay: i * 0.06 + 's',
              borderLeft: `3px solid ${b.status === 'due' ? 'var(--red)' : 'var(--border2)'}`,
            }}
          >
            <span className={styles.billIcon}>{b.icon}</span>
            <div>
              <div className={styles.billName}>{b.name}</div>
              <div className={styles.billDue}>Due {b.due}</div>
            </div>
            <span
              className={`badge ${b.status === 'due' ? 'badge-red' : 'badge-amber'}`}
              style={{ marginLeft: 'auto', marginRight: 16 }}
            >
              {b.status === 'due' ? 'Due Soon' : 'Upcoming'}
            </span>
            <div className={styles.billAmount}>{fmt(b.amount)}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
