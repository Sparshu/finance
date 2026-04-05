import { useState } from 'react'
import { useApi } from '../api/useApi'
import { billApi } from '../api/services'
import { useToast } from '../components/Toast'
import { RowSkeleton } from '../components/Skeleton'
import { fmt } from '../data/sampleData'
import styles from './BillsPage.module.css'

const BILL_ICONS = ['📺','🌐','💳','🛡️','🎵','💡','📱','🏠','🚗','☎️']

export default function BillsPage() {
  const toast = useToast()
  const { data: bills, loading, refetch } = useApi(billApi.getAll)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', icon: '📺', amount: '', dueDay: '' })
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')

  const upcoming = (bills || []).filter(b => b.status !== 'PAID')
  const paid     = (bills || []).filter(b => b.status === 'PAID')
  const totalDue = upcoming.reduce((s, b) => s + Number(b.amount), 0)

  const handleCreate = async () => {
    if (!form.name.trim())                              return setError('Name is required')
    if (!form.amount || Number(form.amount) <= 0)       return setError('Enter a valid amount')
    if (!form.dueDay || Number(form.dueDay) < 1 || Number(form.dueDay) > 31) return setError('Due day must be 1–31')
    setSaving(true); setError('')
    try {
      await billApi.create({
        name:   form.name.trim(),
        icon:   form.icon,
        amount: Number(form.amount),
        dueDay: Number(form.dueDay),
        status: 'UPCOMING',
      })
      setForm({ name: '', icon: '📺', amount: '', dueDay: '' })
      setShowForm(false)
      toast.success('Bill added!')
      refetch()
    } catch (e) { setError(e.message) } finally { setSaving(false) }
  }

  const handlePay = async (id) => {
    try {
      await billApi.markPaid(id)
      toast.success('Bill marked as paid!')
      refetch()
    } catch (e) { toast.error(e.message) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this bill?')) return
    try {
      await billApi.delete(id)
      toast.success('Bill deleted')
      refetch()
    } catch (e) { toast.error(e.message) }
  }

  const statusBadge = (s) => {
    if (s === 'PAID')     return <span className="badge badge-green">✓ Paid</span>
    if (s === 'DUE')      return <span className="badge badge-red">Due Now!</span>
    return <span className="badge">Upcoming</span>
  }

  return (
    <div className="page-anim">
      {/* Summary cards */}
      <div className="grid-3 mb12">
        <div className="card" style={{ borderTop: '2px solid var(--red)' }}>
          <div className="card-label">Total Upcoming</div>
          <div className="card-value" style={{ color: 'var(--red)', fontSize: 22 }}>{fmt(totalDue)}</div>
        </div>
        <div className="card" style={{ borderTop: '2px solid var(--amber)' }}>
          <div className="card-label">Unpaid Bills</div>
          <div className="card-value" style={{ color: 'var(--amber)', fontSize: 22 }}>{upcoming.length}</div>
        </div>
        <div className="card" style={{ borderTop: '2px solid var(--accent)' }}>
          <div className="card-label">Paid This Month</div>
          <div className="card-value" style={{ color: 'var(--accent)', fontSize: 22 }}>{paid.length}</div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button className="btn-primary" onClick={() => setShowForm(s => !s)}
          style={{ padding: '8px 18px', fontSize: 13, width: 'auto' }}>
          {showForm ? '✕ Cancel' : '+ Add Bill'}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 20, borderColor: 'var(--accent)' }}>
          <div className="section-title" style={{ marginBottom: 16 }}>New Bill / Subscription</div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Name</label>
              <input className="form-input" placeholder="Netflix" value={form.name}
                onChange={e => setForm(s => ({ ...s, name: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Icon</label>
              <select className="form-input" value={form.icon}
                onChange={e => setForm(s => ({ ...s, icon: e.target.value }))}>
                {BILL_ICONS.map(ic => <option key={ic}>{ic}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Amount (₹)</label>
              <input className="form-input" type="number" placeholder="649" value={form.amount}
                onChange={e => setForm(s => ({ ...s, amount: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Due Day of Month</label>
              <input className="form-input" type="number" min="1" max="31" placeholder="e.g. 8" value={form.dueDay}
                onChange={e => setForm(s => ({ ...s, dueDay: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && handleCreate()} />
            </div>
          </div>
          {error && <div style={{ color: 'var(--red)', fontSize: 13, marginBottom: 10 }}>{error}</div>}
          <button className="btn-primary" onClick={handleCreate} disabled={saving}
            style={{ padding: '8px 20px', fontSize: 13, width: 'auto' }}>
            {saving ? 'Saving…' : 'Add Bill'}
          </button>
        </div>
      )}

      <div className="card">
        {loading && <RowSkeleton count={4} />}

        {!loading && (!bills || bills.length === 0) && (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text2)' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>◷</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 13 }}>No bills yet — add one above</div>
          </div>
        )}

        {!loading && (bills || []).map((b, i) => (
          <div className={styles.billRow} key={b.id} style={{ animationDelay: i * 0.05 + 's', opacity: b.status === 'PAID' ? 0.6 : 1 }}>
            <div className={styles.billIcon}>{b.icon || '📄'}</div>
            <div className={styles.billInfo}>
              <div className={styles.billName}>{b.name}</div>
              <div className={styles.billMeta}>
                Due day {b.dueDay} &nbsp;·&nbsp; {statusBadge(b.status)}
              </div>
            </div>
            <div className={styles.billRight}>
              <div className={styles.billAmount}>{fmt(b.amount)}</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {b.status !== 'PAID' && (
                  <button onClick={() => handlePay(b.id)}
                    className="btn-primary"
                    style={{ padding: '5px 12px', fontSize: 11, width: 'auto', borderRadius: 8 }}>
                    ✓ Paid
                  </button>
                )}
                <button onClick={() => handleDelete(b.id)}
                  style={{ background: 'none', border: '1px solid var(--border2)', borderRadius: 8, padding: '5px 10px', fontSize: 11, color: 'var(--text2)', cursor: 'pointer' }}>
                  ✕
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}