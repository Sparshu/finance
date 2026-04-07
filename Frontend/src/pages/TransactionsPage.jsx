import { useState } from 'react'
import { useApi } from '../api/useApi'
import { txApi, recurringApi } from '../api/services'
import { useToast } from '../components/Toast'
import { RowSkeleton } from '../components/Skeleton'
import { fmt, CATEGORIES } from '../data/sampleData'
import styles from './TransactionsPage.module.css'

const TX_ICONS = {
  Income: '💼', Food: '🛒', Bills: '📺', Transport: '⛽',
  Health: '🏋️', Shopping: '🛍️', Entertainment: '🎬', Other: '💸',
}

const FREQ_LABELS = { DAILY: 'Daily', WEEKLY: 'Weekly', MONTHLY: 'Monthly', YEARLY: 'Yearly' }
const FREQ_ICONS  = { DAILY: '📅', WEEKLY: '🗓️', MONTHLY: '📆', YEARLY: '🗃️' }

// ── Inline edit row ───────────────────────────────────────────────────────────
function EditRow({ tx, onSave, onCancel }) {
  const [form, setForm] = useState({
    name: tx.name, amount: String(tx.amount), type: tx.type,
    category: tx.category, date: tx.date, note: tx.note || '',
  })
  const [saving, setSaving] = useState(false)
  const toast = useToast()

  const handleSave = async () => {
    if (!form.name.trim() || !form.amount) return
    setSaving(true)
    try {
      await txApi.update(tx.id, { ...form, amount: Number(form.amount), note: form.note || null })
      toast.success('Transaction updated')
      onSave()
    } catch (e) { toast.error(e.message) } finally { setSaving(false) }
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
          style={{ flex: 1, padding: '8px', fontSize: 12 }}>{saving ? 'Saving…' : '✓ Save'}</button>
        <button onClick={onCancel}
          style={{ flex: 1, padding: '8px', fontSize: 12, background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 10, color: 'var(--text2)', cursor: 'pointer' }}>
          Cancel
        </button>
      </div>
    </div>
  )
}

// ── Recurring form ────────────────────────────────────────────────────────────
function RecurringForm({ initial, onSave, onCancel }) {
  const emptyForm = {
    name: '', amount: '', type: 'EXPENSE', category: 'Food',
    frequency: 'MONTHLY', startDate: new Date().toISOString().split('T')[0],
    endDate: '', note: '',
  }
  const [form, setForm] = useState(initial || emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')
  const toast = useToast()

  const handleSave = async () => {
    if (!form.name.trim())                        return setError('Name is required')
    if (!form.amount || Number(form.amount) <= 0) return setError('Enter a valid amount')
    setSaving(true); setError('')
    try {
      const payload = {
        name: form.name.trim(), amount: Number(form.amount),
        type: form.type, category: form.category,
        frequency: form.frequency,
        startDate: form.startDate,
        endDate:   form.endDate || null,
        note:      form.note || null,
      }
      await onSave(payload)
    } catch (e) { setError(e.message) } finally { setSaving(false) }
  }

  return (
    <div className="card" style={{ marginBottom: 20, borderColor: form.type === 'INCOME' ? 'var(--accent)' : 'var(--red)' }}>
      <div className="section-title" style={{ marginBottom: 16 }}>
        {initial ? 'Edit Recurring' : 'New Recurring Transaction'}
      </div>

      {/* Income / Expense toggle */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, background: 'var(--bg3)', borderRadius: 10, padding: 3, marginBottom: 18 }}>
        {['EXPENSE', 'INCOME'].map(t => (
          <div key={t} onClick={() => setForm(s => ({ ...s, type: t }))}
            style={{
              padding: '8px', textAlign: 'center', borderRadius: 8, cursor: 'pointer',
              fontSize: 13, fontWeight: 500, transition: 'all 0.15s',
              background: form.type === t ? 'var(--bg2)' : 'transparent',
              color: form.type === t ? (t === 'INCOME' ? 'var(--accent)' : 'var(--red)') : 'var(--text2)',
              boxShadow: form.type === t ? 'var(--shadow-xs)' : 'none',
            }}>
            {t === 'INCOME' ? '↑ Income' : '↓ Expense'}
          </div>
        ))}
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Name</label>
          <input className="form-input" placeholder="e.g. Monthly Salary"
            value={form.name} onChange={e => setForm(s => ({ ...s, name: e.target.value }))} />
        </div>
        <div className="form-group">
          <label className="form-label">Amount (₹)</label>
          <input className="form-input" type="number" placeholder="0"
            value={form.amount} onChange={e => setForm(s => ({ ...s, amount: e.target.value }))} />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Category</label>
          <select className="form-input" value={form.category}
            onChange={e => setForm(s => ({ ...s, category: e.target.value }))}>
            {CATEGORIES.filter(c => form.type === 'INCOME' ? c === 'Income' || c === 'Other' : c !== 'Income')
              .map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Frequency</label>
          <select className="form-input" value={form.frequency}
            onChange={e => setForm(s => ({ ...s, frequency: e.target.value }))}>
            {Object.entries(FREQ_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Start Date</label>
          <input className="form-input" type="date" value={form.startDate}
            onChange={e => setForm(s => ({ ...s, startDate: e.target.value }))} />
        </div>
        <div className="form-group">
          <label className="form-label">End Date <span style={{ color: 'var(--text3)', fontSize: 11 }}>(optional)</span></label>
          <input className="form-input" type="date" value={form.endDate}
            onChange={e => setForm(s => ({ ...s, endDate: e.target.value }))} />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Note <span style={{ color: 'var(--text3)', fontSize: 11 }}>(optional)</span></label>
        <input className="form-input" placeholder="e.g. Employer: Acme Corp"
          value={form.note} onChange={e => setForm(s => ({ ...s, note: e.target.value }))} />
      </div>

      {error && <div style={{ color: 'var(--red)', fontSize: 13, marginBottom: 10 }}>{error}</div>}

      <div style={{ display: 'flex', gap: 10 }}>
        <button className="btn-primary" onClick={handleSave} disabled={saving}
          style={{ width: 'auto', padding: '9px 24px', fontSize: 13,
            background: form.type === 'INCOME' ? 'var(--accent)' : 'var(--red)' }}>
          {saving ? 'Saving…' : initial ? 'Update' : 'Create'}
        </button>
        <button onClick={onCancel}
          style={{ padding: '9px 20px', fontSize: 13, background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 10, color: 'var(--text2)', cursor: 'pointer' }}>
          Cancel
        </button>
      </div>
    </div>
  )
}

// ── Recurring Tab ─────────────────────────────────────────────────────────────
function RecurringTab() {
  const toast = useToast()
  const { data: recurring, loading, refetch } = useApi(recurringApi.getAll)
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState(null)

  const handleCreate = async (payload) => {
    await recurringApi.create(payload)
    toast.success('Recurring transaction created!')
    setShowForm(false); refetch()
  }

  const handleUpdate = async (payload) => {
    await recurringApi.update(editItem.id, payload)
    toast.success('Updated!')
    setEditItem(null); refetch()
  }

  const handleToggle = async (id) => {
    await recurringApi.toggle(id)
    toast.success('Status updated')
    refetch()
  }

  const handleRunNow = async (id, name) => {
    await recurringApi.runNow(id)
    toast.success(`"${name}" posted as a transaction!`)
    refetch()
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this recurring transaction?')) return
    await recurringApi.delete(id)
    toast.success('Deleted')
    refetch()
  }

  const daysUntil = (dateStr) => {
    if (!dateStr) return null
    const diff = Math.ceil((new Date(dateStr) - new Date()) / 86400000)
    if (diff < 0)  return 'Overdue'
    if (diff === 0) return 'Today'
    if (diff === 1) return 'Tomorrow'
    return `In ${diff} days`
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button className="btn-primary" onClick={() => { setShowForm(true); setEditItem(null) }}
          style={{ padding: '8px 18px', fontSize: 13, width: 'auto' }}>
          + Add Recurring
        </button>
      </div>

      {showForm && !editItem && (
        <RecurringForm onSave={handleCreate} onCancel={() => setShowForm(false)} />
      )}
      {editItem && (
        <RecurringForm initial={editItem} onSave={handleUpdate} onCancel={() => setEditItem(null)} />
      )}

      <div className="card">
        {loading && <RowSkeleton count={4} />}

        {!loading && (!recurring || recurring.length === 0) && (
          <div style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--text2)' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🔄</div>
            <div style={{ fontWeight: 500, marginBottom: 4 }}>No recurring transactions</div>
            <div style={{ fontSize: 12 }}>Add salary, rent, EMIs — they'll post automatically</div>
          </div>
        )}

        {!loading && (recurring || []).map((r, i) => {
          const isIncome = r.type === 'INCOME'
          const dueSoon  = daysUntil(r.nextRunDate)
          return (
            <div key={r.id} style={{
              display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0',
              borderBottom: i < recurring.length - 1 ? '1px solid var(--border)' : 'none',
              opacity: r.active ? 1 : 0.5,
              animation: 'fadeUp 0.3s ease both', animationDelay: i * 0.04 + 's',
            }}>
              {/* Freq icon */}
              <div style={{
                width: 40, height: 40, borderRadius: 10, flexShrink: 0, fontSize: 18,
                background: isIncome ? 'var(--accent-soft)' : 'var(--red-soft)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {FREQ_ICONS[r.frequency]}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                  <span style={{ fontWeight: 500, fontSize: 13.5 }}>{r.name}</span>
                  <span className={`badge ${r.active ? 'badge-green' : 'badge-amber'}`} style={{ fontSize: 10 }}>
                    {r.active ? 'Active' : 'Paused'}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text2)', fontFamily: 'var(--mono)' }}>
                  {FREQ_LABELS[r.frequency]} · {r.category}
                  {r.nextRunDate && ` · Next: ${r.nextRunDate} (${dueSoon})`}
                  {r.endDate && ` · Ends: ${r.endDate}`}
                </div>
              </div>

              {/* Amount + actions */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                <div style={{ fontFamily: 'var(--mono)', fontWeight: 600, fontSize: 14,
                  color: isIncome ? 'var(--accent)' : 'var(--red)' }}>
                  {isIncome ? '+' : '-'}{fmt(r.amount)}
                </div>
                <div style={{ display: 'flex', gap: 5 }}>
                  <button onClick={() => handleRunNow(r.id, r.name)} title="Post now"
                    style={{ background: 'none', border: '1px solid var(--border2)', borderRadius: 6, padding: '3px 8px', fontSize: 11, color: 'var(--accent)', cursor: 'pointer' }}>
                    ▶ Run
                  </button>
                  <button onClick={() => handleToggle(r.id)} title={r.active ? 'Pause' : 'Resume'}
                    style={{ background: 'none', border: '1px solid var(--border2)', borderRadius: 6, padding: '3px 8px', fontSize: 11, color: 'var(--amber)', cursor: 'pointer' }}>
                    {r.active ? '⏸' : '▶'}
                  </button>
                  <button onClick={() => { setEditItem(r); setShowForm(false) }}
                    style={{ background: 'none', border: '1px solid var(--border2)', borderRadius: 6, padding: '3px 8px', fontSize: 11, color: 'var(--text2)', cursor: 'pointer' }}>
                    ✎
                  </button>
                  <button onClick={() => handleDelete(r.id)}
                    style={{ background: 'none', border: '1px solid var(--border2)', borderRadius: 6, padding: '3px 8px', fontSize: 11, color: 'var(--red)', cursor: 'pointer' }}>
                    ✕
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function TransactionsPage({ onAdd, onScanReceipt }) {
  const [mainTab, setMainTab] = useState('transactions') // transactions | recurring
  const [filter,  setFilter]  = useState('ALL')
  const [editId,  setEditId]  = useState(null)
  const [search,  setSearch]  = useState('')
  const toast = useToast()
  const { data: txs, loading, refetch } = useApi(txApi.getAll)

  const filtered = (txs || []).filter(t => {
    const matchType   = filter === 'ALL' || t.type === filter
    const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.category.toLowerCase().includes(search.toLowerCase())
    return matchType && matchSearch
  })

  const handleDelete = async (id) => {
    if (!confirm('Delete this transaction?')) return
    try { await txApi.delete(id); toast.success('Transaction deleted'); refetch() }
    catch (e) { toast.error(e.message) }
  }

  const tabStyle = (t) => ({
    padding: '8px 20px', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 500,
    cursor: 'pointer', transition: 'all 0.15s',
    background: mainTab === t ? 'var(--accent)' : 'var(--bg3)',
    color: mainTab === t ? '#fff' : 'var(--text2)',
  })

  return (
    <div className="page-anim">
      {/* Main tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button style={tabStyle('transactions')} onClick={() => setMainTab('transactions')}>
          💸 Transactions
        </button>
        <button style={tabStyle('recurring')} onClick={() => setMainTab('recurring')}>
          🔄 Recurring
        </button>
      </div>

      {mainTab === 'transactions' && (
        <>
          <div className={styles.toolbar}>
            <div className={styles.filterGroup}>
              {['ALL', 'INCOME', 'EXPENSE'].map(f => (
                <button key={f}
                  className={`${styles.filterBtn} ${filter === f ? styles.filterActive : ''}`}
                  onClick={() => setFilter(f)}>
                  {f === 'ALL' ? 'All' : f === 'INCOME' ? '▲ Income' : '▼ Expense'}
                </button>
              ))}
            </div>
            <input className="form-input" placeholder="Search…"
              style={{ width: 200, padding: '7px 14px', fontSize: 13 }}
              value={search} onChange={e => setSearch(e.target.value)} />
            <button className="btn-primary" onClick={onAdd}
              style={{ padding: '8px 18px', fontSize: 13, width: 'auto' }}>
              + Add
            </button>
            <button onClick={onScanReceipt}
              style={{
                padding: '8px 14px', fontSize: 13, width: 'auto',
                background: 'var(--bg3)', border: '1px solid var(--border2)',
                borderRadius: 'var(--radius)', color: 'var(--text)', cursor: 'pointer',
                fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6,
              }}>
              🧾 Scan
            </button>
          </div>

          <div className="card">
            {loading && <RowSkeleton count={6} />}
            {!loading && filtered.length === 0 && (
              <div style={{ padding: 48, textAlign: 'center', color: 'var(--text2)' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>💸</div>
                <div style={{ fontSize: 13 }}>
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
                        <button className={styles.actionBtn} onClick={() => setEditId(t.id)}>✎</button>
                        <button className={styles.actionBtn} onClick={() => handleDelete(t.id)} style={{ color: 'var(--red)' }}>✕</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {mainTab === 'recurring' && <RecurringTab />}
    </div>
  )
}