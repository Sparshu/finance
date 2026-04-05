import { useState } from 'react'
import { useApi } from '../api/useApi'
import { txApi } from '../api/services'
import { useToast } from '../components/Toast'
import { RowSkeleton } from '../components/Skeleton'
import { fmt, CATEGORIES } from '../data/sampleData'
import styles from './TransactionsPage.module.css'

const TX_ICONS = {
  Income: '💼', Food: '🛒', Bills: '📺', Transport: '⛽',
  Health: '🏋️', Shopping: '🛍️', Entertainment: '🎬', Other: '💸',
}

function EditRow({ tx, onSave, onCancel }) {
  const [form, setForm] = useState({
    name:     tx.name,
    amount:   String(tx.amount),
    type:     tx.type,
    category: tx.category,
    date:     tx.date,
    note:     tx.note || '',
  })
  const [saving, setSaving] = useState(false)
  const toast = useToast()

  const handleSave = async () => {
    if (!form.name.trim() || !form.amount) return
    setSaving(true)
    try {
      await txApi.update(tx.id, {
        name:     form.name,
        amount:   Number(form.amount),
        type:     form.type,
        category: form.category,
        date:     form.date,
        note:     form.note || null,
      })
      toast.success('Transaction updated')
      onSave()
    } catch (e) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={styles.editRow}>
      <div className={styles.editGrid}>
        <input className="form-input" style={{ fontSize: 12, padding: '7px 10px' }}
          value={form.name} onChange={e => setForm(s => ({ ...s, name: e.target.value }))} placeholder="Description" />
        <input className="form-input" type="number" style={{ fontSize: 12, padding: '7px 10px' }}
          value={form.amount} onChange={e => setForm(s => ({ ...s, amount: e.target.value }))} placeholder="Amount" />
        <select className="form-input" style={{ fontSize: 12, padding: '7px 10px' }}
          value={form.type} onChange={e => setForm(s => ({ ...s, type: e.target.value }))}>
          <option value="INCOME">Income</option>
          <option value="EXPENSE">Expense</option>
        </select>
        <select className="form-input" style={{ fontSize: 12, padding: '7px 10px' }}
          value={form.category} onChange={e => setForm(s => ({ ...s, category: e.target.value }))}>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <input className="form-input" type="date" style={{ fontSize: 12, padding: '7px 10px' }}
          value={form.date} onChange={e => setForm(s => ({ ...s, date: e.target.value }))} />
        <input className="form-input" style={{ fontSize: 12, padding: '7px 10px' }}
          value={form.note} onChange={e => setForm(s => ({ ...s, note: e.target.value }))} placeholder="Note" />
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <button className="btn-primary" onClick={handleSave} disabled={saving}
          style={{ flex: 1, padding: '8px', fontSize: 12 }}>
          {saving ? 'Saving…' : '✓ Save'}
        </button>
        <button onClick={onCancel}
          style={{ flex: 1, padding: '8px', fontSize: 12, background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 10, color: 'var(--text2)', cursor: 'pointer' }}>
          Cancel
        </button>
      </div>
    </div>
  )
}

export default function TransactionsPage({ onAdd }) {
  const [filter, setFilter]   = useState('ALL')
  const [editId, setEditId]   = useState(null)
  const [search, setSearch]   = useState('')
  const toast = useToast()
  const { data: txs, loading, refetch } = useApi(txApi.getAll)

  const filtered = (txs || []).filter(t => {
    const matchType = filter === 'ALL' || t.type === filter
    const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.category.toLowerCase().includes(search.toLowerCase())
    return matchType && matchSearch
  })

  const handleDelete = async (id) => {
    if (!confirm('Delete this transaction?')) return
    try {
      await txApi.delete(id)
      toast.success('Transaction deleted')
      refetch()
    } catch (e) {
      toast.error(e.message)
    }
  }

  const filterActive = (f) => filter === f ? styles.filterActive : ''

  return (
    <div className="page-anim">
      <div className={styles.toolbar}>
        <div className={styles.filterGroup}>
          {['ALL', 'INCOME', 'EXPENSE'].map(f => (
            <button key={f}
              className={`${styles.filterBtn} ${filterActive(f)}`}
              onClick={() => setFilter(f)}>
              {f === 'ALL' ? 'All' : f === 'INCOME' ? '▲ Income' : '▼ Expense'}
            </button>
          ))}
        </div>
        <input
          className="form-input"
          placeholder="Search transactions…"
          style={{ width: 200, padding: '7px 14px', fontSize: 13 }}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button className="btn-primary" onClick={onAdd} style={{ padding: '8px 18px', fontSize: 13, width: 'auto' }}>
          + Add
        </button>
      </div>

      <div className="card">
        {loading && <RowSkeleton count={6} />}

        {!loading && filtered.length === 0 && (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text2)' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>💸</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 13 }}>
              {search ? 'No transactions match your search' : 'No transactions found'}
            </div>
          </div>
        )}

        {!loading && filtered.map((t, i) => (
          <div key={t.id}>
            {editId === t.id ? (
              <EditRow tx={t} onSave={() => { setEditId(null); refetch() }} onCancel={() => setEditId(null)} />
            ) : (
              <div className={styles.txRow} style={{ animationDelay: i * 0.03 + 's' }}>
                <div className={styles.txIcon} style={{ background: t.type === 'INCOME' ? 'var(--accent-soft)' : 'var(--amber-bg)' }}>
                  {TX_ICONS[t.category] || '💸'}
                </div>
                <div className={styles.txInfo}>
                  <div className={styles.txName}>{t.name}</div>
                  <div className={styles.txMeta}>{t.category} · {t.date}{t.note ? ` · ${t.note}` : ''}</div>
                </div>
                <div className={styles.txRight}>
                  <div className={styles.txAmount} style={{ color: t.type === 'INCOME' ? 'var(--accent)' : 'var(--red)' }}>
                    {t.type === 'INCOME' ? '+' : '-'}{fmt(t.amount)}
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                    <button className={styles.actionBtn} onClick={() => setEditId(t.id)} title="Edit">✎</button>
                    <button className={styles.actionBtn} onClick={() => handleDelete(t.id)} title="Delete" style={{ color: 'var(--red)' }}>✕</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}