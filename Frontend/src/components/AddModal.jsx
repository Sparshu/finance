import { useState, useEffect } from 'react'
import { CATEGORIES } from '../data/sampleData'
import { txApi } from '../api/services'
import { useToast } from './Toast'
import styles from './AddModal.module.css'

export default function AddModal({ onClose, onSaved }) {
  const [type,    setType]    = useState('EXPENSE')
  const [name,    setName]    = useState('')
  const [amount,  setAmount]  = useState('')
  const [cat,     setCat]     = useState('Food')
  const [date,    setDate]    = useState(new Date().toISOString().split('T')[0])
  const [note,    setNote]    = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const toast = useToast()

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const handleSave = async () => {
    if (!name.trim())                                     return setError('Description is required')
    if (!amount || isNaN(amount) || Number(amount) <= 0) return setError('Enter a valid amount')
    if (!date)                                            return setError('Date is required')
    setError('')
    setLoading(true)
    try {
      await txApi.create({
        name:     name.trim(),
        amount:   Number(amount),
        type,
        category: cat,
        date,
        note:     note.trim() || null,
      })
      toast.success('Transaction saved!')
      onSaved?.()
      onClose()
    } catch (e) {
      setError(e.message || 'Failed to save. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const isIncome = type === 'INCOME'

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div className={styles.title}>Add Transaction</div>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        {/* Type toggle — uses existing .tabs / .tab CSS */}
        <div className={styles.tabs} style={{ marginBottom: 22 }}>
          <div
            className={`${styles.tab} ${!isIncome ? styles.active : ''}`}
            onClick={() => setType('EXPENSE')}
            style={{ color: !isIncome ? 'var(--red)' : undefined }}
          >
            ↓ Expense
          </div>
          <div
            className={`${styles.tab} ${isIncome ? styles.active : ''}`}
            onClick={() => setType('INCOME')}
            style={{ color: isIncome ? 'var(--accent)' : undefined }}
          >
            ↑ Income
          </div>
        </div>

        {/* Description */}
        <div className="form-group">
          <label className="form-label">Description</label>
          <input
            className="form-input"
            placeholder="e.g. Grocery shopping"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            autoFocus
          />
        </div>

        {/* Amount + Category */}
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Amount (₹)</label>
            <input
              className="form-input"
              type="number"
              placeholder="0"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Category</label>
            <select
              className="form-input"
              value={cat}
              onChange={e => setCat(e.target.value)}
            >
              {CATEGORIES
                .filter(c => isIncome ? c === 'Income' || c === 'Other' : c !== 'Income')
                .map(c => <option key={c}>{c}</option>)
              }
            </select>
          </div>
        </div>

        {/* Date + Note */}
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Date</label>
            <input
              className="form-input"
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Note <span style={{ color: 'var(--text3)', fontSize: 11 }}>(optional)</span></label>
            <input
              className="form-input"
              placeholder="Any notes…"
              value={note}
              onChange={e => setNote(e.target.value)}
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            color: 'var(--red)', fontSize: 12.5, marginBottom: 12,
            padding: '8px 12px', background: 'var(--red-soft)',
            borderRadius: 8, border: '1px solid rgba(255,59,48,0.2)',
          }}>
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          className="btn-primary"
          onClick={handleSave}
          disabled={loading}
          style={{
            marginTop: 4,
            background: isIncome ? 'var(--accent)' : 'var(--red)',
          }}
        >
          {loading ? 'Saving…' : `Save ${isIncome ? 'Income' : 'Expense'}`}
        </button>
      </div>
    </div>
  )
}