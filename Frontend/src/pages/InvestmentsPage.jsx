import { useState } from 'react'
import { useApi } from '../api/useApi'
import { investApi } from '../api/services'
import { fmt } from '../data/sampleData'
import styles from './InvestmentsPage.module.css'

export default function InvestmentsPage() {
  const { data: invs, loading, refetch } = useApi(investApi.getAll)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ ticker: '', name: '', quantity: '', buyPrice: '', currentPrice: '', purchaseDate: '' })
  const [priceUpdate, setPriceUpdate] = useState({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const totalValue = (invs || []).reduce((s, i) => s + Number(i.currentValue), 0)
  const totalGain  = (invs || []).reduce((s, i) => s + Number(i.gainLoss), 0)

  const handleCreate = async () => {
    if (!form.ticker.trim() || !form.name.trim()) return setError('Ticker and name are required')
    if (!form.quantity || !form.buyPrice) return setError('Quantity and buy price are required')
    setSaving(true); setError('')
    try {
      await investApi.create({
        ticker:       form.ticker.toUpperCase(),
        name:         form.name,
        quantity:     Number(form.quantity),
        buyPrice:     Number(form.buyPrice),
        currentPrice: form.currentPrice ? Number(form.currentPrice) : null,
        purchaseDate: form.purchaseDate || null,
      })
      setForm({ ticker: '', name: '', quantity: '', buyPrice: '', currentPrice: '', purchaseDate: '' })
      setShowForm(false)
      refetch()
    } catch (e) { setError(e.message) } finally { setSaving(false) }
  }

  const handlePriceUpdate = async (id) => {
    const price = Number(priceUpdate[id])
    if (!price || price <= 0) return
    try {
      await investApi.updatePrice(id, price)
      setPriceUpdate(s => ({ ...s, [id]: '' }))
      refetch()
    } catch (e) { alert(e.message) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Remove this investment?')) return
    try { await investApi.delete(id); refetch() } catch (e) { alert(e.message) }
  }

  return (
    <div className="page-anim">
      <div className="grid-3 mb12">
        <div className="card" style={{ borderTop: '2px solid var(--green)' }}>
          <div className="card-label">Portfolio Value</div>
          <div className="card-value" style={{ color: 'var(--green)', fontSize: 22 }}>{fmt(totalValue)}</div>
        </div>
        <div className="card" style={{ borderTop: `2px solid ${totalGain >= 0 ? 'var(--green)' : 'var(--red)'}` }}>
          <div className="card-label">Total Gain / Loss</div>
          <div className="card-value" style={{ color: totalGain >= 0 ? 'var(--green)' : 'var(--red)', fontSize: 22 }}>
            {totalGain >= 0 ? '+' : ''}{fmt(totalGain)}
          </div>
        </div>
        <div className="card" style={{ borderTop: '2px solid var(--blue)' }}>
          <div className="card-label">Holdings</div>
          <div className="card-value" style={{ color: 'var(--blue)', fontSize: 22 }}>{(invs || []).length}</div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button className="btn-primary" onClick={() => setShowForm(s => !s)} style={{ padding: '8px 18px', fontSize: 13 }}>
          {showForm ? '✕ Cancel' : '+ Add Holding'}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="section-title" style={{ marginBottom: 16 }}>New Investment</div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Ticker</label>
              <input className="form-input" placeholder="RELIANCE" value={form.ticker}
                onChange={e => setForm(s => ({ ...s, ticker: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Name</label>
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
              <label className="form-label">Current Price (₹)</label>
              <input className="form-input" type="number" placeholder="Optional" value={form.currentPrice}
                onChange={e => setForm(s => ({ ...s, currentPrice: e.target.value }))} />
            </div>
          </div>
          {error && <div style={{ color: 'var(--red)', fontSize: 13, marginBottom: 8 }}>{error}</div>}
          <button className="btn-primary" onClick={handleCreate} disabled={saving} style={{ padding: '8px 20px', fontSize: 13 }}>
            {saving ? 'Saving…' : 'Add Investment'}
          </button>
        </div>
      )}

      <div className="card">
        {loading && <div style={{ padding: 40, textAlign: 'center', color: 'var(--text2)' }}>Loading portfolio…</div>}
        {!loading && (!invs || invs.length === 0) && (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text2)' }}>No investments yet</div>
        )}
        {!loading && (invs || []).map((inv, i) => {
          const gain = Number(inv.gainLoss)
          return (
            <div className={styles.invRow} key={inv.id} style={{ animationDelay: i * 0.05 + 's' }}>
              <div className={styles.invLeft}>
                <div className={styles.ticker}>{inv.ticker}</div>
                <div className={styles.invName}>{inv.name}</div>
                <div className={styles.invMeta}>
                  {inv.quantity} units · Buy: {fmt(inv.buyPrice)}
                </div>
              </div>
              <div className={styles.invMid}>
                <div style={{ fontSize: 13, color: 'var(--text2)' }}>Current</div>
                <div style={{ fontWeight: 600 }}>{fmt(inv.currentPrice)}</div>
                <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                  <input
                    className="form-input"
                    type="number"
                    placeholder="Update price"
                    style={{ width: 120, padding: '4px 8px', fontSize: 11 }}
                    value={priceUpdate[inv.id] || ''}
                    onChange={e => setPriceUpdate(s => ({ ...s, [inv.id]: e.target.value }))}
                  />
                  <button className="btn-primary" onClick={() => handlePriceUpdate(inv.id)}
                    style={{ padding: '4px 10px', fontSize: 11 }}>↻</button>
                </div>
              </div>
              <div className={styles.invRight}>
                <div className={styles.invValue}>{fmt(inv.currentValue)}</div>
                <div style={{ color: gain >= 0 ? 'var(--green)' : 'var(--red)', fontSize: 13, marginTop: 2 }}>
                  {gain >= 0 ? '+' : ''}{fmt(gain)} ({gain >= 0 ? '+' : ''}{inv.gainLossPercent}%)
                </div>
                <button onClick={() => handleDelete(inv.id)}
                  style={{ marginTop: 6, background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', fontSize: 12 }}>✕ Remove</button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}