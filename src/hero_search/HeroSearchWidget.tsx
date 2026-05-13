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

  return (
    <div
      ref={widgetRef}
      className={`asklayer-widget relative w-full max-w-[780px] mx-auto text-sm text-al-text ${className}`}
    >
      {/* ── Floating chat panel ── */}
      <div
        className={[
          'fixed z-[9999] w-[360px] h-[580px] flex flex-col',
          'border border-al-border rounded-2xl bg-al-surface overflow-hidden',
          'shadow-[0_4px_16px_rgba(0,0,0,0.08),0_12px_40px_rgba(0,0,0,0.10)]',
          'transition-[opacity,transform] duration-[220ms] ease-[cubic-bezier(0.16,1,0.3,1)]',
          isOpen
            ? 'opacity-100 pointer-events-auto translate-y-0 scale-100'
            : 'opacity-0 pointer-events-none -translate-y-1.5 scale-[0.98]',
        ].join(' ')}
        style={panelPos ? { left: panelPos.left, top: panelPos.top } : { left: 0, top: 0 }}
        aria-live="polite"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3.5 py-[13px] border-b border-al-border-soft">
          <div className="flex items-center gap-2.5">
            <div className="grid place-items-center w-[34px] h-[34px] rounded-[10px] bg-al-dark text-white shrink-0">
              <SparkleIcon size={14} />
            </div>
            <div className="flex flex-col gap-px">
              <span className="text-[13.5px] font-[620] tracking-[-0.02em] text-al-text leading-tight">
                {brandName}
              </span>
              <span className="text-[11.5px] text-al-text-muted leading-tight">Ask me anything</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            aria-label="Close chat"
            className="grid place-items-center w-6.5 h-6.5 rounded-lg border-0 bg-transparent text-al-text-soft cursor-pointer transition-[color,background] duration-150 hover:text-al-text hover:bg-al-border-soft"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Messages */}
        <div className="asklayer-messages flex-1 overflow-y-auto flex flex-col gap-3.5 p-4 px-3.5 bg-al-surface">
          {messages.map((msg) => (
            <MessageRow key={msg.id} message={msg} />
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="flex gap-1 items-center px-3 py-2.5" aria-label="Thinking…">
                <span className="block w-[5px] h-[5px] rounded-full bg-al-text-soft [animation:al-bounce_900ms_infinite_ease-in-out]" />
                <span className="block w-[5px] h-[5px] rounded-full bg-al-text-soft [animation:al-bounce_900ms_130ms_infinite_ease-in-out]" />
                <span className="block w-[5px] h-[5px] rounded-full bg-al-text-soft [animation:al-bounce_900ms_260ms_infinite_ease-in-out]" />
              </div>
            </div>
          )}

          {error && (
            <div className="text-[12.5px] text-[#be123c] py-1 px-0.5" role="alert">
              {error}
            </div>
          )}

          <div ref={scrollRef} />
        </div>

        {/* Follow-up input */}
        <div className="px-3 pt-2.5 pb-3 border-t border-al-border-soft">
          <form
            onSubmit={handleFollowUpSubmit}
            className="flex items-center gap-2 pl-3 pr-2 py-2 border border-al-border rounded-xl bg-al-surface-2 transition-[border-color,background,box-shadow] duration-[180ms] focus-within:border-[#a1a1aa] focus-within:bg-al-surface focus-within:shadow-[0_0_0_3px_rgba(0,0,0,0.05)]"
          >
            <input
              ref={followUpRef}
              value={followUp}
              onChange={(e) => setFollowUp(e.target.value)}
              placeholder="Ask a follow-up…"
              aria-label="Ask a follow-up question"
              disabled={isLoading}
              autoComplete="off"
              className="flex-1 min-w-0 border-0 outline-none bg-transparent text-[13px] text-al-text placeholder:text-al-text-soft"
            />
            <button
              type="submit"
              aria-label="Send"
              disabled={!followUp.trim() || isLoading}
              className="grid place-items-center w-7 h-7 shrink-0 border-0 rounded-lg bg-al-border-soft text-al-text-muted cursor-pointer transition-[background,color] duration-150 enabled:hover:bg-al-dark enabled:hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isLoading ? <Spinner /> : <SendIcon />}
            </button>
          </form>
        </div>
      </div>

      {/* ── Hero search bar ── */}
      <div className="flex flex-col gap-[13px]">
        <form
          onSubmit={handleSearchSubmit}
          className="flex items-center gap-3 pl-5 pr-2.5 py-2.5 border-[1.5px] border-al-border rounded-full bg-al-surface min-h-[64px] shadow-[0_1px_3px_rgba(0,0,0,0.06),0_6px_24px_rgba(0,0,0,0.06)] transition-[border-color,box-shadow] duration-200 focus-within:border-[#a1a1aa] focus-within:shadow-[0_1px_3px_rgba(0,0,0,0.06),0_6px_24px_rgba(0,0,0,0.08),0_0_0_3px_rgba(0,0,0,0.05)]"
        >
          <span className="grid place-items-center text-al-text-soft shrink-0" aria-hidden="true">
            <SparkleIcon size={18} />
          </span>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholder}
            aria-label={placeholder}
            autoComplete="off"
            className="flex-1 min-w-0 border-0 outline-none bg-transparent text-[17px] font-[420] tracking-[-0.01em] text-al-text placeholder:text-al-text-soft"
          />
          <button
            type="submit"
            aria-label="Ask"
            disabled={!input.trim() || isLoading}
            className="grid place-items-center w-[42px] h-[42px] shrink-0 border-0 rounded-full bg-al-border-soft text-al-text-muted cursor-pointer transition-[background,color,transform] duration-150 enabled:hover:bg-al-dark enabled:hover:text-white enabled:hover:scale-[1.04] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isLoading ? <Spinner dark /> : <ArrowUpIcon />}
          </button>
        </form>

        <div className="flex flex-wrap gap-2">
          {suggestedQuestions.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => ask(q)}
              disabled={isLoading}
              className="h-[34px] px-[15px] border border-al-border rounded-full bg-al-surface text-al-text-muted text-[13px] cursor-pointer transition-[border-color,color,background] duration-150 enabled:hover:border-[#a1a1aa] enabled:hover:text-al-text enabled:hover:bg-al-surface-2 disabled:opacity-45 disabled:cursor-not-allowed"
            >
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
    <div
      className={`flex [animation:al-msg-in_200ms_cubic-bezier(0.16,1,0.3,1)_both] ${
        isUser ? 'justify-end' : 'justify-start'
      }`}
    >
      {isUser ? (
        <div className="max-w-[75%] px-[13px] py-2 rounded-[18px_18px_4px_18px] bg-al-dark text-white text-[13.5px] leading-[1.5] break-words">
          {message.content}
        </div>
      ) : (
        <div className="max-w-[90%] text-[13.5px] leading-[1.62] text-al-text-2">
          <p className="m-0 whitespace-pre-wrap [overflow-wrap:anywhere]">{message.content}</p>
          {message.sources && message.sources.length > 0 && (
            <div className="flex flex-wrap gap-[5px] mt-2">
              {message.sources.map((s) => (
                <a
                  key={s.url}
                  href={s.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 max-w-[160px] px-[9px] py-[3px] border border-al-border rounded-full text-al-text-muted bg-al-surface-2 text-[11px] font-medium no-underline overflow-hidden transition-[border-color,color,background] duration-150 hover:border-al-dark hover:text-al-dark"
                >
                  <ExternalLinkIcon />
                  <span className="overflow-hidden text-ellipsis whitespace-nowrap">{s.title || s.url}</span>
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function Spinner({ dark = false }: { dark?: boolean }) {
  return (
    <span
      className={[
        'block w-[14px] h-[14px] rounded-full border-2 border-t-current',
        '[animation:al-spin_700ms_linear_infinite]',
        dark ? 'border-white/30 border-t-white' : 'border-black/15',
      ].join(' ')}
    />
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
