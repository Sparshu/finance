import { useState, useRef, useEffect } from 'react'
import { txApi, budgetApi, goalApi, investApi, recurringApi } from '../api/services'
import { nlApi } from '../api/services'
import styles from './AiChatBot.module.css'

const SUGGESTIONS = [
  'Analyze my spending this month',
  'Am I on track with my budgets?',
  'How are my savings goals progressing?',
  'Give me a full 50-30-20 breakdown',
  'Give me budget advice based on my spending',
  'Add transaction: I spent ₹500 on food today',
]

// Detect if message looks like a natural language transaction entry
function isTransactionIntent(text) {
  const lower = text.toLowerCase()
  return (
    lower.includes('spent') || lower.includes('paid') || lower.includes('bought') ||
    lower.includes('received') || lower.includes('earned') || lower.includes('got paid') ||
    lower.includes('add transaction') || lower.includes('log transaction') ||
    lower.includes('record transaction') || lower.includes('add expense') ||
    lower.includes('add income') || /i (spent|paid|bought|got|received|earned)/i.test(text)
  )
}

async function callAiChat(messages, context) {
  const token = localStorage.getItem('finio_token')

  let res
  try {
    res = await fetch('http://localhost:8080/api/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ messages, context }),
    })
  } catch {
    throw new Error('Cannot reach server. Is the backend running?')
  }

  let data
  try {
    data = await res.json()
  } catch {
    throw new Error(`Server error (${res.status})`)
  }

  if (!res.ok) {
    const msg =
      (typeof data.error === 'string' ? data.error : null) ||
      (typeof data.message === 'string' ? data.message : null) ||
      (data.errors ? Object.values(data.errors).join(', ') : null) ||
      `Request failed (${res.status})`
    throw new Error(msg)
  }

  return data
}

async function fetchUserContext() {
  try {
    const [txs, budgets, goals, investments, recurring] = await Promise.all([
      txApi.getAll().catch(() => []),
      budgetApi.getAll().catch(() => []),
      goalApi.getAll().catch(() => []),
      investApi.getAll().catch(() => []),
      recurringApi.getAll().catch(() => []),
    ])
    return { txs, budgets, goals, investments, recurring }
  } catch {
    return {}
  }
}

export default function AIChatbot() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I'm **Finio AI** 👋 I can see your actual transactions, budgets, goals and investments.\n\nAsk me anything about your finances and I'll give you personalized advice!",
    },
  ])
  const [input,   setInput]   = useState('')
  const [loading, setLoading] = useState(false)
  const [context, setContext] = useState(null)
  const bottomRef = useRef(null)
  const inputRef  = useRef(null)

  // Fetch user's financial data when panel opens
  useEffect(() => {
    if (open && !context) {
      fetchUserContext().then(setContext)
    }
  }, [open])

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

    setMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setLoading(true)

    // ── Natural language transaction detection ────────────────────────────────
    if (isTransactionIntent(userMsg)) {
      try {
        const result = await nlApi.parseTransaction(userMsg)
        const p = result.parsed
        const typeLabel = p.type === 'INCOME' ? 'income' : 'expense'
        const reply =
          `Done! I've added this transaction:\n\n` +
          `**${p.name}**\n` +
          `Amount: ₹${Number(p.amount).toLocaleString('en-IN')}\n` +
          `Type: ${p.type}\n` +
          `Category: ${p.category}\n` +
          `Date: ${p.date}` +
          (p.note ? `\nNote: ${p.note}` : '') +
          `\n\nYou can see it in your Transactions page. Let me know if anything looks wrong!`
        setMessages(prev => [...prev, { role: 'assistant', content: reply }])
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : 'Something went wrong.'
        setMessages(prev => [...prev, { role: 'assistant', content: `I tried to add that transaction but ran into an issue: ${errMsg}\n\nTry rephrasing, e.g. "I spent ₹500 on food today"` }])
      } finally {
        setLoading(false)
      }
      return
    }

    // ── Regular AI chat ───────────────────────────────────────────────────────
    const apiHistory = [
      ...messages.slice(1).map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: userMsg },
    ]

    try {
      const freshContext = await fetchUserContext()
      setContext(freshContext)

      const data = await callAiChat(apiHistory, freshContext)
      const reply = data.content?.map(b => b.text || '').join('') || 'Sorry, I had trouble responding.'
      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Something went wrong. Please try again.'
      setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ ' + errMsg }])
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

  // Show a small data indicator so user knows context is loaded
  const hasContext = context && (
    (context.txs?.length > 0) ||
    (context.budgets?.length > 0) ||
    (context.goals?.length > 0) ||
    (context.recurring?.length > 0)
  )

  return (
    <>
      {/* Floating Button */}
      <button
        className={`${styles.fab} ${open ? styles.fabOpen : ''}`}
        onClick={() => setOpen(o => !o)}
        title="Finio AI – Personal Finance Advisor"
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
                <div className={styles.headerSub}>
                  {hasContext
                    ? `📊 ${context.txs?.length || 0} txns · ${context.recurring?.length || 0} recurring`
                    : 'Personal Finance Advisor'}
                </div>
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
              placeholder="Ask about your finances..."
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