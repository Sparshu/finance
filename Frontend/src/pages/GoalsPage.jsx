import { useState } from 'react'
import { useApi } from '../api/useApi'
import { goalApi } from '../api/services'
import { useToast } from '../components/Toast'
import { CardSkeleton } from '../components/Skeleton'
import { fmt } from '../data/sampleData'
import styles from './GoalsPage.module.css'

const GOAL_ICONS = ['🛡️','💻','✈️','🚗','🏠','💍','📚','🎓','💰','🌍','🏋️','🎯']

export default function GoalsPage() {
  const toast = useToast()
  const { data: goals, loading, refetch } = useApi(goalApi.getAll)
  const [showForm, setShowForm] = useState(false)
  const [addAmount, setAddAmount] = useState({})
  const [form, setForm] = useState({ name: '', icon: '🛡️', targetAmount: '', savedAmount: '', targetDate: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleCreate = async () => {
    if (!form.name.trim()) return setError('Name is required')
    if (!form.targetAmount || Number(form.targetAmount) <= 0) return setError('Enter a valid target')
    setSaving(true); setError('')
    try {
      await goalApi.create({
        name: form.name, icon: form.icon,
        targetAmount: Number(form.targetAmount),
        savedAmount:  Number(form.savedAmount) || 0,
        targetDate:   form.targetDate || null,
      })
      setForm({ name: '', icon: '🛡️', targetAmount: '', savedAmount: '', targetDate: '' })
      setShowForm(false)
      toast.success('Goal created!')
      refetch()
    } catch (e) { setError(e.message) } finally { setSaving(false) }
  }

  const handleAddSaving = async (id) => {
    const amt = Number(addAmount[id])
    if (!amt || amt <= 0) return toast.error('Enter a valid amount')
    try {
      await goalApi.addSaving(id, amt)
      setAddAmount(s => ({ ...s, [id]: '' }))
      toast.success(`₹${amt.toLocaleString('en-IN')} added!`)
      refetch()
    } catch (e) { toast.error(e.message) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this goal?')) return
    try { await goalApi.delete(id); toast.success('Goal deleted'); refetch() }
    catch (e) { toast.error(e.message) }
  }

  return (
    <div className="page-anim">
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
        <button className="btn-primary" onClick={() => setShowForm(s => !s)} style={{ padding: '8px 18px', fontSize: 13, width: 'auto' }}>
          {showForm ? '✕ Cancel' : '+ New Goal'}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 20, borderColor: 'var(--green)' }}>
          <div className="section-title" style={{ marginBottom: 16 }}>New Savings Goal</div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Goal Name</label>
              <input className="form-input" placeholder="e.g. Emergency Fund" value={form.name}
                onChange={e => setForm(s => ({ ...s, name: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Icon</label>
              <select className="form-input" value={form.icon}
                onChange={e => setForm(s => ({ ...s, icon: e.target.value }))}>
                {GOAL_ICONS.map(ic => <option key={ic}>{ic}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Target Amount (₹)</label>
              <input className="form-input" type="number" placeholder="300000" value={form.targetAmount}
                onChange={e => setForm(s => ({ ...s, targetAmount: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Already Saved (₹)</label>
              <input className="form-input" type="number" placeholder="0" value={form.savedAmount}
                onChange={e => setForm(s => ({ ...s, savedAmount: e.target.value }))} />
            </div>
          </div>
          <div className="form-group" style={{ maxWidth: 200 }}>
            <label className="form-label">Target Date (optional)</label>
            <input className="form-input" type="date" value={form.targetDate}
              onChange={e => setForm(s => ({ ...s, targetDate: e.target.value }))} />
          </div>
          {error && <div style={{ color: 'var(--red)', fontSize: 13, marginBottom: 8 }}>{error}</div>}
          <button className="btn-primary" onClick={handleCreate} disabled={saving} style={{ padding: '8px 20px', fontSize: 13, width: 'auto' }}>
            {saving ? 'Saving…' : 'Create Goal'}
          </button>
        </div>
      )}

      {loading && <div className="grid-2"><CardSkeleton lines={4} /><CardSkeleton lines={4} /></div>}

      {!loading && (!goals || goals.length === 0) && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text2)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>◈</div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 13 }}>No savings goals yet — create your first one!</div>
        </div>
      )}

      <div className="grid-2">
        {!loading && (goals || []).map((g, i) => (
          <div className={`card ${styles.goalCard}`} key={g.id} style={{ animationDelay: i * 0.08 + 's', position: 'relative' }}>
            <button onClick={() => handleDelete(g.id)}
              style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 14 }}>✕</button>
            <div className={styles.goalHeader}>
              <div className={styles.goalIcon}>{g.icon || '🎯'}</div>
              <div>
                <div className={styles.goalName}>{g.name}</div>
                {g.targetDate && <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>Target: {g.targetDate}</div>}
              </div>
            </div>
            <div className={styles.goalAmounts}>
              <div>
                <div className={styles.goalSaved}>{fmt(g.savedAmount)}</div>
                <div className={styles.goalLabel}>saved</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className={styles.goalTarget}>{fmt(g.targetAmount)}</div>
                <div className={styles.goalLabel}>goal</div>
              </div>
            </div>
            <div className="progress-wrap" style={{ margin: '12px 0' }}>
              <div className="progress-fill" style={{
                width: Math.min(g.progressPercent, 100) + '%',
                background: g.progressPercent >= 100 ? 'var(--green)' : g.progressPercent > 60 ? 'var(--blue)' : 'var(--amber)'
              }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text2)', marginBottom: 12, fontFamily: 'var(--mono)' }}>
              <span>{g.progressPercent}% reached</span>
              <span>{fmt(Math.max(Number(g.targetAmount) - Number(g.savedAmount), 0))} to go</span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                className="form-input"
                type="number"
                placeholder="Add ₹ amount"
                style={{ flex: 1, padding: '7px 10px', fontSize: 12 }}
                value={addAmount[g.id] || ''}
                onChange={e => setAddAmount(s => ({ ...s, [g.id]: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && handleAddSaving(g.id)}
              />
              <button className="btn-primary" onClick={() => handleAddSaving(g.id)}
                style={{ padding: '7px 14px', fontSize: 12, whiteSpace: 'nowrap', width: 'auto' }}>
                + Add
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}