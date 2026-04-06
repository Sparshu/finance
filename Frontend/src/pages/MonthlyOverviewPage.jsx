import { useState, useMemo } from 'react'
import { useApi } from '../api/useApi'
import { txApi, budgetApi } from '../api/services'
import { fmt } from '../data/sampleData'
import styles from './MonthlyOverviewPage.module.css'

const CAT_COLORS = {
  Food: '#00b07a', Transport: '#40c4ff', Entertainment: '#ff5252',
  Health: '#ffc107', Shopping: '#b388ff', Bills: '#40c4ff',
  Income: '#00b07a', Other: '#8a9490',
}
const CAT_ICONS = {
  Income: '💼', Food: '🛒', Bills: '📺', Transport: '⛽',
  Health: '🏋️', Shopping: '🛍️', Entertainment: '🎬', Other: '💸',
}

function ArrowUp() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M6 10V2M6 2L2 6M6 2L10 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
function ArrowDown() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M6 2v8M6 10l-4-4M6 10l4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
function ChevronLeft() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
function ChevronRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

export default function MonthlyOverviewPage() {
  const { data: allTxs, loading: txLoading } = useApi(txApi.getAll)
  const { data: budgets } = useApi(budgetApi.getAll)

  // Build list of available months from transactions
  const availableMonths = useMemo(() => {
    if (!allTxs?.length) return []
    const set = new Set()
    allTxs.forEach(t => { if (t.date) set.add(t.date.slice(0, 7)) })
    return [...set].sort((a, b) => b.localeCompare(a)) // newest first
  }, [allTxs])

  const [selectedIdx, setSelectedIdx] = useState(0)

  const selectedMonth = availableMonths[selectedIdx] || null
  const prevMonth = availableMonths[selectedIdx + 1] || null

  const monthLabel = (ym) => {
    if (!ym) return '—'
    const [y, m] = ym.split('-')
    return new Date(+y, +m - 1, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
  }

  // Filter txs for a given month
  const txsFor = (ym) => (allTxs || []).filter(t => t.date?.startsWith(ym))

  const stats = (ym) => {
    if (!ym) return { income: 0, expense: 0, net: 0, count: 0, categories: {} }
    const txs = txsFor(ym)
    let income = 0, expense = 0
    const categories = {}
    txs.forEach(t => {
      const amt = Number(t.amount)
      if (t.type === 'INCOME') income += amt
      else {
        expense += amt
        categories[t.category] = (categories[t.category] || 0) + amt
      }
    })
    return { income, expense, net: income - expense, count: txs.length, categories }
  }

  const current = useMemo(() => stats(selectedMonth), [allTxs, selectedMonth])
  const previous = useMemo(() => stats(prevMonth), [allTxs, prevMonth])

  const delta = (curr, prev) => {
    if (!prev) return null
    if (prev === 0) return curr > 0 ? 100 : 0
    return Math.round(((curr - prev) / prev) * 100)
  }

  // Spending by category for current month
  const catBreakdown = useMemo(() => {
    const entries = Object.entries(current.categories).sort((a, b) => b[1] - a[1])
    const total = entries.reduce((s, [, v]) => s + v, 0)
    return entries.map(([cat, amt]) => ({
      cat,
      amt,
      pct: total > 0 ? Math.round((amt / total) * 100) : 0,
      color: CAT_COLORS[cat] || '#8a9490',
    }))
  }, [current])

  // Daily spending for current month — for sparkline
  const dailyData = useMemo(() => {
    if (!selectedMonth) return []
    const [y, m] = selectedMonth.split('-').map(Number)
    const daysInMonth = new Date(y, m, 0).getDate()
    const map = {}
    txsFor(selectedMonth).forEach(t => {
      if (t.type !== 'INCOME') {
        const d = parseInt(t.date.slice(8, 10))
        map[d] = (map[d] || 0) + Number(t.amount)
      }
    })
    return Array.from({ length: daysInMonth }, (_, i) => map[i + 1] || 0)
  }, [allTxs, selectedMonth])
  const maxDaily = Math.max(...dailyData, 1)

  // Top transactions for current month
  const topTxs = useMemo(() => {
    return txsFor(selectedMonth)
      .filter(t => t.type === 'EXPENSE')
      .sort((a, b) => Number(b.amount) - Number(a.amount))
      .slice(0, 6)
  }, [allTxs, selectedMonth])

  // Savings rate
  const savingsRate = current.income > 0
    ? Math.round((current.net / current.income) * 100)
    : 0

  const incDelta  = delta(current.income,  previous.income)
  const expDelta  = delta(current.expense, previous.expense)
  const netDelta  = delta(current.net,     previous.net)

  const DeltaBadge = ({ d, invert = false }) => {
    if (d === null || isNaN(d)) return null
    const up = invert ? d < 0 : d >= 0
    return (
      <span className={`${styles.deltaBadge} ${up ? styles.deltaGood : styles.deltaBad}`}>
        {d >= 0 ? <ArrowUp /> : <ArrowDown />}
        {Math.abs(d)}%
      </span>
    )
  }

  if (txLoading) return (
    <div className={`page-anim ${styles.page}`}>
      <div className={styles.loadWrap}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className={styles.skeleton} style={{ height: i < 4 ? 90 : 200, animationDelay: i * 0.07 + 's' }} />
        ))}
      </div>
    </div>
  )

  if (!availableMonths.length) return (
    <div className={`page-anim ${styles.page}`}>
      <div className={styles.empty}>
        <div className={styles.emptyIcon}>📅</div>
        <div className={styles.emptyTitle}>No data yet</div>
        <div className={styles.emptyDesc}>Add some transactions to see your monthly overview</div>
      </div>
    </div>
  )

  return (
    <div className={`page-anim ${styles.page}`}>

      {/* Month navigator */}
      <div className={styles.monthNav}>
        <button
          className={styles.navBtn}
          onClick={() => setSelectedIdx(i => Math.min(i + 1, availableMonths.length - 1))}
          disabled={selectedIdx >= availableMonths.length - 1}
          title="Previous month"
        >
          <ChevronLeft />
        </button>

        <div className={styles.monthPicker}>
          <div className={styles.monthLabel}>{monthLabel(selectedMonth)}</div>
          {prevMonth && (
            <div className={styles.compareLabel}>vs {monthLabel(prevMonth)}</div>
          )}
        </div>

        <button
          className={styles.navBtn}
          onClick={() => setSelectedIdx(i => Math.max(i - 1, 0))}
          disabled={selectedIdx === 0}
          title="Next month"
        >
          <ChevronRight />
        </button>
      </div>

      {/* Month strip */}
      <div className={styles.monthStrip}>
        {availableMonths.map((ym, i) => {
          const [, m] = ym.split('-')
          const mLabel = new Date(ym + '-01').toLocaleDateString('en-IN', { month: 'short' })
          const isSelected = i === selectedIdx
          const s = stats(ym)
          return (
            <button
              key={ym}
              className={`${styles.monthChip} ${isSelected ? styles.monthChipActive : ''}`}
              onClick={() => setSelectedIdx(i)}
              title={monthLabel(ym)}
            >
              <span className={styles.chipMonth}>{mLabel}</span>
              <span className={styles.chipAmt} style={{ color: s.net >= 0 ? 'var(--accent)' : 'var(--red)' }}>
                {s.net >= 0 ? '+' : ''}{fmt(s.net)}
              </span>
            </button>
          )
        })}
      </div>

      {/* KPI row */}
      <div className={styles.kpiRow}>
        {[
          { label: 'Income',        value: current.income,  delta: incDelta,  invertDelta: false, color: 'var(--accent)', icon: '↑' },
          { label: 'Expenses',      value: current.expense, delta: expDelta,  invertDelta: true,  color: 'var(--red)',    icon: '↓' },
          { label: 'Net Savings',   value: current.net,     delta: netDelta,  invertDelta: false, color: current.net >= 0 ? 'var(--accent)' : 'var(--red)', icon: '◈' },
          { label: 'Savings Rate',  value: null,            delta: null,       invertDelta: false, color: savingsRate >= 20 ? 'var(--accent)' : savingsRate >= 0 ? 'var(--amber)' : 'var(--red)', icon: '%' },
        ].map((k, i) => (
          <div className={styles.kpiCard} key={i} style={{ '--kpi-color': k.color }}>
            <div className={styles.kpiHeader}>
              <span className={styles.kpiLabel}>{k.label}</span>
              <span className={styles.kpiIcon} style={{ color: k.color }}>{k.icon}</span>
            </div>
            <div className={styles.kpiValue} style={{ color: k.color }}>
              {k.value !== null ? fmt(k.value) : `${savingsRate}%`}
            </div>
            <div className={styles.kpiFooter}>
              {k.delta !== null ? (
                <>
                  <DeltaBadge d={k.delta} invert={k.invertDelta} />
                  <span className={styles.kpiVs}>vs {monthLabel(prevMonth).split(' ')[0]}</span>
                </>
              ) : (
                <span className={styles.kpiSub}>
                  {savingsRate >= 20 ? '✓ On track' : savingsRate >= 0 ? '△ Needs work' : '✗ Overspent'}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className={styles.twoCol}>

        {/* Daily spending sparkline */}
        <div className={`card ${styles.sparkCard}`}>
          <div className="section-header">
            <div className="section-title">Daily Spending</div>
            <span style={{ fontSize: 12, color: 'var(--text2)' }}>{current.count} transactions</span>
          </div>
          <div className={styles.sparkWrap}>
            {dailyData.map((v, i) => (
              <div key={i} className={styles.sparkCol} title={`Day ${i + 1}: ${fmt(v)}`}>
                <div
                  className={styles.sparkBar}
                  style={{
                    height: v > 0 ? `${Math.max((v / maxDaily) * 100, 6)}%` : '2px',
                    opacity: v > 0 ? 1 : 0.2,
                    animationDelay: `${i * 0.015}s`,
                  }}
                />
                {(i + 1) % 7 === 1 && (
                  <span className={styles.sparkLabel}>{i + 1}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Category breakdown */}
        <div className={`card ${styles.catCard}`}>
          <div className="section-header">
            <div className="section-title">Spending by Category</div>
            <span style={{ fontSize: 12, color: 'var(--text2)' }}>{fmt(current.expense)} total</span>
          </div>
          {catBreakdown.length === 0 ? (
            <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text2)', fontSize: 13 }}>
              No expenses this month
            </div>
          ) : catBreakdown.map(({ cat, amt, pct, color }) => (
            <div className={styles.catRow} key={cat}>
              <div className={styles.catLeft}>
                <span className={styles.catIcon}>{CAT_ICONS[cat] || '💸'}</span>
                <span className={styles.catName}>{cat}</span>
              </div>
              <div className={styles.catBar}>
                <div className={styles.catFill} style={{ width: pct + '%', background: color }} />
              </div>
              <div className={styles.catRight}>
                <span className={styles.catAmt}>{fmt(amt)}</span>
                <span className={styles.catPct}>{pct}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Month comparison table */}
      {prevMonth && (
        <div className={`card ${styles.compareCard}`}>
          <div className="section-header">
            <div className="section-title">Month Comparison</div>
            <span style={{ fontSize: 12, color: 'var(--text2)' }}>
              {monthLabel(selectedMonth)} vs {monthLabel(prevMonth)}
            </span>
          </div>
          <div className={styles.compareGrid}>
            {/* Header */}
            <div className={styles.compareHeader}>
              <span>Category</span>
              <span>{monthLabel(selectedMonth).split(' ')[0]}</span>
              <span>{monthLabel(prevMonth).split(' ')[0]}</span>
              <span>Change</span>
            </div>
            {/* Income row */}
            {[
              { label: 'Income',  curr: current.income,  prev: previous.income,  isGoodUp: true  },
              { label: 'Expense', curr: current.expense, prev: previous.expense, isGoodUp: false },
              { label: 'Net',     curr: current.net,     prev: previous.net,     isGoodUp: true  },
            ].map(row => {
              const d = delta(row.curr, row.prev)
              const isPositive = d >= 0
              const isGood = row.isGoodUp ? isPositive : !isPositive
              return (
                <div className={styles.compareRow} key={row.label}>
                  <span className={styles.compareLabel}>{row.label}</span>
                  <span className={styles.compareVal}>{fmt(row.curr)}</span>
                  <span className={styles.compareVal} style={{ color: 'var(--text2)' }}>{fmt(row.prev)}</span>
                  <span className={`${styles.compareChange} ${isGood ? styles.changeGood : styles.changeBad}`}>
                    {isPositive ? <ArrowUp /> : <ArrowDown />}
                    {d !== null ? Math.abs(d) + '%' : '—'}
                  </span>
                </div>
              )
            })}
            {/* Per-category rows */}
            {[...new Set([
              ...Object.keys(current.categories),
              ...Object.keys(previous.categories),
            ])].sort().map(cat => {
              const curr = current.categories[cat] || 0
              const prev = previous.categories[cat] || 0
              const d = delta(curr, prev)
              const isPositive = d >= 0
              return (
                <div className={styles.compareRow} key={cat} style={{ opacity: 0.85 }}>
                  <span className={styles.compareLabel} style={{ color: 'var(--text2)' }}>
                    {CAT_ICONS[cat] || '💸'} {cat}
                  </span>
                  <span className={styles.compareVal} style={{ fontSize: 12 }}>{fmt(curr)}</span>
                  <span className={styles.compareVal} style={{ fontSize: 12, color: 'var(--text2)' }}>{fmt(prev)}</span>
                  <span className={`${styles.compareChange} ${isPositive ? styles.changeBad : styles.changeGood}`} style={{ fontSize: 11 }}>
                    {d !== null ? (
                      <>{isPositive ? <ArrowUp /> : <ArrowDown />} {Math.abs(d)}%</>
                    ) : '—'}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Top Expenses */}
      <div className={`card ${styles.topCard}`}>
        <div className="section-header">
          <div className="section-title">Top Expenses</div>
          <span style={{ fontSize: 12, color: 'var(--text2)' }}>{monthLabel(selectedMonth)}</span>
        </div>
        {topTxs.length === 0 ? (
          <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text2)', fontSize: 13 }}>
            No expenses recorded
          </div>
        ) : (
          <div className={styles.topList}>
            {topTxs.map((t, i) => {
              const pct = current.expense > 0 ? Math.round((Number(t.amount) / current.expense) * 100) : 0
              const color = CAT_COLORS[t.category] || 'var(--text2)'
              return (
                <div className={styles.topItem} key={t.id} style={{ animationDelay: i * 0.06 + 's' }}>
                  <div className={styles.topRank} style={{ color }}>{i + 1}</div>
                  <div className={styles.topIcon} style={{ background: color + '18' }}>
                    {CAT_ICONS[t.category] || '💸'}
                  </div>
                  <div className={styles.topInfo}>
                    <div className={styles.topName}>{t.name}</div>
                    <div className={styles.topMeta}>{t.category} · {t.date}</div>
                  </div>
                  <div className={styles.topRight}>
                    <div className={styles.topAmt} style={{ color }}>{fmt(t.amount)}</div>
                    <div className={styles.topPct}>{pct}% of spend</div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

    </div>
  )
}