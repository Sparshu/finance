import { useState } from 'react'
import { CATEGORIES } from '../data/sampleData'
import { txApi } from '../api/services'
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

  const handleSave = async () => {
    if (!name.trim())  return setError('Description is required')
    if (!amount || isNaN(amount) || Number(amount) <= 0) return setError('Enter a valid amount')
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
      onSaved?.()
      onClose()
    } catch (e) {
      setError(e.message || 'Failed to save')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <button className={styles.closeBtn} onClick={onClose}>×</button>
        <div className={styles.title}>Add Transaction</div>
        <div className={styles.sub}>Record a new income or expense entry</div>

        <div className={styles.typeToggle}>
          <button
            className={`${styles.typeBtn} ${type === 'INCOME' ? styles.activeIncome : ''}`}
            onClick={() => setType('INCOME')}
          >
            ▲ Income
          </button>
          <button
            className={`${styles.typeBtn} ${type === 'EXPENSE' ? styles.activeExpense : ''}`}
            onClick={() => setType('EXPENSE')}
          >
            ▼ Expense
          </button>
        </div>

        <div className="form-group">
          <label className="form-label">Description</label>
          <input
            className="form-input"
            placeholder="e.g. Grocery shopping"
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Amount (₹)</label>
            <input
              className="form-input"
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={e => setAmount(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Category</label>
            <select
              className="form-input"
              value={cat}
              onChange={e => setCat(e.target.value)}
            >
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>

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
            <label className="form-label">Note (optional)</label>
            <input
              className="form-input"
              placeholder="Any notes..."
              value={note}
              onChange={e => setNote(e.target.value)}
            />
          </div>
        </div>

        {error && (
          <div style={{ color: 'var(--red)', fontSize: 13, marginBottom: 8 }}>{error}</div>
        )}

        <button className="btn-primary" onClick={handleSave} disabled={loading} style={{ marginTop: 8 }}>
          {loading ? 'Saving…' : 'Save Transaction →'}
        </button>
      </div>
    </div>
  )
}