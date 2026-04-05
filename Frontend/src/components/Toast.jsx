import { useState, useEffect, useCallback, createContext, useContext, useRef } from 'react'

const ToastContext = createContext(null)

export function useToast() {
  return useContext(ToastContext)
}

let _id = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const add = useCallback((message, type = 'success') => {
    const id = ++_id
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500)
  }, [])

  const remove = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const toast = {
    success: (msg) => add(msg, 'success'),
    error:   (msg) => add(msg, 'error'),
    info:    (msg) => add(msg, 'info'),
  }

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div style={{
        position: 'fixed', bottom: 28, right: 28,
        display: 'flex', flexDirection: 'column', gap: 10,
        zIndex: 9999, pointerEvents: 'none',
      }}>
        {toasts.map(t => (
          <div
            key={t.id}
            onClick={() => remove(t.id)}
            style={{
              pointerEvents: 'all',
              background: t.type === 'error' ? 'var(--red-bg)' : t.type === 'info' ? 'var(--blue-bg)' : 'var(--accent-soft)',
              border: `1px solid ${t.type === 'error' ? 'var(--red)' : t.type === 'info' ? 'var(--blue)' : 'var(--accent)'}`,
              color: t.type === 'error' ? 'var(--red)' : t.type === 'info' ? 'var(--blue)' : 'var(--accent)',
              borderRadius: 12,
              padding: '12px 18px',
              fontSize: 13,
              fontFamily: 'var(--mono)',
              maxWidth: 320,
              cursor: 'pointer',
              backdropFilter: 'blur(12px)',
              animation: 'fadeUp .25s ease both',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
            }}
          >
            <span>{t.type === 'error' ? '✕' : t.type === 'info' ? 'ℹ' : '✓'}</span>
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}