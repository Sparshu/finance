import { useState, useRef, useCallback } from 'react'
import { receiptApi } from '../api/services'
import { txApi } from '../api/services'
import { useToast } from './Toast'
import { CATEGORIES } from '../data/sampleData'

const fmt = (n) => {
  const num = Number(n)
  if (isNaN(num)) return '₹0'
  return '₹' + num.toLocaleString('en-IN', { maximumFractionDigits: 2 })
}

const STEPS = { UPLOAD: 'upload', SCANNING: 'scanning', REVIEW: 'review', SAVING: 'saving', DONE: 'done' }

export default function ReceiptScanner({ onClose, onSaved }) {
  const [step,      setStep]      = useState(STEPS.UPLOAD)
  const [preview,   setPreview]   = useState(null)   // data URL for img tag
  const [imageB64,  setImageB64]  = useState(null)   // base64 string for API
  const [extracted, setExtracted] = useState(null)   // AI result
  const [form,      setForm]      = useState(null)   // editable form state
  const [error,     setError]     = useState('')
  const [dragging,  setDragging]  = useState(false)
  const fileRef = useRef(null)
  const toast   = useToast()

  // ── Image loading ──────────────────────────────────────────────────────────
  const compressImage = (dataUrl) => {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        // Max dimension 800px to keep file size well under Groq's limits
        const MAX = 800
        let { width, height } = img
        if (width > MAX || height > MAX) {
          if (width > height) { height = Math.round(height * MAX / width); width = MAX }
          else { width = Math.round(width * MAX / height); height = MAX }
        }
        canvas.width = width
        canvas.height = height
        canvas.getContext('2d').drawImage(img, 0, 0, width, height)
        // Compress to JPEG at 65% quality — sufficient for text/receipt OCR
        resolve(canvas.toDataURL('image/jpeg', 0.65))
      }
      img.src = dataUrl
    })
  }

  const loadImage = useCallback((file) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (JPG, PNG, WEBP)')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be under 10MB')
      return
    }
    setError('')
    const reader = new FileReader()
    reader.onload = async (e) => {
      const compressed = await compressImage(e.target.result)
      setPreview(compressed)
      setImageB64(compressed)
    }
    reader.readAsDataURL(file)
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    loadImage(file)
  }, [loadImage])

  const handleDragOver = (e) => { e.preventDefault(); setDragging(true) }
  const handleDragLeave = () => setDragging(false)

  // ── Scan ───────────────────────────────────────────────────────────────────
  const handleScan = async () => {
    if (!imageB64) return
    setStep(STEPS.SCANNING)
    setError('')
    try {
      const data = await receiptApi.scan(imageB64)
      setExtracted(data)
      setForm({
        name:     data.name     || '',
        amount:   String(data.amount || ''),
        type:     data.type     || 'EXPENSE',
        category: data.category || 'Other',
        date:     data.date     || new Date().toISOString().split('T')[0],
        note:     data.note     || '',
      })
      setStep(STEPS.REVIEW)
    } catch (e) {
      setError(e.message || 'Failed to scan receipt')
      setStep(STEPS.UPLOAD)
    }
  }

  // ── Save transaction ───────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.name.trim())                              return setError('Name is required')
    if (!form.amount || Number(form.amount) <= 0)       return setError('Enter a valid amount')
    setStep(STEPS.SAVING)
    try {
      await txApi.create({
        name:     form.name.trim(),
        amount:   Number(form.amount),
        type:     form.type,
        category: form.category,
        date:     form.date,
        note:     form.note || null,
      })
      toast.success('Transaction saved from receipt! 🧾')
      onSaved?.()
      setStep(STEPS.DONE)
      setTimeout(onClose, 1200)
    } catch (e) {
      setError(e.message || 'Failed to save')
      setStep(STEPS.REVIEW)
    }
  }

  const reset = () => {
    setStep(STEPS.UPLOAD)
    setPreview(null)
    setImageB64(null)
    setExtracted(null)
    setForm(null)
    setError('')
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.45)',
        backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1001,
        animation: 'fadeIn 0.15s ease',
      }}
    >
      <div style={{
        background: 'var(--bg2)',
        border: '1px solid var(--border2)',
        borderRadius: 'var(--radius-xl)',
        padding: 28,
        width: '100%', maxWidth: 500,
        maxHeight: '90vh', overflowY: 'auto',
        boxShadow: 'var(--shadow-lg)',
        animation: 'fadeUp 0.22s cubic-bezier(.16,1,.3,1)',
      }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 18, letterSpacing: '-0.3px' }}>
              🧾 Scan Receipt
            </div>
            <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>
              Upload a receipt photo — AI will extract the details
            </div>
          </div>
          <button onClick={onClose} style={{
            width: 30, height: 30, borderRadius: '50%', border: 'none',
            background: 'var(--bg3)', cursor: 'pointer', fontSize: 16,
            color: 'var(--text2)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>×</button>
        </div>

        {/* Step indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 24 }}>
          {['Upload', 'Scan', 'Review'].map((label, i) => {
            const stepKeys = [STEPS.UPLOAD, STEPS.SCANNING, STEPS.REVIEW]
            const active = stepKeys.indexOf(step) >= i
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{
                  width: 22, height: 22, borderRadius: '50%', fontSize: 11, fontWeight: 600,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: active ? 'var(--accent)' : 'var(--bg3)',
                  color: active ? '#fff' : 'var(--text3)',
                  transition: 'all 0.3s',
                }}>{i + 1}</div>
                <span style={{ fontSize: 11, color: active ? 'var(--text)' : 'var(--text3)', fontWeight: active ? 500 : 400 }}>
                  {label}
                </span>
                {i < 2 && <div style={{ width: 24, height: 1, background: 'var(--border2)' }} />}
              </div>
            )
          })}
        </div>

        {/* ── UPLOAD STEP ── */}
        {(step === STEPS.UPLOAD) && (
          <>
            {/* Drop zone */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => !preview && fileRef.current?.click()}
              style={{
                border: `2px dashed ${dragging ? 'var(--accent)' : preview ? 'var(--accent)' : 'var(--border2)'}`,
                borderRadius: 'var(--radius-lg)',
                background: dragging ? 'var(--accent-soft)' : preview ? 'var(--bg3)' : 'var(--bg3)',
                padding: 20,
                textAlign: 'center',
                cursor: preview ? 'default' : 'pointer',
                transition: 'all 0.15s',
                marginBottom: 16,
                minHeight: 180,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              {preview ? (
                <>
                  <img src={preview} alt="Receipt preview"
                    style={{ maxHeight: 260, maxWidth: '100%', borderRadius: 10, objectFit: 'contain', marginBottom: 10 }} />
                  <button onClick={e => { e.stopPropagation(); reset() }}
                    style={{ fontSize: 12, color: 'var(--text2)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                    Remove & upload different image
                  </button>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>📷</div>
                  <div style={{ fontWeight: 500, fontSize: 14, marginBottom: 6 }}>
                    {dragging ? 'Drop it here!' : 'Drop receipt here or click to upload'}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text2)' }}>JPG, PNG, WEBP · Max 10MB</div>
                </>
              )}
            </div>

            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
              onChange={e => loadImage(e.target.files[0])} />

            {/* Camera capture on mobile */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
              <button onClick={() => fileRef.current?.click()} style={{
                flex: 1, padding: '10px', fontSize: 13, background: 'var(--bg3)',
                border: '1px solid var(--border2)', borderRadius: 'var(--radius)',
                color: 'var(--text2)', cursor: 'pointer', fontWeight: 500,
              }}>
                🖼️ Choose File
              </button>
              <button onClick={() => {
                const input = document.createElement('input')
                input.type = 'file'; input.accept = 'image/*'; input.capture = 'environment'
                input.onchange = e => loadImage(e.target.files[0])
                input.click()
              }} style={{
                flex: 1, padding: '10px', fontSize: 13, background: 'var(--bg3)',
                border: '1px solid var(--border2)', borderRadius: 'var(--radius)',
                color: 'var(--text2)', cursor: 'pointer', fontWeight: 500,
              }}>
                📸 Take Photo
              </button>
            </div>

            {error && (
              <div style={{ color: 'var(--red)', fontSize: 12.5, marginBottom: 12,
                padding: '8px 12px', background: 'var(--red-soft)', borderRadius: 8 }}>
                {error}
              </div>
            )}

            <button className="btn-primary" onClick={handleScan} disabled={!preview}
              style={{ background: preview ? 'var(--accent)' : undefined }}>
              ✨ Scan with AI
            </button>
          </>
        )}

        {/* ── SCANNING STEP ── */}
        {step === STEPS.SCANNING && (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ fontSize: 48, marginBottom: 16, animation: 'pulse-dot 1s infinite' }}>🔍</div>
            <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>Analyzing receipt…</div>
            <div style={{ fontSize: 13, color: 'var(--text2)' }}>AI is extracting transaction details</div>
            <div style={{ marginTop: 20, display: 'flex', gap: 6, justifyContent: 'center' }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)',
                  animation: `typing 1.2s ease-in-out infinite`,
                  animationDelay: `${i * 0.15}s`,
                }} />
              ))}
            </div>
          </div>
        )}

        {/* ── REVIEW STEP ── */}
        {step === STEPS.REVIEW && form && (
          <>
            <div style={{
              display: 'flex', gap: 16, marginBottom: 20,
            }}>
              {/* Thumbnail */}
              {preview && (
                <img src={preview} alt="Receipt"
                  style={{ width: 80, height: 100, objectFit: 'cover', borderRadius: 10, flexShrink: 0, border: '1px solid var(--border2)' }} />
              )}
              {/* AI extracted badge */}
              <div style={{
                flex: 1, padding: '12px 14px',
                background: 'var(--accent-soft)', borderRadius: 12,
                border: '1px solid var(--accent)',
                display: 'flex', flexDirection: 'column', justifyContent: 'center',
              }}>
                <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600, marginBottom: 4 }}>
                  ✓ AI extracted successfully
                </div>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{extracted?.name}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: form.type === 'INCOME' ? 'var(--accent)' : 'var(--red)', marginTop: 4 }}>
                  {form.type === 'INCOME' ? '+' : '-'}{fmt(form.amount)}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 2 }}>
                  {form.category} · {form.date}
                </div>
              </div>
            </div>

            <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 14, fontWeight: 500 }}>
              Review and edit before saving:
            </div>

            {/* Income/Expense toggle */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, background: 'var(--bg3)', borderRadius: 10, padding: 3, marginBottom: 16 }}>
              {['EXPENSE', 'INCOME'].map(t => (
                <div key={t} onClick={() => setForm(s => ({ ...s, type: t }))}
                  style={{
                    padding: '7px', textAlign: 'center', borderRadius: 8, cursor: 'pointer',
                    fontSize: 13, fontWeight: 500, transition: 'all 0.15s',
                    background: form.type === t ? 'var(--bg2)' : 'transparent',
                    color: form.type === t ? (t === 'INCOME' ? 'var(--accent)' : 'var(--red)') : 'var(--text2)',
                    boxShadow: form.type === t ? 'var(--shadow-xs)' : 'none',
                  }}>
                  {t === 'INCOME' ? '↑ Income' : '↓ Expense'}
                </div>
              ))}
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <input className="form-input" value={form.name}
                onChange={e => setForm(s => ({ ...s, name: e.target.value }))} />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Amount (₹)</label>
                <input className="form-input" type="number" value={form.amount}
                  onChange={e => setForm(s => ({ ...s, amount: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="form-input" value={form.category}
                  onChange={e => setForm(s => ({ ...s, category: e.target.value }))}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Date</label>
                <input className="form-input" type="date" value={form.date}
                  onChange={e => setForm(s => ({ ...s, date: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Note</label>
                <input className="form-input" value={form.note}
                  onChange={e => setForm(s => ({ ...s, note: e.target.value }))} placeholder="Optional" />
              </div>
            </div>

            {error && (
              <div style={{ color: 'var(--red)', fontSize: 12.5, marginBottom: 12,
                padding: '8px 12px', background: 'var(--red-soft)', borderRadius: 8 }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn-primary" onClick={handleSave}
                style={{ background: form.type === 'INCOME' ? 'var(--accent)' : 'var(--red)' }}>
                💾 Save Transaction
              </button>
              <button onClick={reset} style={{
                padding: '13px', fontSize: 14, background: 'var(--bg3)',
                border: '1px solid var(--border2)', borderRadius: 'var(--radius)',
                color: 'var(--text2)', cursor: 'pointer', whiteSpace: 'nowrap',
              }}>
                ↺ Rescan
              </button>
            </div>
          </>
        )}

        {/* ── SAVING STEP ── */}
        {step === STEPS.SAVING && (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>💾</div>
            <div style={{ fontWeight: 600, fontSize: 15 }}>Saving transaction…</div>
          </div>
        )}

        {/* ── DONE STEP ── */}
        {step === STEPS.DONE && (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
            <div style={{ fontWeight: 600, fontSize: 16, color: 'var(--accent)' }}>Transaction saved!</div>
          </div>
        )}
      </div>
    </div>
  )
}