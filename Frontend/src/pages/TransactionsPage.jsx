import { useState } from 'react'
import { useApi } from '../api/useApi'
import { txApi } from '../api/services'
import { fmt, CATEGORIES } from '../data/sampleData'
import styles from './TransactionsPage.module.css'

const TX_ICONS = {
  Income: '💼', Food: '🛒', Bills: '📺', Transport: '⛽',
  Health: '🏋️', Shopping: '🛍️', Entertainment: '🎬', Other: '💸',
}

export default function TransactionsPage({ onAdd }) {
  const [filter, setFilter] = useState('ALL')
  const { data: txs, loading, refetch } = useApi(txApi.getAll)

  const filtered = (txs || []).filter(t =>
    filter === 'ALL' || t.type === filter
  )

  const handleDelete = async (id) => {
    if (!confirm('Delete this transaction?')) return
    try { await txApi.delete(id); refetch() } catch (e) { alert(e.message) }
  }

  return (
    <div className="page-anim">
      <div className={styles.toolbar}>
        <div className={styles.filterGroup}>
          {['ALL', 'INCOME', 'EXPENSE'].map(f => (
            <button
              key={f}
              className={`${styles.filterBtn} ${filter === f ? styles.filterActive : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'ALL' ? 'All' : f === 'INCOME' ? '▲ Income' : '▼ Expense'}
            </button>
          ))}
        </div>
        <button className="btn-primary" onClick={onAdd} style={{ padding: '8px 18px', fontSize: 13 }}>
          + Add Transaction
        </button>
      </div>

      <div className="card">
        {loading && (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text2)' }}>Loading transactions…</div>
        )}
        {!loading && filtered.length === 0 && (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text2)' }}>
            No transactions found
          </div>
        )}
        {!loading && filtered.map((t, i) => (
          <div className={styles.txRow} key={t.id} style={{ animationDelay: i * 0.04 + 's' }}>
            <div className={styles.txIcon} style={{ background: t.type === 'INCOME' ? 'var(--green-bg)' : 'var(--amber-bg)' }}>
              {TX_ICONS[t.category] || '💸'}
            </div>
            <div className={styles.txInfo}>
              <div className={styles.txName}>{t.name}</div>
              <div className={styles.txMeta}>{t.category} · {t.date}{t.note ? ` · ${t.note}` : ''}</div>
            </div>
            <div className={styles.txRight}>
              <div className={styles.txAmount} style={{ color: t.type === 'INCOME' ? 'var(--green)' : 'var(--red)' }}>
                {t.type === 'INCOME' ? '+' : '-'}{fmt(t.amount)}
              </div>
              <button className={styles.deleteBtn} onClick={() => handleDelete(t.id)} title="Delete">✕</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}