import { useApi } from '../api/useApi'
import { dashboardApi, txApi, budgetApi } from '../api/services'
import { fmt } from '../data/sampleData'
import styles from './DashboardPage.module.css'

const CAT_COLORS = {
  Food: 'var(--green)', Transport: 'var(--blue)', Entertainment: 'var(--red)',
  Health: 'var(--amber)', Shopping: 'var(--purple)', Bills: 'var(--blue)',
  Income: 'var(--green)', Other: 'var(--text2)',
}

const TX_ICONS = {
  Income: '💼', Food: '🛒', Bills: '📺', Transport: '⛽',
  Health: '🏋️', Shopping: '🛍️', Entertainment: '🎬', Other: '💸',
}

function LoadingCard({ count = 1 }) {
  return Array.from({ length: count }).map((_, i) => (
    <div className="card" key={i} style={{ opacity: 0.4, minHeight: 80, background: 'var(--surface2)' }} />
  ))
}

export default function DashboardPage({ onAdd, onRefreshKey }) {
  const { data: summary, loading: sumLoading } = useApi(dashboardApi.getSummary, [onRefreshKey])
  const { data: txs,     loading: txLoading  } = useApi(txApi.getAll,             [onRefreshKey])
  const { data: budgets, loading: budLoading  } = useApi(budgetApi.getAll,         [onRefreshKey])

  const summaryCards = summary ? [
    { label: 'Net Balance',        value: fmt(summary.netBalance),           color: 'var(--green)' },
    { label: 'Total Income',       value: fmt(summary.totalIncome),          color: 'var(--blue)'  },
    { label: 'Total Spent',        value: fmt(summary.totalExpense),         color: 'var(--red)'   },
    { label: 'Investment Value',   value: fmt(summary.totalInvestmentValue), color: 'var(--amber)' },
  ] : []

  // Build chart data from transactions grouped by month
  const chartData = (() => {
    if (!txs) return []
    const map = {}
    txs.forEach(t => {
      const m = t.date?.slice(0, 7) // "2024-06"
      if (!m) return
      if (!map[m]) map[m] = { income: 0, expense: 0 }
      if (t.type === 'INCOME')  map[m].income  += Number(t.amount)
      if (t.type === 'EXPENSE') map[m].expense += Number(t.amount)
    })
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([m, v]) => ({ m: new Date(m + '-01').toLocaleDateString('en-IN', { month: 'short' }), ...v }))
  })()

  const maxVal = chartData.length ? Math.max(...chartData.map(d => d.income), 1) : 1

  return (
    <div className="page-anim">
      {/* KPI cards */}
      <div className="grid-4 mb12">
        {sumLoading
          ? <LoadingCard count={4} />
          : summaryCards.map((c, i) => (
            <div className="card" key={i} style={{ animationDelay: i * 0.06 + 's', borderTop: `2px solid ${c.color}` }}>
              <div className="card-label">{c.label}</div>
              <div className="card-value" style={{ color: c.color, fontSize: 22 }}>{c.value}</div>
              <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 4, fontFamily: 'var(--mono)' }}>
                {summary.transactionCount} transactions · {summary.activeGoals} active goals
              </div>
            </div>
          ))
        }
      </div>

      {/* Bar chart from real data */}
      <div className="card mt16">
        <div className="section-header">
          <div className="section-title">Income vs Expenses</div>
          <div className={styles.chartLegend}>
            <span style={{ color: 'var(--green)' }}>▬ Income</span>
            <span style={{ color: 'var(--red)' }}>▬ Expense</span>
          </div>
        </div>
        {txLoading ? (
          <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text2)' }}>
            Loading chart…
          </div>
        ) : chartData.length === 0 ? (
          <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text2)' }}>
            No transaction data yet
          </div>
        ) : (
          <div className={styles.chartBars}>
            {chartData.map((d, i) => (
              <div className={styles.chartCol} key={i}>
                <div className={styles.barPair}>
                  <div className={styles.barIncome}  style={{ height: (d.income  / maxVal * 100) + '%', animationDelay: i * 0.07 + 's' }} />
                  <div className={styles.barExpense} style={{ height: (d.expense / maxVal * 100) + '%', animationDelay: i * 0.07 + 's' }} />
                </div>
                <span className={styles.barLabel}>{d.m}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid-12 mt16">
        {/* Recent Transactions */}
        <div className="card">
          <div className="section-header">
            <div className="section-title">Recent Transactions</div>
            <span className="section-action" onClick={onAdd}>+ Add</span>
          </div>
          {txLoading ? <LoadingCard count={3} /> : (txs || []).slice(0, 5).map((t, i) => (
            <div className={styles.txItem} key={t.id} style={{ animationDelay: i * 0.05 + 's' }}>
              <div className={styles.txIcon} style={{ background: t.type === 'INCOME' ? 'var(--green-bg)' : 'var(--amber-bg)' }}>
                {TX_ICONS[t.category] || '💸'}
              </div>
              <div className={styles.txInfo}>
                <div className={styles.txName}>{t.name}</div>
                <div className={styles.txMeta}>{t.category} · {t.date}</div>
              </div>
              <div className={styles.txAmount} style={{ color: t.type === 'INCOME' ? 'var(--green)' : 'var(--red)' }}>
                {t.type === 'INCOME' ? '+' : '-'}{fmt(t.amount)}
              </div>
            </div>
          ))}
          {!txLoading && (!txs || txs.length === 0) && (
            <div style={{ textAlign: 'center', padding: 24, color: 'var(--text2)', fontSize: 13 }}>
              No transactions yet — add your first one!
            </div>
          )}
        </div>

        {/* Budget Status */}
        <div className="card">
          <div className="section-header">
            <div className="section-title">Budget Status</div>
          </div>
          {budLoading ? <LoadingCard count={3} /> : (budgets || []).map((b, i) => {
            const pct = b.limit > 0 ? Math.round((b.spent / b.limit) * 100) : 0
            const color = CAT_COLORS[b.category] || 'var(--blue)'
            return (
              <div className={styles.budgetItem} key={i}>
                <div className={styles.budgetRow}>
                  <span className={styles.budgetCat}>{b.category}</span>
                  <span className={styles.budgetNums}>{fmt(b.spent)} / {fmt(b.limit)}</span>
                </div>
                <div className="progress-wrap">
                  <div className="progress-fill" style={{ width: Math.min(pct, 100) + '%', background: pct > 100 ? 'var(--red)' : color }} />
                </div>
              </div>
            )
          })}
          {!budLoading && (!budgets || budgets.length === 0) && (
            <div style={{ textAlign: 'center', padding: 24, color: 'var(--text2)', fontSize: 13 }}>
              No budgets set for this month
            </div>
          )}
        </div>
      </div>
    </div>
  )
}