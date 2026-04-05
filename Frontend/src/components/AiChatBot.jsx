import { useState, useRef, useEffect } from 'react'
import styles from './AiChatBot.module.css'

const SUGGESTIONS = [
  'How should I allocate my ₹50,000 salary?',
  'Am I overspending on wants?',
  'How much should I save each month?',
  'Explain the 50-30-20 rule',
]

// Standalone fetch — intentionally does NOT use the shared api client
// so any AI error never triggers the global 401/403 logout handler
async function callAiChat(messages) {
  const token = localStorage.getItem('finio_token')

  let res
  try {
    res = await fetch('http://localhost:8080/api/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ messages }),
    })
  } catch (networkErr) {
    throw new Error('Cannot reach server. Is the backend running?')
  }

  let data
  try {
    data = await res.json()
  } catch {
    throw new Error(`Server error (${res.status})`)
  }

  if (!res.ok) {
    // Extract a plain string from whatever shape Spring Boot returns
    const msg =
      (typeof data.error === 'string' ? data.error : null) ||
      (typeof data.message === 'string' ? data.message : null) ||
      (data.errors ? Object.values(data.errors).join(', ') : null) ||
      `Request failed (${res.status})`
    throw new Error(msg)
  }

  return data
}

export default function AIChatbot() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I'm **Finio AI** 👋 I'll help you budget smarter using the **50-30-20 rule**.\n\nShare your monthly income and I'll break down exactly how to allocate it!",
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100)
  }, [open])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const send = async (text) => {
    const userMsg = text.trim()
    if (!userMsg || loading) return
    setInput('')

    // Build API history: skip the initial assistant greeting (index 0),
    // then append the new user message. API requires alternating roles starting with 'user'.
    const apiHistory = [
      ...messages.slice(1).map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: userMsg },
    ]

    setMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setLoading(true)

    try {
      const data = await callAiChat(apiHistory)
      const reply = data.content?.map(b => b.text || '').join('') || 'Sorry, I had trouble responding.'
      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
    } catch (err) {
      const errMsg = err instanceof Error
        ? err.message
        : (typeof err === 'string' ? err : 'Something went wrong. Please try again.')
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '⚠️ ' + errMsg,
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send(input)
    }
  }

  const renderContent = (text) =>
    text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br/>')

  return (
    <>
      {/* Floating Button */}
      <button
        className={`${styles.fab} ${open ? styles.fabOpen : ''}`}
        onClick={() => setOpen(o => !o)}
        title="Finio AI – 50-30-20 Advisor"
        aria-label="Open AI chat"
      >
        {open ? (
          <span className={styles.fabIcon}>✕</span>
        ) : (
          <span className={styles.fabIcon}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <span className={styles.aiBadge}>AI</span>
          </span>
        )}
      </button>

      {/* Chat Panel */}
      {open && (
        <div className={styles.panel}>
          {/* Header */}
          <div className={styles.header}>
            <div className={styles.headerLeft}>
              <div className={styles.avatar}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              </div>
              <div>
                <div className={styles.headerTitle}>Finio AI</div>
                <div className={styles.headerSub}>50-30-20 Budget Advisor</div>
              </div>
            </div>
            <div className={styles.statusDot} title="Online" />
          </div>

          {/* Rule Banner */}
          <div className={styles.ruleBanner}>
            <span className={styles.ruleItem}><span style={{color:'var(--blue)'}}>50%</span> Needs</span>
            <span className={styles.ruleDivider}>·</span>
            <span className={styles.ruleItem}><span style={{color:'var(--amber)'}}>30%</span> Wants</span>
            <span className={styles.ruleDivider}>·</span>
            <span className={styles.ruleItem}><span style={{color:'var(--accent)'}}>20%</span> Savings</span>
          </div>

          {/* Messages */}
          <div className={styles.messages}>
            {messages.map((msg, i) => (
              <div key={i} className={`${styles.msgRow} ${msg.role === 'user' ? styles.userRow : styles.aiRow}`}>
                {msg.role === 'assistant' && (
                  <div className={styles.aiDot}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                  </div>
                )}
                <div
                  className={`${styles.bubble} ${msg.role === 'user' ? styles.userBubble : styles.aiBubble}`}
                  dangerouslySetInnerHTML={{ __html: renderContent(msg.content) }}
                />
              </div>
            ))}

            {loading && (
              <div className={`${styles.msgRow} ${styles.aiRow}`}>
                <div className={styles.aiDot}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                </div>
                <div className={`${styles.bubble} ${styles.aiBubble} ${styles.typingBubble}`}>
                  <span className={styles.dot} />
                  <span className={styles.dot} />
                  <span className={styles.dot} />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Suggestions */}
          {messages.length <= 1 && (
            <div className={styles.suggestions}>
              {SUGGESTIONS.map((s, i) => (
                <button key={i} className={styles.suggestion} onClick={() => send(s)}>
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className={styles.inputRow}>
            <textarea
              ref={inputRef}
              className={styles.input}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask about budgeting..."
              rows={1}
              disabled={loading}
            />
            <button
              className={styles.sendBtn}
              onClick={() => send(input)}
              disabled={!input.trim() || loading}
              aria-label="Send"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  )
}