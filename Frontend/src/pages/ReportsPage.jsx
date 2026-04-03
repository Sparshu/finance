import { CHART_DATA, fmt } from '../data/sampleData'
import styles from './ReportsPage.module.css'

const SPEND_CATS = [
  { name: 'Food',        pct: 28, color: 'var(--green)'  },
  { name: 'Transport',   pct: 14, color: 'var(--blue)'   },
  { name: 'Bills',       pct: 22, color: 'var(--purple)' },
  { name: 'Health',      pct: 10, color: 'var(--amber)'  },
  { name: 'Shopping',    pct: 26, color: 'var(--red)'    },
]

function DonutChart({ cats }) {
  const cx = 90, cy = 90, r = 70, stroke = 28
  const circ = 2 * Math.PI * r
  let offset = 0

  return (
    <svg width="180" height="180" viewBox="0 0 180 180">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--bg3)" strokeWidth={stroke} />
      {cats.map((c, i) => {
        const dash = (c.pct / 100) * circ
        const gap  = circ - dash
        const rot  = (offset / 100) * 360 - 90
        offset += c.pct
        return (
          <circle
            key={i}
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={c.color}
            strokeWidth={stroke}
            strokeDasharray={`${dash} ${gap}`}
            style={{ transform: `rotate(${rot}deg)`, transformOrigin: `${cx}px ${cy}px` }}
          />
        )
      })}
      <text x={cx} y={cy - 4} textAnchor="middle" fill="var(--text)" fontSize="18" fontFamily="var(--mono)" fontWeight="500">June</text>
      <text x={cx} y={cy + 16} textAnchor="middle" fill="var(--text2)" fontSize="11" fontFamily="var(--mono)">2024</text>
    </svg>
  )
}

export default function ReportsPage() {
  return (
    <div className="page-anim">
      <div className="grid-12">
        {/* Donut */}
        <div className="card">
          <div className="section-title mb12">Spending by Category</div>
          <div className={styles.donutWrap}>
            <DonutChart cats={SPEND_CATS} />
            <div>
              {SPEND_CATS.map((c, i) => (
                <div className={styles.legendItem} key={i}>
                  <div className={styles.legendDot} style={{ background: c.color }} />
                  <span style={{ flex: 1 }}>{c.name}</span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text2)' }}>{c.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Monthly summary */}
        <div className="card">
          <div className="section-title mb12">Monthly Summary</div>
          {CHART_DATA.map((d, i) => {
            const saved = d.income - d.expense
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text2)', width: 28 }}>{d.m}</span>
                <div style={{ flex: 1 }}>
                  <div className="progress-wrap">
                    <div className="progress-fill" style={{ width: Math.round(d.income  / 110000 * 100) + '%', background: 'var(--green)', opacity: .8 }} />
                  </div>
                  <div className="progress-wrap" style={{ marginTop: 4 }}>
                    <div className="progress-fill" style={{ width: Math.round(d.expense / 110000 * 100) + '%', background: 'var(--red)', opacity: .7 }} />
                  </div>
                </div>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: saved >= 0 ? 'var(--green)' : 'var(--red)', width: 52, textAlign: 'right' }}>
                  {saved >= 0 ? '+' : ''}{(saved / 1000).toFixed(0)}k
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
