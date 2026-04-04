import { useMemo } from 'react'
import { useApi } from '../api/useApi'
import { txApi } from '../api/services'
import { CardSkeleton } from '../components/Skeleton'
import { fmt } from '../data/sampleData'
import styles from './ReportsPage.module.css'

const CAT_COLORS = {
  Food: 'var(--green)', Transport: 'var(--blue)', Entertainment: 'var(--red)',
  Health: 'var(--amber)', Shopping: 'var(--purple)', Bills: 'var(--blue)',
  Income: 'var(--green)', Other: 'var(--text2)',
}

const COLOR_LIST = [
  'var(--green)', 'var(--blue)', 'var(--amber)', 'var(--red)',
  'var(--purple)', '#00bcd4', '#ff9800', '#e91e63',
]

function DonutChart({ cats }) {
  const cx = 90, cy = 90, r = 68, stroke = 26
  const circ = 2 * Math.PI * r
  let offset = 0
  const total = cats.reduce((s, c) => s + c.pct, 0)

  return (
    <svg width="180" height="180" viewBox="0 0 180 180">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--bg3)" strokeWidth={stroke} />
      {cats.map((c, i) => {
        const pct  = total > 0 ? (c.pct / total) * 100 : 0
        const dash = (pct / 100) * circ
        const gap  = circ - dash
        const rot  = (offset / 100) * 360 - 90
        offset += pct
        return (
          <circle
            key={i}
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={c.color}
            strokeWidth={stroke}
            strokeDasharray={`${dash} ${gap}`}
            style={{ transform: `rotate(${rot}deg)`, transformOrigin: `${cx}px ${cy}px`, transition: 'stroke-dasharray 1s ease' }}
          />
        )
      })}
      <text x={cx} y={cy - 5} textAnchor="middle" fill="var(--text)" fontSize="13" fontFamily="var(--mono)" fontWeight="500">
        {cats.length} cats
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle" fill="var(--text2)" fontSize="10" fontFamily="var(--mono)">
        expenses
      </text>
    </svg>
  )
}

function BarChart({ data, maxVal }) {
  if (!data.length) return <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text2)', fontSize: 13 }}>Not enough data</div>
  return (
    <div className={styles.chartBars}>
      {data.map((d, i) => (
        <div className={styles.chartCol} key={i}>
          <div className={styles.barPair}>
            <div className={styles.barIncome}  style={{ height: maxVal > 0 ? (d.income  / maxVal * 100) + '%' : '0%', animationDelay: i * 0.07 + 's' }} />
            <div className={styles.barExpense} style={{ height: maxVal > 0 ? (d.expense / maxVal * 100) + '%' : '0%', animationDelay: i * 0.07 + 's' }} />
          </div>
          <span className={styles.barLabel}>{d.m}</span>
        </div>
      ))}
    </div>
  )
}

export default function ReportsPage() {
  const { data: txs, loading } = useApi(txApi.getAll)

  const { monthlyData, catData, totals, savingsRate } = useMemo(() => {
    if (!txs) return { monthlyData: [], catData: [], totals: {}, savingsRate: 0 }

    // Group by month
    const monthMap = {}
    txs.forEach(t => {
      const m = t.date?.slice(0, 7)
      if (!m) return
      if (!monthMap[m]) monthMap[m] = { income: 0, expense: 0 }
      if (t.type === 'INCOME')  monthMap[m].income  += Number(t.amount)
      if (t.type === 'EXPENSE') monthMap[m].expense += Number(t.amount)
    })
    const monthlyData = Object.entries(monthMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([m, v]) => ({
        m:    new Date(m + '-01').toLocaleDateString('en-IN', { month: 'short' }),
        full: m,
        ...v,
        saved: v.income - v.expense,
      }))

    // Group expenses by category
    const catMap = {}
    txs.filter(t => t.type === 'EXPENSE').forEach(t => {
      catMap[t.category] = (catMap[t.category] || 0) + Number(t.amount)
    })
    const catTotal = Object.values(catMap).reduce((s, v) => s + v, 0)
    const catData = Object.entries(catMap)
      .sort(([, a], [, b]) => b - a)
      .map(([name, amount], i) => ({
        name, amount,
        pct: catTotal > 0 ? Math.round((amount / catTotal) * 100) : 0,
        color: CAT_COLORS[name] || COLOR_LIST[i % COLOR_LIST.length],
      }))

    const totalIncome  = txs.filter(t => t.type === 'INCOME').reduce((s, t) => s + Number(t.amount), 0)
    const totalExpense = txs.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + Number(t.amount), 0)
    const savingsRate  = totalIncome > 0 ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100) : 0

    return {
      monthlyData,
      catData,
      totals: { income: totalIncome, expense: totalExpense, net: totalIncome - totalExpense },
      savingsRate,
    }
  }, [txs])

  const maxVal = monthlyData.length ? Math.max(...monthlyData.map(d => d.income), 1) : 1

  if (loading) return (
    <div className="page-anim">
      <div className="grid-3 mb12"><CardSkeleton /><CardSkeleton /><CardSkeleton /></div>
      <div className="grid-12"><CardSkeleton lines={6} /><CardSkeleton lines={6} /></div>
    </div>
  )

  return (
    <div className="page-anim">
      {/* Summary KPIs */}
      <div className="grid-4 mb12">
        {[
          { label: 'Total Income',   value: fmt(totals.income),  color: 'var(--green)' },
          { label: 'Total Expense',  value: fmt(totals.expense), color: 'var(--red)'   },
          { label: 'Net Savings',    value: fmt(totals.net),     color: totals.net >= 0 ? 'var(--blue)' : 'var(--red)' },
          { label: 'Savings Rate',   value: `${savingsRate}%`,   color: savingsRate > 20 ? 'var(--green)' : savingsRate > 0 ? 'var(--amber)' : 'var(--red)' },
        ].map((c, i) => (
          <div className="card" key={i} style={{ animationDelay: i * 0.06 + 's', borderTop: `2px solid ${c.color}` }}>
            <div className="card-label">{c.label}</div>
            <div className="card-value" style={{ color: c.color, fontSize: 22 }}>{c.value}</div>
          </div>
        ))}
      </div>

      <div className="grid-12">
        {/* Donut — spending by category */}
        <div className="card">
          <div className="section-title" style={{ marginBottom: 16 }}>Spending by Category</div>
          {catData.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text2)', fontSize: 13 }}>No expense data yet</div>
          ) : (
            <div className={styles.donutWrap}>
              <DonutChart cats={catData} />
              <div style={{ flex: 1 }}>
                {catData.map((c, i) => (
                  <div className={styles.legendItem} key={i}>
                    <div className={styles.legendDot} style={{ background: c.color }} />
                    <span style={{ flex: 1, fontSize: 13 }}>{c.name}</span>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--text2)' }}>{fmt(c.amount)}</span>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: c.color, marginLeft: 8, minWidth: 32, textAlign: 'right' }}>{c.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Monthly bar chart */}
        <div className="card">
          <div className="section-header">
            <div className="section-title">Income vs Expenses</div>
            <div style={{ display: 'flex', gap: 12, fontSize: 11, fontFamily: 'var(--mono)' }}>
              <span style={{ color: 'var(--green)' }}>▬ Income</span>
              <span style={{ color: 'var(--red)' }}>▬ Expense</span>
            </div>
          </div>
          <BarChart data={monthlyData} maxVal={maxVal} />
        </div>
      </div>

      {/* Monthly breakdown table */}
      <div className="card mt16">
        <div className="section-title" style={{ marginBottom: 16 }}>Monthly Breakdown</div>
        {monthlyData.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--text2)', fontSize: 13 }}>No data yet</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Month</th>
                <th>Income</th>
                <th>Expenses</th>
                <th>Saved</th>
                <th>Savings %</th>
                <th>Trend</th>
              </tr>
            </thead>
            <tbody>
              {monthlyData.map((d, i) => {
                const rate = d.income > 0 ? Math.round((d.saved / d.income) * 100) : 0
                return (
                  <tr key={i}>
                    <td style={{ fontFamily: 'var(--mono)', color: 'var(--text2)' }}>{d.m}</td>
                    <td style={{ color: 'var(--green)', fontFamily: 'var(--mono)' }}>{fmt(d.income)}</td>
                    <td style={{ color: 'var(--red)',   fontFamily: 'var(--mono)' }}>{fmt(d.expense)}</td>
                    <td style={{ color: d.saved >= 0 ? 'var(--blue)' : 'var(--red)', fontFamily: 'var(--mono)', fontWeight: 500 }}>
                      {d.saved >= 0 ? '+' : ''}{fmt(d.saved)}
                    </td>
                    <td>
                      <span className={`badge ${rate > 20 ? 'badge-green' : rate > 0 ? 'badge-amber' : 'badge-red'}`}>
                        {rate}%
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1, background: 'var(--bg3)', borderRadius: 100, height: 5, overflow: 'hidden' }}>
                          <div style={{
                            height: '100%', borderRadius: 100,
                            width: maxVal > 0 ? (d.income / maxVal * 100) + '%' : '0%',
                            background: 'var(--green)', opacity: .6,
                          }} />
                        </div>
                        <div style={{ flex: 1, background: 'var(--bg3)', borderRadius: 100, height: 5, overflow: 'hidden' }}>
                          <div style={{
                            height: '100%', borderRadius: 100,
                            width: maxVal > 0 ? (d.expense / maxVal * 100) + '%' : '0%',
                            background: 'var(--red)', opacity: .6,
                          }} />
                        </div>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}