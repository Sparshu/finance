const BASE = 'http://localhost:8080/api'

function getToken() {
  return localStorage.getItem('finio_token')
}

async function request(method, path, body) {
  const headers = { 'Content-Type': 'application/json' }
  const token = getToken()
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  if (res.status === 401 || res.status === 403) {
    localStorage.removeItem('finio_token')
    localStorage.removeItem('finio_user')
    window.location.reload()
    throw new Error('Session expired. Please log in again.')
  }

  if (!res.ok) {
    let message = res.statusText
    try {
      const err = await res.json()
      if (err.errors && typeof err.errors === 'object') {
        // Spring validation error — join all field messages
        message = Object.values(err.errors).join(', ')
      } else {
        message = err.message || err.error || message
      }
    } catch { /* ignore parse errors */ }
    throw new Error(message)
  }

  if (res.status === 204) return null
  return res.json()
}

export const api = {
  get:    (path)       => request('GET',    path),
  post:   (path, body) => request('POST',   path, body),
  put:    (path, body) => request('PUT',    path, body),
  patch:  (path, body) => request('PATCH',  path, body),
  delete: (path)       => request('DELETE', path),
}