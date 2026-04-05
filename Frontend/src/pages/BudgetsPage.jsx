import { useState } from 'react'
import { useApi } from '../api/useApi'
import { budgetApi } from '../api/services'
import { useToast } from '../components/Toast'
import { CardSkeleton } from '../components/Skeleton'
import { fmt, CATEGORIES } from '../data/sampleData'

const CAT_COLORS = {
  Food: 'var(--accent)', Transport: 'var(--blue)', Entertainment: 'var(--red)',
  Health: 'var(--amber)', Shopping: 'var(--purple)', Bills: 'var(--blue)',
  Other: 'var(--text2)',
}

export default function BudgetsPage() {
  const toast = useToast()
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year,  setYear]  = useState(now.getFullYear())
  const [showForm, setShowForm] = useState(false)
  const [category, setCategory] = useState('Food')
  const [limit,    setLimit]    = useState('')
  const [saving,   setSaving]   = useState(false)
  const [formError, setFormError] = useState('')

  const { data: budgets, loading, refetch } = useApi(
    () => budgetApi.getAll(month, year),
    [month, year]
  )

  const handleAdd = async () => {
    if (!limit || isNaN(limit) || Number(limit) <= 0) return setFormError('Enter a valid limit')
    setSaving(true)
    setFormError('')
    try {
      await budgetApi.create({ category, limit: Number(limit), month, year })
      setLimit('')
      setShowForm(false)
      toast.success('Budget created!')
      refetch()
    } catch (e) {
      setFormError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Remove this budget?')) return
    try {
      await budgetApi.delete(id)
      toast.success('Budget removed')
      refetch()
    } catch (e) {
      toast.error(e.message)
    }
  }

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

  return (
    <div className="page-anim">
      {/* Month/Year picker + Add button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <select className="form-input" style={{ width: 110 }} value={month}
          onChange={e => setMonth(Number(e.target.value))}>
          {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
        <select className="form-input" style={{ width: 96 }} value={year}
          onChange={e => setYear(Number(e.target.value))}>
          {[2023, 2024, 2025, 2026].map(y => <option key={y}>{y}</option>)}
        </select>
        <button className="btn-primary" onClick={() => setShowForm(s => !s)}
          style={{ padding: '8px 18px', fontSize: 13, width: 'auto', marginLeft: 'auto' }}>
          {showForm ? '✕ Cancel' : '+ Add Budget'}
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="card" style={{ marginBottom: 20, borderColor: 'var(--accent)' }}>
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
              <input className="form-input" type="number" placeholder="e.g. 10000"
                value={limit} onChange={e => setLimit(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAdd()} />
            </div>
          </div>
          {formError && <div style={{ color: 'var(--red)', fontSize: 13, marginBottom: 10 }}>{formError}</div>}
          <button className="btn-primary" onClick={handleAdd} disabled={saving}
            style={{ padding: '8px 20px', fontSize: 13, width: 'auto' }}>
            {saving ? 'Saving…' : 'Save Budget'}
          </button>
        </div>
      )}

      {/* Skeleton while loading */}
      {loading && (
        <div className="grid-3">
          <CardSkeleton lines={3} /><CardSkeleton lines={3} /><CardSkeleton lines={3} />
        </div>
      )}

      {/* Empty state */}
      {!loading && (!budgets || budgets.length === 0) && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text2)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>◎</div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 13 }}>
            No budgets for {MONTHS[month - 1]} {year} — add one above!
          </div>
        </div>
      )}

      {/* Budget cards */}
      <div className="grid-3">
        {!loading && (budgets || []).map((b, i) => {
          const spent = Number(b.spent) || 0
          const limit = Number(b.limit) || 1
          const pct   = Math.round((spent / limit) * 100)
          const over  = pct > 100
          const warn  = pct > 80
          const color = over ? 'var(--red)' : warn ? 'var(--amber)' : (CAT_COLORS[b.category] || 'var(--blue)')

          return (
            <div className="card" key={b.id} style={{ animationDelay: i * 0.07 + 's', borderTop: `2px solid ${color}`, position: 'relative' }}>
              <button onClick={() => handleDelete(b.id)}
                style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 14, lineHeight: 1 }}>
                ✕
              </button>
              <div className="card-label">{b.category}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 }}>
                <div className="card-value" style={{ fontSize: 24, color }}>{fmt(spent)}</div>
                <span className={`badge ${over ? 'badge-red' : warn ? 'badge-amber' : 'badge-green'}`}>{pct}%</span>
              </div>
              <div className="progress-wrap">
                <div className="progress-fill" style={{ width: Math.min(pct, 100) + '%', background: color }} />
              </div>
              <div style={{ marginTop: 8, fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--text2)' }}>
                Limit: {fmt(b.limit)} · Remaining: {fmt(Math.max(limit - spent, 0))}
              </div>
              {over && (
                <div style={{ marginTop: 6, fontSize: 11, color: 'var(--red)', fontFamily: 'var(--mono)' }}>
                  ⚠ Over by {fmt(spent - limit)}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}