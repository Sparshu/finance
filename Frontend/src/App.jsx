import { useState } from 'react'
import AuthScreen       from './components/AuthScreen'
import Sidebar          from './components/Sidebar'
import AddModal         from './components/AddModal'
import DashboardPage    from './pages/DashboardPage'
import TransactionsPage from './pages/TransactionsPage'
import BudgetsPage      from './pages/BudgetsPage'
import GoalsPage        from './pages/GoalsPage'
import InvestmentsPage  from './pages/InvestmentsPage'
import BillsPage        from './pages/BillsPage'
import ReportsPage      from './pages/ReportsPage'
import ProfilePage      from './pages/ProfilePage'
import NotificationsPanel from './components/NotificationsPanel'
import AIChatbot from './components/AiChatBot'
import { PAGE_TITLES, now } from './data/sampleData'

const ALL_TITLES = {
  ...PAGE_TITLES,
  profile: 'Profile & Settings',
}

export default function App() {
  const [authed,     setAuthed]     = useState(() => !!localStorage.getItem('finio_token'))
  const [user,       setUser]       = useState(() => {
    try {
      const stored = localStorage.getItem('finio_user')
      return stored ? JSON.parse(stored) : { name: '', email: '' }
    } catch { return { name: '', email: '' } }
  })
  const [page,       setPage]       = useState('dashboard')
  const [modal,      setModal]      = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const login = (name, email) => {
    const u = { name, email }
    setUser(u)
    localStorage.setItem('finio_user', JSON.stringify(u))
    setAuthed(true)
  }

  const logout = () => {
    localStorage.removeItem('finio_token')
    localStorage.removeItem('finio_user')
    setAuthed(false)
    setUser({ name: '', email: '' })
  }

  // Called after a transaction is saved to refresh dashboard data
  const onTransactionSaved = () => setRefreshKey(k => k + 1)

  const onProfileUpdated = (updated) => {
    setUser(updated)
    localStorage.setItem('finio_user', JSON.stringify(updated))
  }

  if (!authed) return <AuthScreen onLogin={login} />

  const PAGES = {
    dashboard:    <DashboardPage    onAdd={() => setModal(true)} onRefreshKey={refreshKey} />,
    transactions: <TransactionsPage onAdd={() => setModal(true)} />,
    budgets:      <BudgetsPage />,
    goals:        <GoalsPage />,
    investments:  <InvestmentsPage />,
    bills:        <BillsPage />,
    reports:      <ReportsPage />,
    profile:      <ProfilePage user={user} onProfileUpdated={onProfileUpdated} onLogout={logout} />,
  }

  return (
    <div className="app-shell">
      <Sidebar
        active={page}
        setActive={setPage}
        user={user}
        onLogout={logout}
      />

      <main className="main-content">
        <div className="topbar">
          <div className="page-title">{ALL_TITLES[page]}</div>
          <div className="topbar-actions">
            <div className="topbar-date">{now}</div>
            <NotificationsPanel onNavigate={setPage} />
            <div
              title="Settings"
              onClick={() => setPage('profile')}
              style={{
                width: 36, height: 36, borderRadius: 10,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'var(--bg2)', border: '1px solid var(--border2)',
                cursor: 'pointer', fontSize: 16, color: 'var(--text2)',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--bg2)'}
            >⚙</div>
          </div>
        </div>

        <div className="page-body" key={page}>
          {PAGES[page]}
        </div>
      </main>

      {modal && (
        <AddModal
          onClose={() => setModal(false)}
          onSaved={onTransactionSaved}
        />
      )}

      <AIChatbot />
    </div>
  )
}