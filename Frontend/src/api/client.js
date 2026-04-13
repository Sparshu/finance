const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api'

function getToken() {
  return localStorage.getItem('finio_token')
}

// ── Error message translation ─────────────────────────────────────────────────
const ERROR_MAP = {
  'invalid credentials':              'Incorrect email or password. Please try again.',
  'invalid email or password':        'Incorrect email or password. Please try again.',
  'bad credentials':                  'Incorrect email or password. Please try again.',
  'email already registered':         'An account with this email already exists. Try signing in instead.',
  'unauthorized':                     'Your session has expired. Please sign in again.',
  'please verify your email':       'Please verify your email before signing in. Check your inbox for the OTP.',
  'no otp was requested':             'No verification code was sent. Please start the sign-in process again.',
  'invalid otp':                      'That code doesn\'t match. Please check your email and try again.',
  'otp has expired':                  'The verification code has expired. Please request a new one.',
  'this reset link has expired':      'This reset link is no longer valid. Please request a new one.',
  'failed to fetch':                  'Unable to connect. Please check your internet connection.',
  'networkerror':                     'Unable to connect. Please check your internet connection.',
  'load failed':                      'Unable to connect. Please check your internet connection.',
  'request timed out':                'The server is taking longer than expected. Please try again in a moment.',
  'the server may be waking up':      'The server is starting up. Please wait a few seconds and try again.',
  'brevo api error':                  'We couldn\'t send the email right now. Please try again shortly.',
  'failed to send email':             'We couldn\'t send the verification email. Please try again.',
  'not found':                        'The requested item could not be found.',
  'internal server error':            'Something went wrong on our end. Please try again.',
  'bad request':                      'Some information was missing or invalid. Please check your inputs.',
}

function translateError(raw) {
  if (!raw) return 'Something went wrong. Please try again.'
  const lower = raw.toLowerCase()
  for (const [key, friendly] of Object.entries(ERROR_MAP)) {
    if (lower.includes(key)) return friendly
  }
  if (
    lower.includes('exception') ||
    lower.includes('null') ||
    lower.includes('java') ||
    lower.includes('org.') ||
    lower.includes('com.finio') ||
    lower.includes('hibernate') ||
    lower.includes('sql')
  ) {
    return 'Something went wrong on our end. Please try again.'
  }
  if (raw.length < 120 && !raw.includes('\n') && !raw.includes('\t')) return raw
  return 'Something went wrong. Please try again.'
}

async function request(method, path, body) {
  const headers = { 'Content-Type': 'application/json' }
  const token = getToken()
  if (token) headers['Authorization'] = `Bearer ${token}`

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 60000)

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    })
    clearTimeout(timeout)

    if (!res.ok) {
      // Read the body first so we can distinguish wrong-password (401 on /auth/*)
      // from a real session expiry (401 on protected endpoints)
      let raw = res.statusText
      try {
        const err = await res.json()
        if (err.errors && typeof err.errors === 'object') {
          raw = Object.values(err.errors).join(', ')
        } else {
          raw = err.message || err.error || raw
        }
      } catch { /* ignore parse errors */ }

      // Only force-logout on 401/403 for protected endpoints (not /auth/*)
      const isAuthEndpoint = path.startsWith('/auth/')
      if ((res.status === 401 || res.status === 403) && !isAuthEndpoint && token) {
        localStorage.removeItem('finio_token')
        localStorage.removeItem('finio_user')
        window.location.reload()
      }

      throw new Error(translateError(raw))
    }

    if (res.status === 204) return null
    return res.json()
  } catch (err) {
    clearTimeout(timeout)
    if (err.name === 'AbortError') {
      throw new Error('The server is taking longer than expected. Please try again in a moment.')
    }
    if (Object.values(ERROR_MAP).includes(err.message)) throw err
    throw new Error(translateError(err.message))
  }
}

export const api = {
  get:    (path)       => request('GET',    path),
  post:   (path, body) => request('POST',   path, body),
  put:    (path, body) => request('PUT',    path, body),
  patch:  (path, body) => request('PATCH',  path, body),
  delete: (path)       => request('DELETE', path),
}