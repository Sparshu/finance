import { useState, useMemo } from 'react'
import { useApi } from '../api/useApi'
import { netWorthApi } from '../api/services'
import { useToast } from '../components/Toast'
import { RowSkeleton, CardSkeleton } from '../components/Skeleton'
import { fmt } from '../data/sampleData'

const ASSET_CATEGORIES     = ['Cash & Bank', 'Investments', 'Real Estate', 'Vehicle', 'Gold & Jewellery', 'Other Asset']
const LIABILITY_CATEGORIES = ['Home Loan', 'Car Loan', 'Personal Loan', 'Credit Card', 'Education Loan', 'Other Liability']

const CAT_ICONS = {
  'Cash & Bank': '🏦', 'Investments': '📈', 'Real Estate': '🏠',
  'Vehicle': '🚗', 'Gold & Jewellery': '💛', 'Other Asset': '📦',
  'Home Loan': '🏠', 'Car Loan': '🚗', 'Personal Loan': '💸',
  'Credit Card': '💳', 'Education Loan': '🎓', 'Other Liability': '📋',
}

function MiniBarChart({ entries }) {
  if (!entries || entries.length === 0) return null

  // Group net worth by month
  const monthMap = {}
  entries.forEach(e => {
    const m = e.date?.slice(0, 7)
    if (!m) return
    if (!monthMap[m]) monthMap[m] = { assets: 0, liabilities: 0 }
    if (e.type === 'ASSET')     monthMap[m].assets      += Number(e.amount)
    if (e.type === 'LIABILITY') monthMap[m].liabilities += Number(e.amount)
  })

  const months = Object.entries(monthMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([m, v]) => ({
      label: new Date(m + '-01').toLocaleDateString('en-IN', { month: 'short' }),
      net:   v.assets - v.liabilities,
      assets: v.assets,
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

export default function NetWorthPage() {
  const toast = useToast()
  const { data: entries, loading, refetch } = useApi(netWorthApi.getAll)

  const [showForm,  setShowForm]  = useState(false)
  const [editEntry, setEditEntry] = useState(null)
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState('')
  const [activeTab, setActiveTab] = useState('all') // all | assets | liabilities

  const emptyForm = { name: '', type: 'ASSET', category: 'Cash & Bank', amount: '', date: new Date().toISOString().split('T')[0], note: '' }
  const [form, setForm] = useState(emptyForm)

  // Computed totals
  const { totalAssets, totalLiabilities, netWorth, assetsByCategory, liabsByCategory } = useMemo(() => {
    if (!entries) return { totalAssets: 0, totalLiabilities: 0, netWorth: 0, assetsByCategory: {}, liabsByCategory: {} }
    let totalAssets = 0, totalLiabilities = 0
    const assetsByCategory = {}, liabsByCategory = {}
    entries.forEach(e => {
      const amt = Number(e.amount)
      if (e.type === 'ASSET') {
        totalAssets += amt
        assetsByCategory[e.category] = (assetsByCategory[e.category] || 0) + amt
      } else {
        totalLiabilities += amt
        liabsByCategory[e.category] = (liabsByCategory[e.category] || 0) + amt
      }
    })
    return { totalAssets, totalLiabilities, netWorth: totalAssets - totalLiabilities, assetsByCategory, liabsByCategory }
  }, [entries])

  const filtered = useMemo(() => {
    if (!entries) return []
    if (activeTab === 'assets')      return entries.filter(e => e.type === 'ASSET')
    if (activeTab === 'liabilities') return entries.filter(e => e.type === 'LIABILITY')
    return entries
  }, [entries, activeTab])

  const openAdd = () => {
    setEditEntry(null)
    setForm(emptyForm)
    setError('')
    setShowForm(true)
  }

  const openEdit = (e) => {
    setEditEntry(e)
    setForm({ name: e.name, type: e.type, category: e.category, amount: String(e.amount), date: e.date, note: e.note || '' })
    setError('')
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!form.name.trim())                              return setError('Name is required')
    if (!form.amount || Number(form.amount) <= 0)       return setError('Enter a valid amount')
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
      setShowForm(false)
      refetch()
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

  const isPositive = netWorth >= 0
  const categories = form.type === 'ASSET' ? ASSET_CATEGORIES : LIABILITY_CATEGORIES

  return (
    <div className="page-anim">

      {/* ── KPI Cards ── */}
      <div className="grid-3 mb12">
        <div className="card" style={{ borderTop: `2px solid ${isPositive ? 'var(--accent)' : 'var(--red)'}` }}>
          <div className="card-label">Net Worth</div>
          <div className="card-value" style={{ color: isPositive ? 'var(--accent)' : 'var(--red)', fontSize: 24 }}>
            {fmt(netWorth)}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 4, fontFamily: 'var(--mono)' }}>
            {isPositive ? '▲ Assets exceed liabilities' : '▼ Liabilities exceed assets'}
          </div>
          <MiniBarChart entries={entries} />
        </div>

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
      </div>

      {/* ── Toolbar ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {['all', 'assets', 'liabilities'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            padding: '7px 16px', borderRadius: 8, border: '1px solid',
            fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s',
            borderColor:  activeTab === tab ? (tab === 'liabilities' ? 'var(--red)' : tab === 'assets' ? 'var(--accent)' : 'var(--accent)') : 'var(--border2)',
            background:   activeTab === tab ? (tab === 'liabilities' ? 'var(--red-soft)' : 'var(--accent-soft)') : 'transparent',
            color:        activeTab === tab ? (tab === 'liabilities' ? 'var(--red)' : 'var(--accent)') : 'var(--text2)',
          }}>
            {tab === 'all' ? 'All Entries' : tab === 'assets' ? '↑ Assets' : '↓ Liabilities'}
          </button>
        ))}
        <button className="btn-primary" onClick={openAdd}
          style={{ padding: '7px 18px', fontSize: 13, width: 'auto', marginLeft: 'auto' }}>
          + Add Entry
        </button>
      </div>

      {/* ── Add / Edit Form ── */}
      {showForm && (
        <div className="card" style={{ marginBottom: 20, borderColor: form.type === 'ASSET' ? 'var(--accent)' : 'var(--red)' }}>
          <div className="section-title" style={{ marginBottom: 16 }}>
            {editEntry ? 'Edit Entry' : 'Add Entry'}
          </div>

          {/* Asset / Liability toggle */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, background: 'var(--bg3)', borderRadius: 10, padding: 3, marginBottom: 18 }}>
            {['ASSET', 'LIABILITY'].map(t => (
              <div key={t} onClick={() => { setForm(s => ({ ...s, type: t, category: t === 'ASSET' ? 'Cash & Bank' : 'Home Loan' })) }}
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
              style={{ padding: '9px 20px', fontSize: 13, background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 10, color: 'var(--text2)', cursor: 'pointer' }}>
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
            <div style={{ fontSize: 36, marginBottom: 12 }}>⚖️</div>
            <div style={{ fontWeight: 500, marginBottom: 4 }}>No entries yet</div>
            <div style={{ fontSize: 12 }}>Add your assets and liabilities to track your net worth</div>
          </div>
        )}

        {!loading && filtered.map((e, i) => {
          const isAsset = e.type === 'ASSET'
          return (
            <div key={e.id} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '13px 0', borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none',
              animation: 'fadeUp 0.3s ease both', animationDelay: i * 0.04 + 's',
            }}>
              {/* Icon */}
              <div style={{
                width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                background: isAsset ? 'var(--accent-soft)' : 'var(--red-soft)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
              }}>
                {CAT_ICONS[e.category] || (isAsset ? '📦' : '📋')}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 500, fontSize: 13.5, marginBottom: 2 }}>{e.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text2)', fontFamily: 'var(--mono)' }}>
                  {e.category} · {e.date}{e.note ? ` · ${e.note}` : ''}
                </div>
              </div>

              {/* Amount + actions */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                <div style={{ fontFamily: 'var(--mono)', fontWeight: 600, fontSize: 14,
                  color: isAsset ? 'var(--accent)' : 'var(--red)' }}>
                  {isAsset ? '+' : '-'}{fmt(e.amount)}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => openEdit(e)} style={{
                    background: 'none', border: '1px solid var(--border2)', borderRadius: 6,
                    padding: '3px 8px', fontSize: 11, color: 'var(--text2)', cursor: 'pointer',
                  }}>✎ Edit</button>
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
    </div>
  )
}