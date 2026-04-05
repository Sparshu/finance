import { useState } from 'react'
import { useApi } from '../api/useApi'
import { investApi } from '../api/services'
import { useToast } from '../components/Toast'
import { RowSkeleton } from '../components/Skeleton'
import { fmt } from '../data/sampleData'
import styles from './InvestmentsPage.module.css'

export default function InvestmentsPage() {
  const toast = useToast()
  const { data: invs, loading, refetch } = useApi(investApi.getAll)
  const [showForm,     setShowForm]     = useState(false)
  const [priceUpdate,  setPriceUpdate]  = useState({})
  const [saving,       setSaving]       = useState(false)
  const [error,        setError]        = useState('')
  const [form, setForm] = useState({
    ticker: '', name: '', quantity: '', buyPrice: '', currentPrice: '', purchaseDate: ''
  })

  const totalValue = (invs || []).reduce((s, i) => s + Number(i.currentValue  || 0), 0)
  const totalGain  = (invs || []).reduce((s, i) => s + Number(i.gainLoss      || 0), 0)
  const totalCost  = (invs || []).reduce((s, i) => s + Number(i.buyPrice || 0) * Number(i.quantity || 0), 0)
  const overallPct = totalCost > 0 ? ((totalGain / totalCost) * 100).toFixed(2) : 0

  const handleCreate = async () => {
    if (!form.ticker.trim() || !form.name.trim()) return setError('Ticker and name are required')
    if (!form.quantity || Number(form.quantity) <= 0) return setError('Enter a valid quantity')
    if (!form.buyPrice || Number(form.buyPrice) <= 0) return setError('Enter a valid buy price')
    setSaving(true); setError('')
    try {
      await investApi.create({
        ticker:       form.ticker.trim().toUpperCase(),
        name:         form.name.trim(),
        quantity:     Number(form.quantity),
        buyPrice:     Number(form.buyPrice),
        currentPrice: form.currentPrice ? Number(form.currentPrice) : null,
        purchaseDate: form.purchaseDate || null,
      })
      setForm({ ticker: '', name: '', quantity: '', buyPrice: '', currentPrice: '', purchaseDate: '' })
      setShowForm(false)
      toast.success('Investment added!')
      refetch()
    } catch (e) { setError(e.message) } finally { setSaving(false) }
  }

  const handlePriceUpdate = async (id) => {
    const price = Number(priceUpdate[id])
    if (!price || price <= 0) return toast.error('Enter a valid price')
    try {
      await investApi.updatePrice(id, price)
      setPriceUpdate(s => ({ ...s, [id]: '' }))
      toast.success('Price updated!')
      refetch()
    } catch (e) { toast.error(e.message) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Remove this investment?')) return
    try {
      await investApi.delete(id)
      toast.success('Investment removed')
      refetch()
    } catch (e) { toast.error(e.message) }
  }

  return (
    <div className="page-anim">
      {/* Summary cards */}
      <div className="grid-3 mb12">
        <div className="card" style={{ borderTop: '2px solid var(--accent)' }}>
          <div className="card-label">Portfolio Value</div>
          <div className="card-value" style={{ color: 'var(--accent)', fontSize: 22 }}>{fmt(totalValue)}</div>
        </div>
        <div className="card" style={{ borderTop: `2px solid ${totalGain >= 0 ? 'var(--accent)' : 'var(--red)'}` }}>
          <div className="card-label">Total Gain / Loss</div>
          <div className="card-value" style={{ color: totalGain >= 0 ? 'var(--accent)' : 'var(--red)', fontSize: 22 }}>
            {totalGain >= 0 ? '+' : ''}{fmt(totalGain)}
            <span style={{ fontSize: 13, marginLeft: 6, opacity: 0.7 }}>({overallPct}%)</span>
          </div>
        </div>
        <div className="card" style={{ borderTop: '2px solid var(--blue)' }}>
          <div className="card-label">Holdings</div>
          <div className="card-value" style={{ color: 'var(--blue)', fontSize: 22 }}>{(invs || []).length}</div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button className="btn-primary" onClick={() => setShowForm(s => !s)}
          style={{ padding: '8px 18px', fontSize: 13, width: 'auto' }}>
          {showForm ? '✕ Cancel' : '+ Add Holding'}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 20, borderColor: 'var(--accent)' }}>
          <div className="section-title" style={{ marginBottom: 16 }}>New Investment</div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Ticker Symbol</label>
              <input className="form-input" placeholder="RELIANCE" value={form.ticker}
                onChange={e => setForm(s => ({ ...s, ticker: e.target.value.toUpperCase() }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Company Name</label>
              <input className="form-input" placeholder="Reliance Industries" value={form.name}
                onChange={e => setForm(s => ({ ...s, name: e.target.value }))} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Quantity</label>
              <input className="form-input" type="number" placeholder="10" value={form.quantity}
                onChange={e => setForm(s => ({ ...s, quantity: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Buy Price (₹)</label>
              <input className="form-input" type="number" placeholder="2800" value={form.buyPrice}
                onChange={e => setForm(s => ({ ...s, buyPrice: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Current Price (₹) <span style={{ color: 'var(--text3)', fontSize: 10 }}>optional</span></label>
              <input className="form-input" type="number" placeholder="3042" value={form.currentPrice}
                onChange={e => setForm(s => ({ ...s, currentPrice: e.target.value }))} />
            </div>
          </div>
          {error && <div style={{ color: 'var(--red)', fontSize: 13, marginBottom: 10 }}>{error}</div>}
          <button className="btn-primary" onClick={handleCreate} disabled={saving}
            style={{ padding: '8px 20px', fontSize: 13, width: 'auto' }}>
            {saving ? 'Saving…' : 'Add Investment'}
          </button>
        </div>
      )}

      <div className="card">
        {loading && <RowSkeleton count={4} />}

        {!loading && (!invs || invs.length === 0) && (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text2)' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>△</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 13 }}>No investments yet — add your first holding!</div>
          </div>
        )}

        {!loading && (invs || []).map((inv, i) => {
          const gain = Number(inv.gainLoss || 0)
          const pct  = Number(inv.gainLossPercent || 0)
          return (
            <div className={styles.invRow} key={inv.id} style={{ animationDelay: i * 0.05 + 's' }}>
              <div className={styles.ticker}>{inv.ticker}</div>
              <div className={styles.invLeft}>
                <div className={styles.invName}>{inv.name}</div>
                <div className={styles.invMeta}>
                  {inv.quantity} units · Bought at {fmt(inv.buyPrice)}
                </div>
              </div>
              <div className={styles.invMid}>
                <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 4, fontFamily: 'var(--mono)' }}>Update price</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input
                    className="form-input"
                    type="number"
                    placeholder={String(inv.currentPrice)}
                    style={{ width: 110, padding: '5px 8px', fontSize: 11 }}
                    value={priceUpdate[inv.id] || ''}
                    onChange={e => setPriceUpdate(s => ({ ...s, [inv.id]: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && handlePriceUpdate(inv.id)}
                  />
                  <button className="btn-primary" onClick={() => handlePriceUpdate(inv.id)}
                    style={{ padding: '5px 10px', fontSize: 11, width: 'auto' }}>↻</button>
                </div>
              </div>
              <div className={styles.invRight}>
                <div className={styles.invValue}>{fmt(inv.currentValue)}</div>
                <div style={{ color: gain >= 0 ? 'var(--accent)' : 'var(--red)', fontSize: 12, fontFamily: 'var(--mono)', marginTop: 3 }}>
                  {gain >= 0 ? '+' : ''}{fmt(gain)} ({gain >= 0 ? '+' : ''}{pct}%)
                </div>
                <button onClick={() => handleDelete(inv.id)}
                  style={{ marginTop: 6, background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 11, fontFamily: 'var(--mono)' }}>
                  ✕ Remove
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}