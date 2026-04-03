import { SAMPLE_TXS, BUDGETS, CHART_DATA, fmt } from '../data/sampleData'
import styles from './DashboardPage.module.css'

export default function DashboardPage({ onAdd }) {
  const totalIncome  = SAMPLE_TXS.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const totalExpense = SAMPLE_TXS.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const net          = totalIncome - totalExpense
  const maxVal       = Math.max(...CHART_DATA.map(d => d.income))

  const summaryCards = [
    { label: 'Net Balance',  value: fmt(net),          delta: '+12.4%', up: true,  color: 'var(--green)' },
    { label: 'Total Income', value: fmt(totalIncome),  delta: '+8.2%',  up: true,  color: 'var(--blue)' },
    { label: 'Total Spent',  value: fmt(totalExpense), delta: '-3.1%',  up: false, color: 'var(--red)' },
    { label: 'Investments',  value: fmt(328500),       delta: '+6.8%',  up: true,  color: 'var(--amber)' },
  ]

  return (
    <div className="page-anim">
      {/* KPI cards */}
      <div className="grid-4 mb12">
        {summaryCards.map((c, i) => (
          <div className="card" key={i} style={{ animationDelay: i * 0.06 + 's', borderTop: `2px solid ${c.color}` }}>
            <div className="card-label">{c.label}</div>
            <div className="card-value" style={{ color: c.color, fontSize: 22 }}>{c.value}</div>
            <div className={`card-delta ${c.up ? 'delta-up' : 'delta-down'}`}>
              {c.up ? '▲' : '▼'} {c.delta} vs last month
            </div>
          </div>
        ))}
      </div>

      {/* Chart (full width) */}
      <div className="card mt16">
        <div className="section-header">
          <div className="section-title">Income vs Expenses</div>
          <div className={styles.chartLegend}>
            <span style={{ color: 'var(--green)' }}>▬ Income</span>
            <span style={{ color: 'var(--red)' }}>▬ Expense</span>
          </div>
        </div>
        <div className={styles.chartBars}>
          {CHART_DATA.map((d, i) => (
            <div className={styles.chartCol} key={i}>
              <div className={styles.barPair}>
                <div className={styles.barIncome}  style={{ height: (d.income  / maxVal * 100) + '%', animationDelay: i * 0.07 + 's' }} />
                <div className={styles.barExpense} style={{ height: (d.expense / maxVal * 100) + '%', animationDelay: i * 0.07 + 's' }} />
              </div>
              <span className={styles.barLabel}>{d.m}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid-12 mt16">
        {/* Recent Transactions */}
        <div className="card">
          <div className="section-header">
            <div className="section-title">Recent Transactions</div>
            <span className="section-action" onClick={onAdd}>+ Add</span>
          </div>
          {SAMPLE_TXS.slice(0, 5).map((t, i) => (
            <div className={styles.txItem} key={t.id} style={{ animationDelay: i * 0.05 + 's' }}>
              <div className={styles.txIcon} style={{ background: t.color }}>{t.icon}</div>
              <div className={styles.txInfo}>
                <div className={styles.txName}>{t.name}</div>
                <div className={styles.txMeta}>{t.category} · {t.date}</div>
              </div>
              <div className={styles.txAmount} style={{ color: t.type === 'income' ? 'var(--green)' : 'var(--red)' }}>
                {t.type === 'income' ? '+' : '-'}{fmt(t.amount)}
              </div>
            </div>
          ))}
        </div>

        {/* Budget Status */}
        <div className="card">
          <div className="section-header">
            <div className="section-title">Budget Status</div>
            <span className="section-action">View all</span>
          </div>
          {BUDGETS.map((b, i) => {
            const pct = Math.round(b.spent / b.limit * 100)
            return (
              <div className={styles.budgetItem} key={i}>
                <div className={styles.budgetRow}>
                  <span className={styles.budgetCat}>{b.cat}</span>
                  <span className={styles.budgetNums}>{fmt(b.spent)} / {fmt(b.limit)}</span>
                </div>
                <div className="progress-wrap">
                  <div className="progress-fill" style={{ width: Math.min(pct, 100) + '%', background: pct > 100 ? 'var(--red)' : b.color }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
