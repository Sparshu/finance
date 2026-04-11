import { api } from './client'

// ── User / Profile ────────────────────────────────────────────────────────────
export const userApi = {
  getMe:          ()              => api.get('/users/me'),
  updateProfile:  (name)          => api.patch('/users/me',          { name }),
  changePassword: (currentPassword, newPassword) =>
                                     api.patch('/users/me/password', { currentPassword, newPassword }),
  deleteAccount:  ()              => api.delete('/users/me'),
}

// ── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  // Step 1: submit credentials → triggers OTP email
  login:    (email, password) => api.post('/auth/login',    { email, password }),
  register: (name, email, password) => api.post('/auth/register', { name, email, password }),

  // Step 2: verify OTP → returns JWT (used for both login and register)
  verifyOtp:  (email, otp)  => api.post('/auth/otp/verify',  { email, otp }),
  resendOtp:  (email)       => api.post('/auth/otp/resend',  { email }),

  // Forgot / reset password
  forgotPassword: (email)              => api.post('/auth/forgot-password', { email }),
  resetPassword:  (token, newPassword) => api.post('/auth/reset-password',  { token, newPassword }),
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
  getAll:          ()                    => api.get('/networth'),
  create:          (data)                => api.post('/networth', data),
  update:          (id, data)            => api.put(`/networth/${id}`, data),
  delete:          (id)                  => api.delete(`/networth/${id}`),
  rolloverSavings: (year, month)         => {
    const q = year && month ? `?year=${year}&month=${month}` : ''
    return api.post(`/networth/rollover-savings${q}`)
  },
}

// ── Receipt Scanner ───────────────────────────────────────────────────────────
export const receiptApi = {
  scan: (imageBase64) => {
    const token = localStorage.getItem('finio_token')
    return fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080/api'}/ai/scan-receipt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ image: imageBase64 }),
    }).then(async res => {
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to scan receipt')
      return data
    })
  }
}

// ── Natural Language Transaction ──────────────────────────────────────────────
export const nlApi = {
  parseTransaction: (text) => {
    const token = localStorage.getItem('finio_token')
    return fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8080/api'}/ai/parse-transaction`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ text }),
    }).then(async res => {
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to parse transaction')
      return data
    })
  }
}