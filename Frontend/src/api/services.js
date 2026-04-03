import { api } from './client'

// ── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  login:    (email, password)              => api.post('/auth/login',    { email, password }),
  register: (name, email, password)        => api.post('/auth/register', { name, email, password }),
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const dashboardApi = {
  getSummary: () => api.get('/dashboard'),
}

// ── Transactions ──────────────────────────────────────────────────────────────
export const txApi = {
  getAll:    ()                          => api.get('/transactions'),
  getByType: (type)                      => api.get(`/transactions?type=${type}`),
  create:    (data)                      => api.post('/transactions', data),
  update:    (id, data)                  => api.put(`/transactions/${id}`, data),
  delete:    (id)                        => api.delete(`/transactions/${id}`),
}

// ── Budgets ───────────────────────────────────────────────────────────────────
export const budgetApi = {
  getAll:  (month, year) => {
    const q = month && year ? `?month=${month}&year=${year}` : ''
    return api.get(`/budgets${q}`)
  },
  create:  (data)        => api.post('/budgets', data),
  update:  (id, data)    => api.put(`/budgets/${id}`, data),
  delete:  (id)          => api.delete(`/budgets/${id}`),
}

// ── Savings Goals ─────────────────────────────────────────────────────────────
export const goalApi = {
  getAll:     ()              => api.get('/goals'),
  create:     (data)          => api.post('/goals', data),
  update:     (id, data)      => api.put(`/goals/${id}`, data),
  addSaving:  (id, amount)    => api.patch(`/goals/${id}/add?amount=${amount}`),
  delete:     (id)            => api.delete(`/goals/${id}`),
}

// ── Investments ───────────────────────────────────────────────────────────────
export const investApi = {
  getAll:       ()                      => api.get('/investments'),
  create:       (data)                  => api.post('/investments', data),
  update:       (id, data)              => api.put(`/investments/${id}`, data),
  updatePrice:  (id, price)             => api.patch(`/investments/${id}/price?currentPrice=${price}`),
  delete:       (id)                    => api.delete(`/investments/${id}`),
}

// ── Bills ─────────────────────────────────────────────────────────────────────
export const billApi = {
  getAll:   ()           => api.get('/bills'),
  create:   (data)       => api.post('/bills', data),
  update:   (id, data)   => api.put(`/bills/${id}`, data),
  markPaid: (id)         => api.patch(`/bills/${id}/pay`),
  delete:   (id)         => api.delete(`/bills/${id}`),
}