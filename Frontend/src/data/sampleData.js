export const SAMPLE_TXS = [
  { id: 1, name: 'Salary Credit',     category: 'Income',    type: 'income',  amount: 85000, date: '2024-06-01', icon: '💼', color: 'var(--green-bg)' },
  { id: 2, name: 'Zepto Groceries',   category: 'Food',      type: 'expense', amount: 3200,  date: '2024-06-02', icon: '🛒', color: 'var(--amber-bg)' },
  { id: 3, name: 'Netflix',           category: 'Bills',     type: 'expense', amount: 649,   date: '2024-06-03', icon: '📺', color: 'var(--purple-bg)' },
  { id: 4, name: 'Freelance Project', category: 'Income',    type: 'income',  amount: 25000, date: '2024-06-04', icon: '💻', color: 'var(--blue-bg)' },
  { id: 5, name: 'Fuel',              category: 'Transport', type: 'expense', amount: 2800,  date: '2024-06-05', icon: '⛽', color: 'var(--amber-bg)' },
  { id: 6, name: 'Gym Membership',    category: 'Health',    type: 'expense', amount: 1500,  date: '2024-06-06', icon: '🏋️', color: 'var(--green-bg)' },
]

export const BUDGETS = [
  { cat: 'Food & Dining',  spent: 8400,  limit: 12000, color: 'var(--green)' },
  { cat: 'Transport',      spent: 4200,  limit: 5000,  color: 'var(--blue)' },
  { cat: 'Entertainment',  spent: 3800,  limit: 3000,  color: 'var(--red)' },
  { cat: 'Health',         spent: 2100,  limit: 4000,  color: 'var(--amber)' },
  { cat: 'Shopping',       spent: 6800,  limit: 8000,  color: 'var(--purple)' },
]

export const GOALS = [
  { id: 1, name: 'Emergency Fund', icon: '🛡️', target: 300000, saved: 180000 },
  { id: 2, name: 'New Laptop',     icon: '💻', target: 80000,  saved: 52000  },
  { id: 3, name: 'Goa Trip',       icon: '✈️', target: 45000,  saved: 18000  },
  { id: 4, name: 'Car Down Pmt.',  icon: '🚗', target: 200000, saved: 72000  },
]

export const INVESTMENTS = [
  { ticker: 'RELIANCE', name: 'Reliance Industries', qty: 10,  buy: 2800, curr: 3042, change: +8.6  },
  { ticker: 'TCS',      name: 'Tata Consultancy',    qty: 5,   buy: 3500, curr: 3821, change: +9.2  },
  { ticker: 'INFY',     name: 'Infosys Ltd.',        qty: 20,  buy: 1450, curr: 1388, change: -4.3  },
  { ticker: 'HDFC',     name: 'HDFC Bank',           qty: 8,   buy: 1600, curr: 1724, change: +7.8  },
  { ticker: 'GOLD',     name: 'SGB Gold Bond',       qty: 100, buy: 5800, curr: 6890, change: +18.8 },
]

export const BILLS = [
  { name: 'Netflix',      icon: '📺', amount: 649,   due: 'Jun 08', status: 'upcoming' },
  { name: 'Airtel Fiber', icon: '🌐', amount: 999,   due: 'Jun 10', status: 'upcoming' },
  { name: 'HDFC Card',    icon: '💳', amount: 18400, due: 'Jun 12', status: 'due'      },
  { name: 'LIC Premium',  icon: '🛡️', amount: 8200,  due: 'Jun 20', status: 'upcoming' },
  { name: 'Spotify',      icon: '🎵', amount: 119,   due: 'Jun 22', status: 'upcoming' },
]

export const CHART_DATA = [
  { m: 'Jan', income: 72000,  expense: 48000 },
  { m: 'Feb', income: 68000,  expense: 52000 },
  { m: 'Mar', income: 85000,  expense: 44000 },
  { m: 'Apr', income: 91000,  expense: 58000 },
  { m: 'May', income: 88000,  expense: 61000 },
  { m: 'Jun', income: 110000, expense: 54000 },
]

export const NAV = [
  { id: 'dashboard',    label: 'Dashboard',         icon: '⊞' },
  { id: 'transactions', label: 'Transactions',      icon: '↕' },
  { id: 'budgets',      label: 'Budgets',           icon: '◎' },
  { id: 'goals',        label: 'Savings Goals',     icon: '◈' },
  { id: 'investments',  label: 'Investments',       icon: '△' },
  { id: 'bills',        label: 'Bills & Subs',      icon: '◷' },
  { id: 'reports',      label: 'Reports',           icon: '◫' },
]

export const PAGE_TITLES = {
  dashboard:    'Dashboard',
  transactions: 'Transactions',
  budgets:      'Budgets',
  goals:        'Savings Goals',
  investments:  'Investments',
  bills:        'Bills & Subscriptions',
  reports:      'Reports',
}

export const CATEGORIES = ['Food', 'Transport', 'Health', 'Shopping', 'Entertainment', 'Bills', 'Income', 'Other']

export const fmt = (n) => {
  const num = Number(n)
  if (isNaN(num)) return '₹0'
  return '₹' + num.toLocaleString('en-IN', { maximumFractionDigits: 2 })
}
export const now = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })