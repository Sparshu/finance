import { useState } from 'react'
import { SAMPLE_TXS, fmt } from '../data/sampleData'
import styles from './TransactionsPage.module.css'

export default function TransactionsPage({ onAdd }) {
  const [filter, setFilter] = useState('all')
  const filtered = filter === 'all' ? SAMPLE_TXS : SAMPLE_TXS.filter(t => t.type === filter)

  return (
    <div className="page-anim">
      <div className={styles.toolbar}>
        {['all', 'income', 'expense'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`${styles.filterBtn} ${filter === f ? styles.active : ''}`}
          >
            {f}
          </button>
        ))}
        <button
          className="btn-primary"
          onClick={onAdd}
          style={{ marginLeft: 'auto', width: 'auto', padding: '8px 20px' }}
        >
          + Add Transaction
        </button>
      </div>

      <div className="card">
        {filtered.map((t, i) => (
          <div className={styles.txItem} key={t.id} style={{ animationDelay: i * 0.04 + 's' }}>
            <div className={styles.txIcon} style={{ background: t.color }}>{t.icon}</div>
            <div className={styles.txInfo}>
              <div className={styles.txName}>{t.name}</div>
              <div className={styles.txMeta}>{t.category} · {t.date}</div>
            </div>
            <span
              className="badge"
              style={{
                marginRight: 12,
                background: t.type === 'income' ? 'var(--green-bg)' : 'var(--red-bg)',
                color:      t.type === 'income' ? 'var(--green)'    : 'var(--red)',
              }}
            >
              {t.type}
            </span>
            <div
              className={styles.txAmount}
              style={{ color: t.type === 'income' ? 'var(--green)' : 'var(--red)' }}
            >
              {t.type === 'income' ? '+' : '-'}{fmt(t.amount)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
