import { api } from './client'

// ── User / Profile ────────────────────────────────────────────────────────────
export const userApi = {
  getMe:          ()              => api.get('/users/me'),
  updateProfile:  (name)          => api.patch('/users/me',          { name }),
  changePassword: (currentPassword, newPassword) =>
                                     api.patch('/users/me/password', { currentPassword, newPassword }),
}

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
// ── Recurring Transactions ────────────────────────────────────────────────────
export const recurringApi = {
  getAll:  ()          => api.get('/recurring'),
  create:  (data)      => api.post('/recurring', data),
  update:  (id, data)  => api.put(`/recurring/${id}`, data),
  toggle:  (id)        => api.patch(`/recurring/${id}/toggle`),
  runNow:  (id)        => api.post(`/recurring/${id}/run`),
  delete:  (id)        => api.delete(`/recurring/${id}`),
}

// ── Net Worth ─────────────────────────────────────────────────────────────────
export const netWorthApi = {
  getAll:  ()          => api.get('/networth'),
  create:  (data)      => api.post('/networth', data),
  update:  (id, data)  => api.put(`/networth/${id}`, data),
  delete:  (id)        => api.delete(`/networth/${id}`),
}