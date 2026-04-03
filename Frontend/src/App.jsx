import { useState } from 'react'
import AuthScreen      from './components/AuthScreen'
import Sidebar         from './components/Sidebar'
import AddModal        from './components/AddModal'
import DashboardPage   from './pages/DashboardPage'
import TransactionsPage from './pages/TransactionsPage'
import BudgetsPage     from './pages/BudgetsPage'
import GoalsPage       from './pages/GoalsPage'
import InvestmentsPage from './pages/InvestmentsPage'
import BillsPage       from './pages/BillsPage'
import ReportsPage     from './pages/ReportsPage'
import { PAGE_TITLES, now } from './data/sampleData'

export default function App() {
  const [authed, setAuthed] = useState(false)
  const [user,   setUser]   = useState({ name: '', email: '' })
  const [page,   setPage]   = useState('dashboard')
  const [modal,  setModal]  = useState(false)

  const login = (name, email) => {
    setUser({ name: name || 'Rahul Sharma', email: email || 'rahul@example.com' })
    setAuthed(true)
  }

  if (!authed) return <AuthScreen onLogin={login} />

  const PAGES = {
    dashboard:    <DashboardPage    onAdd={() => setModal(true)} />,
    transactions: <TransactionsPage onAdd={() => setModal(true)} />,
    budgets:      <BudgetsPage />,
    goals:        <GoalsPage />,
    investments:  <InvestmentsPage />,
    bills:        <BillsPage />,
    reports:      <ReportsPage />,
  }

  return (
    <div className="app-shell">
      <Sidebar
        active={page}
        setActive={setPage}
        user={user}
        onLogout={() => setAuthed(false)}
      />

      <main className="main-content">
        {/* Topbar */}
        <div className="topbar">
          <div className="page-title">{PAGE_TITLES[page]}</div>
          <div className="topbar-right">
            <div className="topbar-date">{now}</div>
            <div className="btn-icon" title="Notifications">🔔</div>
            <div className="btn-icon" title="Settings">⚙</div>
          </div>
        </div>

        {/* Page content — key forces re-mount + re-animation on nav */}
        <div className="page-body" key={page}>
          {PAGES[page]}
        </div>
      </main>

      {modal && <AddModal onClose={() => setModal(false)} />}
    </div>
  )
}
