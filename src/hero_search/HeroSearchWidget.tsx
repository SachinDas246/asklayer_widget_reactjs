import { FormEvent, useEffect, useRef, useState } from 'react'
import { sendWidgetMessage } from '../api'
import type { AskLayerMessage } from '../types'
import type { HeroSearchWidgetProps } from './types'
import './styles.css'

const DEFAULT_SUGGESTIONS = [
  'How does this work?',
  'What are the pricing plans?',
  'Who is this for?',
]

function createId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function HeroSearchWidget({
  apiBaseUrl,
  apiKey,
  placeholder = 'Ask anything about this site…',
  suggestedQuestions = DEFAULT_SUGGESTIONS,
  brandName = 'AskLayer',
  className = '',
  onError,
}: HeroSearchWidgetProps) {
  const [input, setInput] = useState('')
  const [followUp, setFollowUp] = useState('')
  const [messages, setMessages] = useState<AskLayerMessage[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const followUpRef = useRef<HTMLInputElement>(null)
  const widgetRef = useRef<HTMLDivElement>(null)
  const [panelPos, setPanelPos] = useState<{ left: number; top: number } | null>(null)

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, isLoading])

  useEffect(() => {
    if (isOpen && widgetRef.current) {
      const rect = widgetRef.current.getBoundingClientRect()
      const panelHeight = 580
      const idealTop = rect.top
      const clampedTop = Math.max(16, Math.min(idealTop, window.innerHeight - panelHeight - 16))
      setPanelPos({ left: 20, top: clampedTop })
    }
  }, [isOpen])

  async function ask(message: string) {
    const text = message.trim()
    if (!text || isLoading) return

    const history = messages.map(({ role, content }) => ({ role, content }))
    const userMessage: AskLayerMessage = { id: createId(), role: 'user', content: text }

    setIsOpen(true)
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setFollowUp('')
    setError('')
    setIsLoading(true)
    setTimeout(() => followUpRef.current?.focus(), 100)

    try {
      const response = await sendWidgetMessage({ apiBaseUrl, apiKey, message: text, history })
      setMessages((prev) => [
        ...prev,
        {
          id: createId(),
          role: 'assistant',
          content: response.answer,
          sources: response.sources || [],
        },
      ])
    } catch (err) {
      const nextError = err instanceof Error ? err : new Error('Could not get an answer right now.')
      setError(nextError.message)
      onError?.(nextError)
    } finally {
      setIsLoading(false)
    }
  }

  function handleSearchSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    ask(input)
  }

  function handleFollowUpSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    ask(followUp)
  }

  function close() {
    setIsOpen(false)
  }

  return (
    <div ref={widgetRef} className={`asklayer-widget${isOpen ? ' asklayer-open' : ''} ${className}`}>

      {/* ── LEFT: compact chat panel (fixed, floats over page) ── */}
      <div
        className="asklayer-chat-panel"
        style={panelPos ? { left: panelPos.left, top: panelPos.top } : undefined}
        aria-live="polite"
      >
        {/* header */}
        <div className="asklayer-chat-header">
          <div className="asklayer-chat-brand">
            <div className="asklayer-chat-brand-icon" aria-hidden="true">
              <SparkleIcon size={14} />
            </div>
            <div className="asklayer-chat-brand-text">
              <span className="asklayer-chat-brand-name">{brandName}</span>
              <span className="asklayer-chat-brand-sub">Ask me anything</span>
            </div>
          </div>
          <button
            className="asklayer-close-btn"
            type="button"
            onClick={close}
            aria-label="Close chat"
          >
            <CloseIcon />
          </button>
        </div>

        {/* messages */}
        <div className="asklayer-messages">
          {messages.map((msg) => (
            <MessageRow key={msg.id} message={msg} />
          ))}

          {isLoading && (
            <div className="asklayer-row assistant">
              <div className="asklayer-typing" aria-label="Thinking…">
                <span /><span /><span />
              </div>
            </div>
          )}

          {error && (
            <div className="asklayer-error" role="alert">{error}</div>
          )}

          <div ref={scrollRef} />
        </div>

        {/* follow-up input */}
        <div className="asklayer-chat-footer">
          <form className="asklayer-followup-form" onSubmit={handleFollowUpSubmit}>
            <input
              ref={followUpRef}
              value={followUp}
              onChange={(e) => setFollowUp(e.target.value)}
              placeholder="Ask a follow-up…"
              aria-label="Ask a follow-up question"
              disabled={isLoading}
              autoComplete="off"
            />
            <button type="submit" aria-label="Send" disabled={!followUp.trim() || isLoading}>
              {isLoading ? <span className="asklayer-spinner" /> : <SendIcon />}
            </button>
          </form>
        </div>
      </div>

      {/* ── RIGHT: hero search bar ── */}
      <div className="asklayer-search-area">
        <form className="asklayer-searchbar" onSubmit={handleSearchSubmit}>
          <span className="asklayer-searchbar-icon" aria-hidden="true">
            <SparkleIcon size={18} />
          </span>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholder}
            aria-label={placeholder}
            autoComplete="off"
          />
          <button type="submit" aria-label="Ask" disabled={!input.trim() || isLoading}>
            {isLoading ? <span className="asklayer-spinner asklayer-spinner--dark" /> : <ArrowUpIcon />}
          </button>
        </form>

        <div className="asklayer-suggestions">
          {suggestedQuestions.map((q) => (
            <button key={q} type="button" onClick={() => ask(q)} disabled={isLoading}>
              {q}
            </button>
          ))}
        </div>
      </div>

    </div>
  )
}

function MessageRow({ message }: { message: AskLayerMessage }) {
  const isUser = message.role === 'user'
  return (
    <div className={`asklayer-row ${isUser ? 'user' : 'assistant'}`}>
      {isUser ? (
        <div className="asklayer-user-bubble">{message.content}</div>
      ) : (
        <div className="asklayer-ai-text">
          <p>{message.content}</p>
          {message.sources && message.sources.length > 0 && (
            <div className="asklayer-sources">
              {message.sources.map((s) => (
                <a key={s.url} href={s.url} target="_blank" rel="noreferrer">
                  <ExternalLinkIcon />
                  <span>{s.title || s.url}</span>
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ─── Icons ─────────────────────────────────────────────────────────── */

function SparkleIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2 L13.6 8.4 L20 10 L13.6 11.6 L12 18 L10.4 11.6 L4 10 L10.4 8.4 Z" />
      <path d="M19 15 L19.9 17.6 L22.5 18.5 L19.9 19.4 L19 22 L18.1 19.4 L15.5 18.5 L18.1 17.6 Z" />
    </svg>
  )
}

function ArrowUpIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 19V5" />
      <path d="m5 12 7-7 7 7" />
    </svg>
  )
}

function SendIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 19V5" />
      <path d="m5 12 7-7 7 7" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
      <path d="M18 6 6 18" /><path d="m6 6 12 12" />
    </svg>
  )
}

function ExternalLinkIcon() {
  return (
    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  )
}
