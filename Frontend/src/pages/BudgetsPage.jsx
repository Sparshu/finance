import { BUDGETS, fmt } from '../data/sampleData'

export default function BudgetsPage() {
  return (
    <div className="page-anim">
      <div className="grid-3">
        {BUDGETS.map((b, i) => {
          const pct  = Math.round(b.spent / b.limit * 100)
          const over = pct > 100
          return (
            <div className="card" key={i} style={{ animationDelay: i * 0.07 + 's' }}>
              <div className="card-label">{b.cat}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 }}>
                <div className="card-value" style={{ fontSize: 24, color: over ? 'var(--red)' : b.color }}>
                  {fmt(b.spent)}
                </div>
                <span className={`badge ${over ? 'badge-red' : 'badge-green'}`}>{pct}%</span>
              </div>
              <div className="progress-wrap">
                <div
                  className="progress-fill"
                  style={{ width: Math.min(pct, 100) + '%', background: over ? 'var(--red)' : b.color }}
                />
              </div>
              <div style={{ marginTop: 8, fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--text2)' }}>
                Limit: {fmt(b.limit)} · Remaining: {fmt(Math.max(b.limit - b.spent, 0))}
              </div>
              {over && (
                <div style={{ marginTop: 8, fontSize: 11, color: 'var(--red)', fontFamily: 'var(--mono)' }}>
                  ⚠ Over budget by {fmt(b.spent - b.limit)}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
