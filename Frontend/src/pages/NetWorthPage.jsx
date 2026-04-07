import { useState, useMemo } from 'react'
import { useApi } from '../api/useApi'
import { netWorthApi } from '../api/services'
import { useToast } from '../components/Toast'
import { RowSkeleton } from '../components/Skeleton'
import { fmt } from '../data/sampleData'

const ASSET_CATEGORIES     = ['Cash & Bank', 'Investments', 'Real Estate', 'Vehicle', 'Gold & Jewellery', 'Other Asset']
const LIABILITY_CATEGORIES = ['Home Loan', 'Car Loan', 'Personal Loan', 'Credit Card', 'Education Loan', 'Other Liability']

const CAT_ICONS = {
  'Cash & Bank': '🏦', 'Investments': '📈', 'Real Estate': '🏠',
  'Vehicle': '🚗', 'Gold & Jewellery': '💛', 'Other Asset': '📦',
  'Home Loan': '🏠', 'Car Loan': '🚗', 'Personal Loan': '💸',
  'Credit Card': '💳', 'Education Loan': '🎓', 'Other Liability': '📋',
  'Monthly Savings': '💰',
}

const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December']

function MiniBarChart({ entries }) {
  if (!entries || entries.length === 0) return null

  const monthMap = {}
  entries.forEach(e => {
    const m = e.date?.slice(0, 7)
    if (!m) return
    if (!monthMap[m]) monthMap[m] = { assets: 0, liabilities: 0, savings: 0 }
    if (e.type === 'ASSET')           monthMap[m].assets      += Number(e.amount)
    if (e.type === 'LIABILITY')       monthMap[m].liabilities += Number(e.amount)
    if (e.type === 'MONTHLY_SAVINGS') {
      const isDeficit = e.note?.toLowerCase().includes('deficit')
      monthMap[m].savings += isDeficit ? -Number(e.amount) : Number(e.amount)
    }
  })

  const months = Object.entries(monthMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([m, v]) => ({
      label: new Date(m + '-01').toLocaleDateString('en-IN', { month: 'short' }),
      net: v.assets - v.liabilities + v.savings,
    }))

  if (months.length < 2) return null

  const maxVal = Math.max(...months.map(m => Math.abs(m.net)), 1)

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 80, marginTop: 16 }}>
      {months.map((m, i) => {
        const isPositive = m.net >= 0
        const height = Math.max((Math.abs(m.net) / maxVal) * 100, 4)
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div title={fmt(m.net)} style={{
              width: '100%', height: height + '%',
              background: isPositive ? 'var(--accent)' : 'var(--red)',
              borderRadius: '4px 4px 0 0', opacity: 0.85,
              minHeight: 4, transition: 'height 0.6s ease',
            }} />
            <span style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'var(--mono)' }}>{m.label}</span>
          </div>
        )
      })}
    </div>
  )
}

function RolloverModal({ onClose, onSuccess }) {
  const toast = useToast()
  const now   = new Date()
  const prevMonth = now.getMonth() === 0 ? 12 : now.getMonth()
  const prevYear  = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()

  const [month,   setMonth]   = useState(prevMonth)
  const [year,    setYear]    = useState(prevYear)
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState(null)

  const years = []
  for (let y = now.getFullYear(); y >= now.getFullYear() - 5; y--) years.push(y)

  const handleRollover = async () => {
    setLoading(true)
    try {
      const result = await netWorthApi.rolloverSavings(year, month)
      setPreview(result)
      toast.success(result.updated ? `Updated savings for ${result.month}!` : `✅ ${result.month} savings added!`)
      onSuccess()
    } catch (e) {
      toast.error(e.message || 'Failed to rollover savings')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
      backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', zIndex: 1001, animation: 'fadeIn 0.15s ease',
    }}>
      <div style={{
        background: 'var(--bg2)', border: '1px solid var(--border2)',
        borderRadius: 'var(--radius-xl)', padding: 28, width: '100%', maxWidth: 420,
        boxShadow: 'var(--shadow-lg)', animation: 'fadeUp 0.22s cubic-bezier(.16,1,.3,1)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 17 }}>💰 Rollover Monthly Savings</div>
            <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 3 }}>
              Adds your net savings (income − expenses) to Net Worth
            </div>
          </div>
          <button onClick={onClose} style={{
            width: 30, height: 30, borderRadius: '50%', border: 'none',
            background: 'var(--bg3)', cursor: 'pointer', fontSize: 16,
            color: 'var(--text2)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>×</button>
        </div>

        {!preview ? (
          <>
            <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 12, fontWeight: 500 }}>
              Select the month to roll over:
            </div>
            <div className="form-row" style={{ marginBottom: 16 }}>
              <div className="form-group">
                <label className="form-label">Month</label>
                <select className="form-input" value={month} onChange={e => setMonth(Number(e.target.value))}>
                  {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Year</label>
                <select className="form-input" value={year} onChange={e => setYear(Number(e.target.value))}>
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>

            <div style={{
              padding: '12px 14px', borderRadius: 10, background: 'var(--accent-soft)',
              border: '1px solid var(--accent)', fontSize: 12.5, color: 'var(--text)',
              marginBottom: 20, lineHeight: 1.6,
            }}>
              ℹ️ Calculates <strong>{MONTHS[month - 1]} {year}</strong>'s net savings (Income − Expenses)
              from your transactions and adds it as a <strong>Monthly Savings</strong> entry to Net Worth.
              Running again for the same month updates the existing entry.
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn-primary" onClick={handleRollover} disabled={loading}
                style={{ width: 'auto', padding: '9px 24px', fontSize: 13 }}>
                {loading ? 'Calculating…' : '✨ Roll Over'}
              </button>
              <button onClick={onClose} style={{
                padding: '9px 20px', fontSize: 13, background: 'var(--bg3)',
                border: '1px solid var(--border2)', borderRadius: 10,
                color: 'var(--text2)', cursor: 'pointer',
              }}>Cancel</button>
            </div>
          </>
        ) : (
          <div style={{ animation: 'fadeUp 0.3s ease' }}>
            <div style={{
              borderRadius: 12, padding: '16px 18px', marginBottom: 18,
              background: preview.isDeficit ? 'var(--red-soft)' : 'var(--accent-soft)',
              border: `1px solid ${preview.isDeficit ? 'var(--red)' : 'var(--accent)'}`,
            }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: preview.isDeficit ? 'var(--red)' : 'var(--accent)', marginBottom: 10 }}>
                {preview.isDeficit ? '⚠️ Deficit month' : '✅ ' + (preview.updated ? 'Updated' : 'Added')} for {preview.month}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                {[
                  { label: 'Income',   val: preview.income,  color: 'var(--accent)' },
                  { label: 'Expenses', val: preview.expense, color: 'var(--red)'    },
                  { label: 'Net',      val: Math.abs(Number(preview.netSavings)),
                    color: preview.isDeficit ? 'var(--red)' : '#f59e0b' },
                ].map(item => (
                  <div key={item.label} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 3 }}>{item.label}</div>
                    <div style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 13, color: item.color }}>
                      {fmt(item.val)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <button className="btn-primary" onClick={onClose}
              style={{ width: 'auto', padding: '9px 28px', fontSize: 13 }}>
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function NetWorthPage() {
  const toast = useToast()
  const { data: entries, loading, refetch } = useApi(netWorthApi.getAll)

  const [showForm,     setShowForm]     = useState(false)
  const [editEntry,    setEditEntry]    = useState(null)
  const [saving,       setSaving]       = useState(false)
  const [error,        setError]        = useState('')
  const [activeTab,    setActiveTab]    = useState('all')
  const [showRollover, setShowRollover] = useState(false)

  const emptyForm = {
    name: '', type: 'ASSET', category: 'Cash & Bank',
    amount: '', date: new Date().toISOString().split('T')[0], note: '',
  }
  const [form, setForm] = useState(emptyForm)

  const { totalAssets, totalLiabilities, totalMonthlySavings, netWorth,
          assetsByCategory, liabsByCategory, savingsByMonth } = useMemo(() => {
    if (!entries) return {
      totalAssets: 0, totalLiabilities: 0, totalMonthlySavings: 0,
      netWorth: 0, assetsByCategory: {}, liabsByCategory: {}, savingsByMonth: {},
    }
    let totalAssets = 0, totalLiabilities = 0, totalMonthlySavings = 0
    const assetsByCategory = {}, liabsByCategory = {}, savingsByMonth = {}

    entries.forEach(e => {
      const amt = Number(e.amount)
      if (e.type === 'ASSET') {
        totalAssets += amt
        assetsByCategory[e.category] = (assetsByCategory[e.category] || 0) + amt
      } else if (e.type === 'LIABILITY') {
        totalLiabilities += amt
        liabsByCategory[e.category] = (liabsByCategory[e.category] || 0) + amt
      } else if (e.type === 'MONTHLY_SAVINGS') {
        const isDeficit = e.note?.toLowerCase().includes('deficit')
        const signed    = isDeficit ? -amt : amt
        totalMonthlySavings += signed
        const label = e.monthLabel || e.name
        savingsByMonth[label] = signed
      }
    })

    return {
      totalAssets, totalLiabilities, totalMonthlySavings,
      netWorth: totalAssets - totalLiabilities + totalMonthlySavings,
      assetsByCategory, liabsByCategory, savingsByMonth,
    }
  }, [entries])

  const filtered = useMemo(() => {
    if (!entries) return []
    if (activeTab === 'assets')          return entries.filter(e => e.type === 'ASSET')
    if (activeTab === 'liabilities')     return entries.filter(e => e.type === 'LIABILITY')
    if (activeTab === 'monthly_savings') return entries.filter(e => e.type === 'MONTHLY_SAVINGS')
    return entries
  }, [entries, activeTab])

  const openAdd = () => {
    setEditEntry(null); setForm(emptyForm); setError(''); setShowForm(true)
  }

  const openEdit = (e) => {
    if (e.type === 'MONTHLY_SAVINGS') {
      toast.error('Monthly savings are auto-generated. Use Roll Over to update.')
      return
    }
    setEditEntry(e)
    setForm({ name: e.name, type: e.type, category: e.category,
              amount: String(e.amount), date: e.date, note: e.note || '' })
    setError('')
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!form.name.trim())                        return setError('Name is required')
    if (!form.amount || Number(form.amount) <= 0) return setError('Enter a valid amount')
    setSaving(true); setError('')
    try {
      const payload = { ...form, amount: Number(form.amount) }
      if (editEntry) {
        await netWorthApi.update(editEntry.id, payload)
        toast.success('Entry updated!')
      } else {
        await netWorthApi.create(payload)
        toast.success('Entry added!')
      }
      setShowForm(false); refetch()
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this entry?')) return
    try { await netWorthApi.delete(id); toast.success('Deleted'); refetch() }
    catch (e) { toast.error(e.message) }
  }

  const isPositive  = netWorth >= 0
  const savingsPos  = totalMonthlySavings >= 0
  const categories  = form.type === 'ASSET' ? ASSET_CATEGORIES : LIABILITY_CATEGORIES

  const TABS = [
    { key: 'all',             label: 'All Entries',        accent: 'var(--accent)', soft: 'var(--accent-soft)' },
    { key: 'assets',          label: '↑ Assets',           accent: 'var(--accent)', soft: 'var(--accent-soft)' },
    { key: 'liabilities',     label: '↓ Liabilities',      accent: 'var(--red)',    soft: 'var(--red-soft)'    },
    { key: 'monthly_savings', label: '💰 Monthly Savings',  accent: '#f59e0b',       soft: '#fef3c720'          },
  ]

  return (
    <div className="page-anim">

      {/* ── KPI Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 16, marginBottom: 16 }}>

        {/* Net Worth */}
        <div className="card" style={{ borderTop: `2px solid ${isPositive ? 'var(--accent)' : 'var(--red)'}` }}>
          <div className="card-label">Net Worth</div>
          <div className="card-value" style={{ color: isPositive ? 'var(--accent)' : 'var(--red)', fontSize: 24 }}>
            {fmt(netWorth)}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 4, fontFamily: 'var(--mono)' }}>
            {isPositive ? '▲ Assets + Savings exceed liabilities' : '▼ Liabilities exceed assets + savings'}
          </div>
          <MiniBarChart entries={entries} />
        </div>

        {/* Assets */}
        <div className="card" style={{ borderTop: '2px solid var(--accent)' }}>
          <div className="card-label">Total Assets</div>
          <div className="card-value" style={{ color: 'var(--accent)', fontSize: 24 }}>{fmt(totalAssets)}</div>
          <div style={{ marginTop: 12 }}>
            {Object.entries(assetsByCategory).sort(([,a],[,b]) => b - a).map(([cat, amt]) => (
              <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                <span style={{ color: 'var(--text2)' }}>{CAT_ICONS[cat]} {cat}</span>
                <span style={{ fontFamily: 'var(--mono)', fontWeight: 500 }}>{fmt(amt)}</span>
              </div>
            ))}
            {Object.keys(assetsByCategory).length === 0 && (
              <div style={{ fontSize: 12, color: 'var(--text3)' }}>No assets added yet</div>
            )}
          </div>
        </div>

        {/* Liabilities */}
        <div className="card" style={{ borderTop: '2px solid var(--red)' }}>
          <div className="card-label">Total Liabilities</div>
          <div className="card-value" style={{ color: 'var(--red)', fontSize: 24 }}>{fmt(totalLiabilities)}</div>
          <div style={{ marginTop: 12 }}>
            {Object.entries(liabsByCategory).sort(([,a],[,b]) => b - a).map(([cat, amt]) => (
              <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                <span style={{ color: 'var(--text2)' }}>{CAT_ICONS[cat]} {cat}</span>
                <span style={{ fontFamily: 'var(--mono)', fontWeight: 500 }}>{fmt(amt)}</span>
              </div>
            ))}
            {Object.keys(liabsByCategory).length === 0 && (
              <div style={{ fontSize: 12, color: 'var(--text3)' }}>No liabilities added yet</div>
            )}
          </div>
        </div>

        {/* Monthly Savings — NEW CARD */}
        <div className="card" style={{ borderTop: '2px solid #f59e0b' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
            <div className="card-label" style={{ marginBottom: 0 }}>Monthly Savings</div>
            <button onClick={() => setShowRollover(true)} title="Roll over month's savings" style={{
              fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 8,
              border: '1px solid #f59e0b', background: '#fef3c720', color: '#f59e0b',
              cursor: 'pointer', whiteSpace: 'nowrap',
            }}>+ Roll Over</button>
          </div>
          <div className="card-value" style={{ color: savingsPos ? '#f59e0b' : 'var(--red)', fontSize: 24 }}>
            {savingsPos ? '' : '-'}{fmt(Math.abs(totalMonthlySavings))}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 4, fontFamily: 'var(--mono)' }}>
            {savingsPos ? '▲ Cumulative monthly surplus' : '▼ Cumulative monthly deficit'}
          </div>
          <div style={{ marginTop: 12 }}>
            {Object.entries(savingsByMonth)
              .sort(([a], [b]) => b.localeCompare(a))
              .slice(0, 4)
              .map(([month, amt]) => {
                const pos = amt >= 0
                return (
                  <div key={month} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                    <span style={{ color: 'var(--text2)' }}>📅 {month}</span>
                    <span style={{ fontFamily: 'var(--mono)', fontWeight: 500, color: pos ? '#f59e0b' : 'var(--red)' }}>
                      {pos ? '+' : '-'}{fmt(Math.abs(amt))}
                    </span>
                  </div>
                )
              })}
            {Object.keys(savingsByMonth).length === 0 && (
              <div style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.5 }}>
                No rollover yet.{' '}
                <span onClick={() => setShowRollover(true)}
                  style={{ color: '#f59e0b', cursor: 'pointer', textDecoration: 'underline' }}>
                  Roll over last month
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Toolbar ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {TABS.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
            padding: '7px 14px', borderRadius: 8, border: '1px solid',
            fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s',
            borderColor: activeTab === tab.key ? tab.accent : 'var(--border2)',
            background:  activeTab === tab.key ? tab.soft  : 'transparent',
            color:       activeTab === tab.key ? tab.accent : 'var(--text2)',
          }}>{tab.label}</button>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button onClick={() => setShowRollover(true)} style={{
            padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
            border: '1px solid #f59e0b', background: '#fef3c720', color: '#f59e0b', cursor: 'pointer',
          }}>💰 Roll Over Savings</button>
          <button className="btn-primary" onClick={openAdd}
            style={{ padding: '7px 18px', fontSize: 13, width: 'auto' }}>
            + Add Entry
          </button>
        </div>
      </div>

      {/* ── Add / Edit Form ── */}
      {showForm && (
        <div className="card" style={{ marginBottom: 20, borderColor: form.type === 'ASSET' ? 'var(--accent)' : 'var(--red)' }}>
          <div className="section-title" style={{ marginBottom: 16 }}>{editEntry ? 'Edit Entry' : 'Add Entry'}</div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, background: 'var(--bg3)', borderRadius: 10, padding: 3, marginBottom: 18 }}>
            {['ASSET', 'LIABILITY'].map(t => (
              <div key={t} onClick={() => setForm(s => ({ ...s, type: t, category: t === 'ASSET' ? 'Cash & Bank' : 'Home Loan' }))}
                style={{
                  padding: '8px', textAlign: 'center', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 500,
                  transition: 'all 0.15s',
                  background: form.type === t ? 'var(--bg2)' : 'transparent',
                  color: form.type === t ? (t === 'ASSET' ? 'var(--accent)' : 'var(--red)') : 'var(--text2)',
                  boxShadow: form.type === t ? 'var(--shadow-xs)' : 'none',
                }}>
                {t === 'ASSET' ? '↑ Asset' : '↓ Liability'}
              </div>
            ))}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Name</label>
              <input className="form-input" placeholder="e.g. SBI Savings Account"
                value={form.name} onChange={e => setForm(s => ({ ...s, name: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-input" value={form.category}
                onChange={e => setForm(s => ({ ...s, category: e.target.value }))}>
                {categories.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Amount (₹)</label>
              <input className="form-input" type="number" placeholder="0"
                value={form.amount} onChange={e => setForm(s => ({ ...s, amount: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && handleSave()} />
            </div>
            <div className="form-group">
              <label className="form-label">Date</label>
              <input className="form-input" type="date" value={form.date}
                onChange={e => setForm(s => ({ ...s, date: e.target.value }))} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Note <span style={{ color: 'var(--text3)', fontSize: 11 }}>(optional)</span></label>
            <input className="form-input" placeholder="Any notes…"
              value={form.note} onChange={e => setForm(s => ({ ...s, note: e.target.value }))} />
          </div>

          {error && <div style={{ color: 'var(--red)', fontSize: 13, marginBottom: 10 }}>{error}</div>}

          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn-primary" onClick={handleSave} disabled={saving}
              style={{ width: 'auto', padding: '9px 24px', fontSize: 13,
                background: form.type === 'ASSET' ? 'var(--accent)' : 'var(--red)' }}>
              {saving ? 'Saving…' : editEntry ? 'Update' : 'Add Entry'}
            </button>
            <button onClick={() => setShowForm(false)}
              style={{ padding: '9px 20px', fontSize: 13, background: 'var(--bg3)',
                border: '1px solid var(--border2)', borderRadius: 10, color: 'var(--text2)', cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Entries List ── */}
      <div className="card">
        {loading && <RowSkeleton count={5} />}

        {!loading && filtered.length === 0 && (
          <div style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--text2)' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>
              {activeTab === 'monthly_savings' ? '💰' : '⚖️'}
            </div>
            <div style={{ fontWeight: 500, marginBottom: 4 }}>
              {activeTab === 'monthly_savings' ? 'No monthly savings rolled over yet' : 'No entries yet'}
            </div>
            <div style={{ fontSize: 12 }}>
              {activeTab === 'monthly_savings'
                ? <span>Click <strong>Roll Over Savings</strong> to add last month's net savings here</span>
                : 'Add your assets and liabilities to track your net worth'}
            </div>
          </div>
        )}

        {!loading && filtered.map((e, i) => {
          const isAsset   = e.type === 'ASSET'
          const isSavings = e.type === 'MONTHLY_SAVINGS'
          const isDeficit = isSavings && e.note?.toLowerCase().includes('deficit')

          const iconBg = isAsset   ? 'var(--accent-soft)'
                       : isSavings ? '#fef3c740'
                       : 'var(--red-soft)'
          const amtClr = isAsset   ? 'var(--accent)'
                       : isSavings ? (isDeficit ? 'var(--red)' : '#f59e0b')
                       : 'var(--red)'
          const prefix = isAsset ? '+' : isSavings ? (isDeficit ? '-' : '+') : '-'

          return (
            <div key={e.id} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '13px 0', borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none',
              animation: 'fadeUp 0.3s ease both', animationDelay: i * 0.04 + 's',
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
              }}>
                {CAT_ICONS[e.category] || (isAsset ? '📦' : isSavings ? '💰' : '📋')}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ fontWeight: 500, fontSize: 13.5 }}>{e.name}</div>
                  {isSavings && (
                    <span style={{
                      fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 4,
                      background: '#fef3c740', color: '#f59e0b', border: '1px solid #f59e0b50',
                    }}>AUTO</span>
                  )}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text2)', fontFamily: 'var(--mono)', marginTop: 2 }}>
                  {e.category} · {e.date}{e.note ? ` · ${e.note}` : ''}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                <div style={{ fontFamily: 'var(--mono)', fontWeight: 600, fontSize: 14, color: amtClr }}>
                  {prefix}{fmt(e.amount)}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {!isSavings && (
                    <button onClick={() => openEdit(e)} style={{
                      background: 'none', border: '1px solid var(--border2)', borderRadius: 6,
                      padding: '3px 8px', fontSize: 11, color: 'var(--text2)', cursor: 'pointer',
                    }}>✎ Edit</button>
                  )}
                  {isSavings && (
                    <button onClick={() => setShowRollover(true)} style={{
                      background: 'none', border: '1px solid #f59e0b50', borderRadius: 6,
                      padding: '3px 8px', fontSize: 11, color: '#f59e0b', cursor: 'pointer',
                    }}>↺ Update</button>
                  )}
                  <button onClick={() => handleDelete(e.id)} style={{
                    background: 'none', border: '1px solid var(--border2)', borderRadius: 6,
                    padding: '3px 8px', fontSize: 11, color: 'var(--red)', cursor: 'pointer',
                  }}>✕</button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {showRollover && (
        <RolloverModal
          onClose={() => setShowRollover(false)}
          onSuccess={() => { refetch(); setShowRollover(false) }}
        />
      )}
    </div>
  )
}