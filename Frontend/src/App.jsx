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
import { PAGE_TITLES, now } from './data/sampleData'

const ALL_TITLES = {
  ...PAGE_TITLES,
  profile: 'Profile & Settings',
}

export default function App() {
  const [authed,     setAuthed]     = useState(() => !!localStorage.getItem('finio_token'))
  const [user,       setUser]       = useState({ name: '', email: '' })
  const [page,       setPage]       = useState('dashboard')
  const [modal,      setModal]      = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const login = (name, email) => {
    setUser({ name, email })
    setAuthed(true)
  }

  const logout = () => {
    localStorage.removeItem('finio_token')
    setAuthed(false)
    setUser({ name: '', email: '' })
  }

  // Called after a transaction is saved to refresh dashboard data
  const onTransactionSaved = () => setRefreshKey(k => k + 1)

  if (!authed) return <AuthScreen onLogin={login} />

  const PAGES = {
    dashboard:    <DashboardPage    onAdd={() => setModal(true)} onRefreshKey={refreshKey} />,
    transactions: <TransactionsPage onAdd={() => setModal(true)} />,
    budgets:      <BudgetsPage />,
    goals:        <GoalsPage />,
    investments:  <InvestmentsPage />,
    bills:        <BillsPage />,
    reports:      <ReportsPage />,
    profile:      <ProfilePage user={user} onLogout={logout} />,
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
          <div className="topbar-right">
            <div className="topbar-date">{now}</div>
            <div className="btn-icon" title="Notifications">🔔</div>
            <div className="btn-icon" title="Settings" onClick={() => setPage('profile')}>⚙</div>
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
    </div>
  )
}