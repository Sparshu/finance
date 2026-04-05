import { useState, useEffect, useRef } from 'react'
import { billApi, budgetApi, goalApi } from '../api/services'
import { fmt } from '../data/sampleData'

export default function NotificationsPanel({ onNavigate }) {
  const [open,      setOpen]      = useState(false)
  const [bills,     setBills]     = useState([])
  const [budgets,   setBudgets]   = useState([])
  const [goals,     setGoals]     = useState([])
  const [loading,   setLoading]   = useState(false)
  const ref = useRef(null)

  // Fetch fresh data every time the panel opens
  useEffect(() => {
    if (!open) return
    setLoading(true)
    Promise.all([
      billApi.getAll().catch(() => []),
      budgetApi.getAll().catch(() => []),
      goalApi.getAll().catch(() => []),
    ]).then(([b, bu, g]) => {
      setBills(b   || [])
      setBudgets(bu || [])
      setGoals(g   || [])
    }).finally(() => setLoading(false))
  }, [open])

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // ── Build notifications from real data ─────────────────────────────────────
  const notifications = []

  const today = new Date().getDate()

  // Bills marked DUE
  bills.filter(b => b.status === 'DUE').forEach(b => {
    notifications.push({
      id:     `bill-due-${b.id}`,
      type:   'error',
      icon:   '⏰',
      title:  `${b.name} is due now!`,
      body:   `${fmt(b.amount)} — mark it as paid`,
      action: 'bills',
    })
  })

  // Upcoming bills due within 5 days
  bills.filter(b => b.status === 'UPCOMING' && b.dueDay >= today && b.dueDay <= today + 5).forEach(b => {
    const daysLeft = b.dueDay - today
    notifications.push({
      id:     `bill-soon-${b.id}`,
      type:   'warning',
      icon:   '📅',
      title:  `${b.name} due in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`,
      body:   `${fmt(b.amount)} on day ${b.dueDay}`,
      action: 'bills',
    })
  })

  // Over-budget — spent > limit
  budgets.forEach(b => {
    const spent = Number(b.spent) || 0
    const limit = Number(b.limit) || 0
    if (limit > 0 && spent > limit) {
      notifications.push({
        id:     `budget-over-${b.id}`,
        type:   'error',
        icon:   '⚠️',
        title:  `${b.category} budget exceeded`,
        body:   `Spent ${fmt(spent)} of ${fmt(limit)} — over by ${fmt(spent - limit)}`,
        action: 'budgets',
      })
    }
  })

  // Near-budget — 85–100% used
  budgets.forEach(b => {
    const spent = Number(b.spent) || 0
    const limit = Number(b.limit) || 0
    if (limit > 0) {
      const pct = spent / limit
      if (pct >= 0.85 && pct < 1.0) {
        notifications.push({
          id:     `budget-warn-${b.id}`,
          type:   'warning',
          icon:   '📊',
          title:  `${b.category} at ${Math.round(pct * 100)}% of budget`,
          body:   `${fmt(limit - spent)} remaining this month`,
          action: 'budgets',
        })
      }
    }
  })

  // Goals reached
  goals.filter(g => Number(g.progressPercent) >= 100).forEach(g => {
    notifications.push({
      id:     `goal-done-${g.id}`,
      type:   'success',
      icon:   '🎉',
      title:  `Goal reached: ${g.name}`,
      body:   `You saved ${fmt(g.targetAmount)}!`,
      action: 'goals',
    })
  })

  // Goals almost there (90–99%)
  goals.filter(g => Number(g.progressPercent) >= 90 && Number(g.progressPercent) < 100).forEach(g => {
    const remaining = Number(g.targetAmount) - Number(g.savedAmount)
    notifications.push({
      id:     `goal-near-${g.id}`,
      type:   'info',
      icon:   '🎯',
      title:  `Almost there: ${g.name}`,
      body:   `${g.progressPercent}% complete — just ${fmt(remaining)} to go!`,
      action: 'goals',
    })
  })

  const unread = notifications.length

  const typeStyle = {
    error:   { bg: 'var(--red-soft)',    dot: 'var(--red)'    },
    warning: { bg: 'var(--amber-soft)',  dot: 'var(--amber)'  },
    success: { bg: 'var(--accent-soft)', dot: 'var(--accent)' },
    info:    { bg: 'var(--blue-soft)',   dot: 'var(--blue)'   },
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>

      {/* Bell button */}
      <div
        onClick={() => setOpen(o => !o)}
        title="Notifications"
        style={{
          width: 36, height: 36, borderRadius: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: open ? 'var(--bg3)' : 'var(--bg2)',
          border: '1px solid var(--border2)',
          cursor: 'pointer', fontSize: 16, position: 'relative',
          transition: 'background 0.15s',
        }}
      >
        🔔
        {unread > 0 && !open && (
          <div style={{
            position: 'absolute', top: 5, right: 5,
            width: 7, height: 7, borderRadius: '50%',
            background: 'var(--red)',
            border: '1.5px solid var(--bg2)',
            animation: 'pulse-dot 2s infinite',
          }} />
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', right: 0,
          width: 348,
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
          zIndex: 1000, overflow: 'hidden',
          animation: 'fadeUp 0.18s ease both',
        }}>

          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 18px', borderBottom: '1px solid var(--border)',
          }}>
            <div style={{ fontWeight: 600, fontSize: 14 }}>Notifications</div>
            {unread > 0
              ? <span style={{ background: 'var(--red-soft)', color: 'var(--red)', borderRadius: 100, padding: '2px 9px', fontSize: 11, fontWeight: 600 }}>
                  {unread} alert{unread > 1 ? 's' : ''}
                </span>
              : <span style={{ color: 'var(--text3)', fontSize: 12 }}>Up to date</span>
            }
          </div>

          {/* Body */}
          <div style={{ maxHeight: 400, overflowY: 'auto' }}>
            {loading ? (
              <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text2)', fontSize: 13 }}>
                Loading…
              </div>
            ) : notifications.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text2)' }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>✓</div>
                <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>All caught up!</div>
                <div style={{ fontSize: 12 }}>No budget overages, due bills, or alerts</div>
              </div>
            ) : (
              notifications.map((n, i) => {
                const s = typeStyle[n.type] || typeStyle.info
                return (
                  <div
                    key={n.id}
                    onClick={() => { onNavigate(n.action); setOpen(false) }}
                    style={{
                      display: 'flex', gap: 12, padding: '13px 18px', cursor: 'pointer',
                      borderBottom: i < notifications.length - 1 ? '1px solid var(--border)' : 'none',
                      alignItems: 'flex-start', transition: 'background 0.1s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{
                      width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                      background: s.bg,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 17,
                    }}>
                      {n.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 500, fontSize: 13, color: 'var(--text)', marginBottom: 2 }}>
                        {n.title}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.45 }}>
                        {n.body}
                      </div>
                    </div>
                    <div style={{
                      width: 7, height: 7, borderRadius: '50%',
                      background: s.dot, flexShrink: 0, marginTop: 6,
                    }} />
                  </div>
                )
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && !loading && (
            <div style={{
              padding: '10px 18px', borderTop: '1px solid var(--border)',
              textAlign: 'center', fontSize: 12, color: 'var(--text3)',
            }}>
              Tap any alert to go there
            </div>
          )}
        </div>
      )}
    </div>
  )
}