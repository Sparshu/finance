import { INVESTMENTS, fmt } from '../data/sampleData'
import styles from './InvestmentsPage.module.css'

export default function InvestmentsPage() {
  const total = INVESTMENTS.reduce((s, inv) => s + inv.curr * inv.qty, 0)
  const gain  = INVESTMENTS.reduce((s, inv) => s + (inv.curr - inv.buy) * inv.qty, 0)

  return (
    <div className="page-anim">
      <div className="grid-3 mb12">
        {[
          { label: 'Portfolio Value', val: fmt(total),              color: 'var(--green)' },
          { label: 'Total Gain/Loss', val: fmt(gain),               color: gain >= 0 ? 'var(--green)' : 'var(--red)' },
          { label: 'No. of Holdings', val: INVESTMENTS.length,      color: 'var(--blue)' },
        ].map((c, i) => (
          <div className="card" key={i}>
            <div className="card-label">{c.label}</div>
            <div className="card-value" style={{ color: c.color, fontSize: 24 }}>{c.val}</div>
          </div>
        ))}
      </div>

      <div className="card mt16">
        <div className="section-header">
          <div className="section-title">Holdings</div>
          <span className="badge badge-blue">NSE / BSE</span>
        </div>

        {INVESTMENTS.map((inv, i) => (
          <div className={styles.investRow} key={i}>
            <div className={styles.ticker}>{inv.ticker.slice(0, 3)}</div>
            <div style={{ flex: 1 }}>
              <div className={styles.investName}>{inv.name}</div>
              <div className={styles.investQty}>{inv.qty} units · Avg {fmt(inv.buy)}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className={styles.investPrice}>{fmt(inv.curr)}</div>
              <div
                className={styles.investChange}
                style={{ color: inv.change >= 0 ? 'var(--green)' : 'var(--red)' }}
              >
                {inv.change >= 0 ? '▲' : '▼'} {Math.abs(inv.change)}%
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
