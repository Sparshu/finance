import { useState } from 'react'
import { useApi } from '../api/useApi'
import { budgetApi } from '../api/services'
import { fmt, CATEGORIES } from '../data/sampleData'

const CAT_COLORS = {
  Food: 'var(--green)', Transport: 'var(--blue)', Entertainment: 'var(--red)',
  Health: 'var(--amber)', Shopping: 'var(--purple)', Bills: 'var(--blue)',
  Income: 'var(--green)', Other: 'var(--text2)',
}

export default function BudgetsPage() {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year,  setYear]  = useState(now.getFullYear())
  const [showForm, setShowForm] = useState(false)
  const [category, setCategory] = useState('Food')
  const [limit, setLimit] = useState('')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const toast = useToast()
    const { data: budgets, loading, refetch } = useApi(() => budgetApi.getAll(month, year), [month, year])

  const handleAdd = async () => {
    if (!limit || isNaN(limit) || Number(limit) <= 0) return setFormError('Enter a valid limit')
    setSaving(true)
    setFormError('')
    try {
      await budgetApi.create({ category, limit: Number(limit), month, year })
      toast.success('Budget created!')
      setLimit('')
      setShowForm(false)
      refetch()
    } catch (e) {
      setFormError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Remove this budget?')) return
    try { await budgetApi.delete(id); toast.success('Budget removed'); refetch() } catch (e) { toast.error(e.message) }
  }

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

  return (
    <div className="page-anim">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <select className="form-input" style={{ width: 120 }} value={month} onChange={e => setMonth(Number(e.target.value))}>
          {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
        <select className="form-input" style={{ width: 100 }} value={year} onChange={e => setYear(Number(e.target.value))}>
          {[2023, 2024, 2025, 2026].map(y => <option key={y}>{y}</option>)}
        </select>
        <button className="btn-primary" onClick={() => setShowForm(s => !s)} style={{ padding: '8px 18px', fontSize: 13, marginLeft: 'auto' }}>
          {showForm ? '✕ Cancel' : '+ Add Budget'}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="section-title" style={{ marginBottom: 16 }}>New Budget</div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-input" value={category} onChange={e => setCategory(e.target.value)}>
                {CATEGORIES.filter(c => c !== 'Income').map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Monthly Limit (₹)</label>
              <input className="form-input" type="number" placeholder="e.g. 10000" value={limit} onChange={e => setLimit(e.target.value)} />
            </div>
          </div>
          {formError && <div style={{ color: 'var(--red)', fontSize: 13, marginBottom: 8 }}>{formError}</div>}
          <button className="btn-primary" onClick={handleAdd} disabled={saving} style={{ padding: '8px 20px', fontSize: 13 }}>
            {saving ? 'Saving…' : 'Save Budget'}
          </button>
        </div>
      )}

      {loading && <div style={{ padding: 40, textAlign: 'center', color: 'var(--text2)' }}>Loading budgets…</div>}

      <div className="grid-3">
        {!loading && (budgets || []).map((b, i) => {
          const pct  = b.limit > 0 ? Math.round((Number(b.spent) / Number(b.limit)) * 100) : 0
          const over = pct > 100
          const color = CAT_COLORS[b.category] || 'var(--blue)'
          return (
            <div className="card" key={b.id} style={{ animationDelay: i * 0.07 + 's', position: 'relative' }}>
              <button
                onClick={() => handleDelete(b.id)}
                style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', fontSize: 14 }}
                title="Delete"
              >✕</button>
              <div className="card-label">{b.category}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 }}>
                <div className="card-value" style={{ fontSize: 24, color: over ? 'var(--red)' : color }}>
                  {fmt(b.spent)}
                </div>
                <span className={`badge ${over ? 'badge-red' : 'badge-green'}`}>{pct}%</span>
              </div>
              <div className="progress-wrap">
                <div className="progress-fill" style={{ width: Math.min(pct, 100) + '%', background: over ? 'var(--red)' : color }} />
              </div>
              <div style={{ marginTop: 8, fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--text2)' }}>
                Limit: {fmt(b.limit)} · Remaining: {fmt(Math.max(Number(b.limit) - Number(b.spent), 0))}
              </div>
              {over && (
                <div style={{ marginTop: 8, fontSize: 11, color: 'var(--red)', fontFamily: 'var(--mono)' }}>
                  ⚠ Over budget by {fmt(Number(b.spent) - Number(b.limit))}
                </div>
              )}
            </div>
          )
        })}
        {!loading && (!budgets || budgets.length === 0) && (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 40, color: 'var(--text2)' }}>
            No budgets for this month — add one above!
          </div>
        )}
      </div>
    </div>
  )
}