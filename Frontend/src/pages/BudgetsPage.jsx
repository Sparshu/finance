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

const TEMPLATES_KEY = 'finio_budget_templates'

function loadTemplates() {
  try { return JSON.parse(localStorage.getItem(TEMPLATES_KEY)) || [] }
  catch { return [] }
}

function saveTemplates(templates) {
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates))
}

export default function BudgetsPage() {
  const toast = useToast()
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year,  setYear]  = useState(now.getFullYear())
  const [showForm,     setShowForm]     = useState(false)
  const [showTemplate, setShowTemplate] = useState(false)
  const [category,  setCategory]  = useState('Food')
  const [limit,     setLimit]     = useState('')
  const [saving,    setSaving]    = useState(false)
  const [formError, setFormError] = useState('')
  const [templates, setTemplates] = useState(loadTemplates)
  const [templateName, setTemplateName] = useState('')

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

  // Save current month's budgets as a template
  const handleSaveTemplate = () => {
    if (!templateName.trim()) return toast.error('Enter a template name')
    if (!budgets || budgets.length === 0) return toast.error('No budgets to save as template')
    const template = {
      id:      Date.now(),
      name:    templateName.trim(),
      budgets: budgets.map(b => ({ category: b.category, limit: b.limit })),
    }
    const updated = [...templates, template]
    setTemplates(updated)
    saveTemplates(updated)
    setTemplateName('')
    toast.success(`Template "${template.name}" saved!`)
  }

  // Apply a template to the current month — creates all budgets from template
  const handleApplyTemplate = async (template) => {
    if (!confirm(`Apply "${template.name}" to ${MONTHS[month - 1]} ${year}? This will add ${template.budgets.length} budget(s).`)) return
    setSaving(true)
    try {
      await Promise.all(
        template.budgets.map(b =>
          budgetApi.create({ category: b.category, limit: Number(b.limit), month, year })
        )
      )
      toast.success(`Template "${template.name}" applied!`)
      setShowTemplate(false)
      refetch()
    } catch (e) {
      toast.error('Some budgets may already exist for this month: ' + e.message)
      refetch()
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteTemplate = (id) => {
    const updated = templates.filter(t => t.id !== id)
    setTemplates(updated)
    saveTemplates(updated)
    toast.success('Template deleted')
  }

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

  return (
    <div className="page-anim">
      {/* Month/Year picker + buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <select className="form-input" style={{ width: 110 }} value={month}
          onChange={e => setMonth(Number(e.target.value))}>
          {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
        <select className="form-input" style={{ width: 96 }} value={year}
          onChange={e => setYear(Number(e.target.value))}>
          {[2023, 2024, 2025, 2026, 2027].map(y => <option key={y}>{y}</option>)}
        </select>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button onClick={() => { setShowTemplate(s => !s); setShowForm(false) }}
            style={{
              padding: '8px 16px', fontSize: 13, width: 'auto', cursor: 'pointer',
              background: showTemplate ? 'var(--accent-soft)' : 'var(--bg3)',
              border: `1px solid ${showTemplate ? 'var(--accent)' : 'var(--border2)'}`,
              borderRadius: 'var(--radius)', color: showTemplate ? 'var(--accent)' : 'var(--text2)',
              fontWeight: 500,
            }}>
            Templates
          </button>
          <button className="btn-primary" onClick={() => { setShowForm(s => !s); setShowTemplate(false) }}
            style={{ padding: '8px 18px', fontSize: 13, width: 'auto' }}>
            {showForm ? 'Cancel' : '+ Add Budget'}
          </button>
        </div>
      </div>

      {/* Add budget form */}
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
              <label className="form-label">Monthly Limit (Rs)</label>
              <input className="form-input" type="number" placeholder="e.g. 10000"
                value={limit} onChange={e => setLimit(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAdd()} />
            </div>
          </div>
          {formError && <div style={{ color: 'var(--red)', fontSize: 13, marginBottom: 10 }}>{formError}</div>}
          <button className="btn-primary" onClick={handleAdd} disabled={saving}
            style={{ padding: '8px 20px', fontSize: 13, width: 'auto' }}>
            {saving ? 'Saving...' : 'Save Budget'}
          </button>
        </div>
      )}

      {/* Templates panel */}
      {showTemplate && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="section-title" style={{ marginBottom: 16 }}>Budget Templates</div>

          {/* Save current month as template */}
          {budgets && budgets.length > 0 && (
            <div style={{ marginBottom: 20, padding: '14px 16px', background: 'var(--bg3)', borderRadius: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 10, color: 'var(--text)' }}>
                Save current month as template
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <input className="form-input" placeholder="Template name (e.g. Monthly Standard)"
                  style={{ flex: 1, fontSize: 13 }}
                  value={templateName} onChange={e => setTemplateName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSaveTemplate()} />
                <button className="btn-primary" onClick={handleSaveTemplate}
                  style={{ padding: '8px 16px', fontSize: 13, width: 'auto' }}>
                  Save
                </button>
              </div>
            </div>
          )}

          {/* Saved templates list */}
          {templates.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text2)', fontSize: 13 }}>
              No templates saved yet. Create budgets for this month, then save them as a template to reuse next month.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {templates.map(t => (
                <div key={t.id} style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '12px 16px', background: 'var(--bg3)', borderRadius: 10,
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', marginBottom: 3 }}>
                      {t.name}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text2)', fontFamily: 'var(--mono)' }}>
                      {t.budgets.map(b => `${b.category}: ${fmt(b.limit)}`).join(' · ')}
                    </div>
                  </div>
                  <button onClick={() => handleApplyTemplate(t)} disabled={saving}
                    style={{
                      padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                      background: 'var(--accent)', color: '#0f0f1a', border: 'none', borderRadius: 8,
                    }}>
                    Apply
                  </button>
                  <button onClick={() => handleDeleteTemplate(t.id)}
                    style={{
                      background: 'none', border: 'none', color: 'var(--text3)',
                      cursor: 'pointer', fontSize: 16, padding: '2px 4px',
                    }}>
                    x
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {loading && (
        <div className="grid-3">
          <CardSkeleton lines={3} /><CardSkeleton lines={3} /><CardSkeleton lines={3} />
        </div>
      )}

      {!loading && (!budgets || budgets.length === 0) && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text2)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>◎</div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 13 }}>
            No budgets for {MONTHS[month - 1]} {year} — add one above or apply a template!
          </div>
        </div>
      )}

      <div className="grid-3">
        {!loading && (budgets || []).map((b, i) => {
          const spent = Number(b.spent) || 0
          const lim   = Number(b.limit) || 1
          const pct   = Math.round((spent / lim) * 100)
          const over  = pct > 100
          const warn  = pct > 80
          const color = over ? 'var(--red)' : warn ? 'var(--amber)' : (CAT_COLORS[b.category] || 'var(--blue)')

          return (
            <div className="card" key={b.id} style={{ animationDelay: i * 0.07 + 's', borderTop: `2px solid ${color}`, position: 'relative' }}>
              <button onClick={() => handleDelete(b.id)}
                style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 14, lineHeight: 1 }}>
                x
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
                Limit: {fmt(b.limit)} · Remaining: {fmt(Math.max(lim - spent, 0))}
              </div>
              {over && (
                <div style={{ marginTop: 6, fontSize: 11, color: 'var(--red)', fontFamily: 'var(--mono)' }}>
                  Over by {fmt(spent - lim)}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}