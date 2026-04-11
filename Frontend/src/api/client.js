const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api'
function getToken() {
  return localStorage.getItem('finio_token')
}

async function request(method, path, body) {
  const headers = { 'Content-Type': 'application/json' }
  const token = getToken()
  if (token) headers['Authorization'] = `Bearer ${token}`

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 60000) // 60 second timeout

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    })
    clearTimeout(timeout)

    if (res.status === 401 || res.status === 403) {
  // Only reload if user was previously logged in
  if (getToken()) {
    localStorage.removeItem('finio_token')
    localStorage.removeItem('finio_user')
    window.location.reload()
  }
  throw new Error('Session expired. Please log in again.')
}

    if (!res.ok) {
      let message = res.statusText
      try {
        const err = await res.json()
        if (err.errors && typeof err.errors === 'object') {
          message = Object.values(err.errors).join(', ')
        } else {
          message = err.message || err.error || message
        }
      } catch { /* ignore parse errors */ }
      throw new Error(message)
    }

    if (res.status === 204) return null
    return res.json()
  } catch (err) {
    clearTimeout(timeout)
    if (err.name === 'AbortError') {
      throw new Error('Request timed out. The server may be waking up — please try again.')
    }
    throw err
  }
}

export const api = {
  get:    (path)       => request('GET',    path),
  post:   (path, body) => request('POST',   path, body),
  put:    (path, body) => request('PUT',    path, body),
  patch:  (path, body) => request('PATCH',  path, body),
  delete: (path)       => request('DELETE', path),
}