import { useState } from 'react'
import { CATEGORIES } from '../data/sampleData'
import styles from './AddModal.module.css'

export default function AddModal({ onClose }) {
  const [type,   setType]   = useState('expense')
  const [name,   setName]   = useState('')
  const [amount, setAmount] = useState('')
  const [cat,    setCat]    = useState('Food')

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <button className={styles.closeBtn} onClick={onClose}>×</button>
        <div className={styles.title}>Add Transaction</div>
        <div className={styles.sub}>Record a new income or expense entry</div>

        <div className={styles.typeToggle}>
          <button
            className={`${styles.typeBtn} ${type === 'income' ? styles.activeIncome : ''}`}
            onClick={() => setType('income')}
          >
            ▲ Income
          </button>
          <button
            className={`${styles.typeBtn} ${type === 'expense' ? styles.activeExpense : ''}`}
            onClick={() => setType('expense')}
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

        <div className="form-group">
          <label className="form-label">Date</label>
          <input
            className="form-input"
            type="date"
            defaultValue={new Date().toISOString().split('T')[0]}
          />
        </div>

        <button className="btn-primary" onClick={onClose} style={{ marginTop: 8 }}>
          Save Transaction →
        </button>
      </div>
    </div>
  )
}
