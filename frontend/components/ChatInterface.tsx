'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { askQuestion, type ChatTurn } from '@/lib/api'
import type { AgeGroup, AnswerLanguage, ChatMessage, UserProfile, VerseCard } from '@/types'
import VerseCardComponent from './VerseCard'
import SpeakButton from './SpeakButton'
import MicButton from './MicButton'
import MadhavLight from './MadhavLight'

function generateId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

const PROFILE_KEY = 'askmadhav_profile'
const AUTOREAD_KEY = 'askmadhav_autoread'
const CHAT_KEY = 'askmadhav_chat'
// Handoff key read by the Sankalpa Journal to prefill today's intention.
const PENDING_INTENTION_KEY = 'askmadhav_pending_intention'
// Keep persistence bounded so localStorage never grows without limit.
const MAX_PERSISTED = 20

// Labels for the inline tuning bar. Age is optional ('' = not disclosed);
// language always has a value (defaults to English).
const AGE_OPTIONS: { value: AgeGroup | ''; label: string }[] = [
  { value: '', label: 'Your age (optional)' },
  { value: 'under-18', label: 'Under 18' },
  { value: '18-25', label: '18–25' },
  { value: '26-40', label: '26–40' },
  { value: '41-60', label: '41–60' },
  { value: '60-plus', label: '60+' },
]

const LANGUAGE_OPTIONS: { value: AnswerLanguage; label: string }[] = [
  { value: 'english', label: 'English' },
  { value: 'hindi', label: 'हिंदी' },
  { value: 'hinglish', label: 'Hinglish' },
]

function loadProfile(): UserProfile {
  if (typeof window === 'undefined') return { language: 'english' }
  try {
    const raw = window.localStorage.getItem(PROFILE_KEY)
    if (raw) {
      const p = JSON.parse(raw) as Partial<UserProfile>
      return { language: p.language ?? 'english', ageGroup: p.ageGroup }
    }
  } catch {
    // Corrupt/blocked storage — fall through to the default.
  }
  return { language: 'english' }
}

// A wider pool than we show at once — we rotate a random 5 each visit so the
// page never feels static, and seekers discover different ways in.
const SUGGESTED_POOL = [
  'I feel like giving up on my job',
  'How do I deal with anxiety?',
  "I'm grieving a loved one",
  'How do I control my anger?',
  'What is my purpose in life?',
  'I feel stuck and unmotivated',
  'How do I let go of someone?',
  'I am afraid of failure',
  'How do I find inner peace?',
  'I feel overwhelmed by everything',
]

function pickSuggestions(): string[] {
  return [...SUGGESTED_POOL].sort(() => Math.random() - 0.5).slice(0, 5)
}

const GREETING =
  'Hari Om, Parth. I am Madhav. Whatever weighs on your heart, speak it freely — and we shall look at it together in the light of the Gita.'

function makeGreeting(): ChatMessage {
  return { id: generateId(), role: 'assistant', content: GREETING, timestamp: new Date() }
}

// Restore a saved conversation. Returns null when there's nothing meaningful
// (no prior question) so first-time seekers still open on the greeting.
function loadChat(): ChatMessage[] | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(CHAT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as ChatMessage[]
    if (!Array.isArray(parsed) || !parsed.some((m) => m.role === 'user')) return null
    return parsed.map((m) => ({ ...m, timestamp: new Date(m.timestamp) }))
  } catch {
    return null
  }
}

// The theme the seeker last explored, for a warm "welcome back" line.
function lastTheme(messages: ChatMessage[]): string | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    const t = messages[i].verses?.[0]?.themes?.[0]
    if (t) return t
  }
  return null
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<ChatMessage[]>([makeGreeting()])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState<UserProfile>({ language: 'english' })
  // Auto-read each new answer aloud — hands-free, and accessible for blind /
  // low-vision seekers who want every reply spoken without tapping "Listen".
  const [autoRead, setAutoRead] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>(() => SUGGESTED_POOL.slice(0, 5))
  const [showSuggest, setShowSuggest] = useState(true)
  const [recap, setRecap] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const didMount = useRef(false)
  const restored = useRef(false)

  // Hydrate saved preferences + conversation after mount (avoids SSR/client
  // markup mismatch, and keeps random suggestions off the server render).
  useEffect(() => {
    setProfile(loadProfile())
    try {
      setAutoRead(window.localStorage.getItem(AUTOREAD_KEY) === '1')
    } catch {
      /* storage blocked — default off */
    }
    setSuggestions(pickSuggestions())

    const saved = loadChat()
    if (saved) {
      setMessages(saved)
      restored.current = true
      setShowSuggest(false) // returning seeker is mid-thread; don't crowd them
      const theme = lastTheme(saved)
      setRecap(
        theme
          ? `Welcome back, Parth. Last time we sat with ${theme}. How does your heart sit today?`
          : 'Welcome back, Parth. I am here. Where shall we begin today?',
      )
    }
  }, [])

  // Persist the conversation (bounded) whenever it changes, but not the lone
  // opening greeting — only once there's a real exchange worth keeping.
  useEffect(() => {
    if (!restored.current && !messages.some((m) => m.role === 'user')) return
    try {
      window.localStorage.setItem(CHAT_KEY, JSON.stringify(messages.slice(-MAX_PERSISTED)))
    } catch {
      /* storage blocked / quota — in-memory conversation still works */
    }
  }, [messages])

  const updateProfile = (next: UserProfile) => {
    setProfile(next)
    try {
      window.localStorage.setItem(PROFILE_KEY, JSON.stringify(next))
    } catch {
      // Storage blocked (private mode) — the in-memory choice still applies.
    }
  }

  const toggleAutoRead = () => {
    setAutoRead((prev) => {
      const next = !prev
      // Turning it OFF must immediately silence any answer being read aloud.
      if (!next && typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
      try {
        window.localStorage.setItem(AUTOREAD_KEY, next ? '1' : '0')
      } catch {
        /* storage blocked — in-memory only */
      }
      return next
    })
  }

  const startNewConversation = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
    setMessages([makeGreeting()])
    setRecap(null)
    setShowSuggest(true)
    setSuggestions(pickSuggestions())
    restored.current = false
    try {
      window.localStorage.removeItem(CHAT_KEY)
    } catch {
      /* ignore */
    }
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  useEffect(() => {
    // Skip the initial mount so the homepage opens on the hero, not the chat.
    if (!didMount.current) {
      didMount.current = true
      return
    }
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [messages])

  // A prefill stashed by another page (e.g. ChapterBridge on /verse/2.47) before
  // navigating here — pick it up once on mount and focus the input.
  useEffect(() => {
    try {
      const pending = sessionStorage.getItem('madhav:prefill')
      if (pending) {
        sessionStorage.removeItem('madhav:prefill')
        setInput(pending)
        setTimeout(() => {
          document.getElementById('chat')?.scrollIntoView({ behavior: 'smooth' })
          inputRef.current?.focus()
        }, 400)
      }
    } catch {
      /* storage blocked — nothing to restore */
    }
  }, [])

  // Listen for prefill events fired by PopularVerses / ChapterBrowser
  useEffect(() => {
    const handler = (e: Event) => {
      const question = (e as CustomEvent<{ question: string }>).detail?.question
      if (question) {
        setInput(question)
        setTimeout(() => inputRef.current?.focus(), 300)
      }
    }
    window.addEventListener('madhav:prefill', handler)
    return () => window.removeEventListener('madhav:prefill', handler)
  }, [])

  const handleSend = async (question?: string) => {
    const q = (question || input).trim()
    if (!q || loading) return

    const userMsg: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: q,
      timestamp: new Date(),
    }
    // Build conversation history (exclude verse cards/disclaimers — text only)
    // so Madhav can follow the thread of the conversation.
    const history: ChatTurn[] = messages
      .filter((m) => m.content?.trim())
      .map((m) => ({ role: m.role, content: m.content }))

    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)
    setRecap(null)

    try {
      const response = await askQuestion(q, history, profile)
      const assistantMsg: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: response.answer,
        verses: response.verses,
        disclaimer: response.disclaimer,
        source: response.source,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, assistantMsg])
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: generateId(),
          role: 'assistant',
          content:
            'Madhav is momentarily unavailable. Please check your connection and try again in a moment.',
          timestamp: new Date(),
        },
      ])
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Carry a practical step into the Journal as today's intention, then go there.
  const makeIntention = (msg: ChatMessage) => {
    const step = msg.verses?.[0]?.practical_guidance?.trim()
    const intention = step || msg.content.split('\n\n')[0].slice(0, 240)
    try {
      window.localStorage.setItem(PENDING_INTENTION_KEY, intention)
    } catch {
      /* storage blocked — Journal will just open empty */
    }
    window.location.href = '/journal'
  }

  const conversationStarted = messages.some((m) => m.role === 'user')

  // The newest assistant reply — the only one auto-read aloud when enabled.
  const lastAssistantId = messages.reduce<string | null>(
    (acc, m) => (m.role === 'assistant' ? m.id : acc),
    null,
  )

  return (
    <section id="chat" className="py-14 sm:py-20 px-6" style={{ background: '#FFFCF5' }}>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          {/* Krishna & Arjuna at Kurukshetra — Madhav, ready to counsel */}
          <div className="relative mx-auto mb-6 w-28 h-28 group">
            <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-saffron/30 to-gold/20 blur-xl lotus-pulse pointer-events-none" />
            <div className="relative w-28 h-28 rounded-full overflow-hidden border-2 border-saffron/40 shadow-lg shadow-saffron/20">
              <Image
                src="/art/scene-3.png"
                alt="Krishna (Madhav) and Arjuna in dialogue on the field of Kurukshetra"
                fill
                sizes="112px"
                className="object-cover object-top transition-transform duration-700 group-hover:scale-110"
              />
            </div>
          </div>
          <p className="text-saffron/70 text-xs tracking-[0.3em] uppercase mb-2">Gita Guidance</p>
          <h2
            className="text-4xl font-bold text-ink"
            style={{ fontFamily: 'Crimson Text, serif' }}
          >
            Ask Madhav
          </h2>
          <p className="text-ink/50 mt-3 text-sm">
            Every answer is grounded in a real verse from the Bhagavad Gita
          </p>
        </div>

        {/* Suggested questions — a rotating set; collapses once the dialogue
            begins, with a quiet way to surface fresh prompts. */}
        {(!conversationStarted || showSuggest) && (
          <div className="flex flex-wrap gap-2 justify-center mb-4">
            {suggestions.map((q) => (
              <button
                key={q}
                onClick={() => handleSend(q)}
                disabled={loading}
                className="px-3 py-1.5 border border-saffron/20 text-ink/60 text-xs rounded-full
                           hover:border-saffron/50 hover:text-ink/90 transition-all disabled:opacity-40"
              >
                {q}
              </button>
            ))}
          </div>
        )}
        {conversationStarted && (
          <div className="flex justify-center mb-6 gap-4">
            <button
              onClick={() => {
                setSuggestions(pickSuggestions())
                setShowSuggest((s) => !s)
              }}
              className="text-saffron/60 hover:text-saffron text-xs transition-colors"
            >
              ✦ {showSuggest ? 'Hide prompts' : 'Try another question'}
            </button>
            <button
              onClick={startNewConversation}
              className="text-ink/40 hover:text-saffron text-xs transition-colors"
            >
              ↺ Start a new conversation
            </button>
          </div>
        )}

        {/* Returning-seeker recap */}
        {recap && (
          <div className="mb-6 text-center">
            <p className="inline-block text-saffron/80 text-sm border border-saffron/20 bg-saffron/[0.05] rounded-full px-4 py-2">
              {recap}
            </p>
          </div>
        )}

        {/* Chat window */}
        <div
          className="border border-saffron/20 rounded-2xl overflow-hidden"
          style={{ background: '#FFFFFF' }}
        >
          {/* Messages area */}
          <div className="h-[26rem] sm:h-[520px] overflow-y-auto p-4 sm:p-6 space-y-6">
            {messages.map((msg, idx) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {/* Madhav's presence — rendered as living light, not a face.
                    It awakens and pulses with his voice when the reply is read
                    aloud (see MadhavLight + SpeakButton). */}
                {msg.role === 'assistant' && (
                  <div className="mr-3 flex-shrink-0 mt-1">
                    <MadhavLight id={msg.id} size={32} />
                  </div>
                )}

                <div className={msg.role === 'user' ? 'max-w-[70%]' : 'max-w-[90%] space-y-3'}>
                  {msg.role === 'user' ? (
                    <div className="bg-saffron text-navy rounded-2xl rounded-tr-sm px-4 py-3 text-sm font-medium">
                      {msg.content}
                    </div>
                  ) : (
                    <>
                      {/* Answer text — preserve newlines. aria-live so screen
                          readers announce each new reply automatically. */}
                      <div
                        className="bg-saffron/5 rounded-2xl rounded-tl-sm px-4 py-3 text-ink/90 text-sm leading-relaxed"
                        aria-live="polite"
                      >
                        {msg.content.split('\n\n').map((para, i) => (
                          <p key={i} className={i > 0 ? 'mt-3' : ''}>
                            {para}
                          </p>
                        ))}
                      </div>

                      {/* Listen + Copy controls + source badge — every answer can
                          be heard or kept; the newest is auto-read when enabled. */}
                      <div className="flex items-center gap-3 px-1 flex-wrap">
                        <SpeakButton
                          text={msg.content}
                          language={profile.language}
                          autoPlay={autoRead && msg.id === lastAssistantId}
                          speechId={msg.id}
                        />
                        <CopyButton text={msg.content} />
                        <ShareAnswerButton
                          quote={msg.content.split('\n\n')[0]}
                          question={
                            idx > 0 && messages[idx - 1].role === 'user'
                              ? messages[idx - 1].content
                              : undefined
                          }
                        />
                        {msg.source === 'ai' && (
                          <p className="text-saffron/40 text-[10px] tracking-wider uppercase flex items-center gap-1">
                            <span className="select-none">✦</span> Guided by Madhav, grounded in the verses below
                          </p>
                        )}
                      </div>

                      {/* Verse cards */}
                      {msg.verses && msg.verses.length > 0 && (
                        <div className="space-y-3">
                          {msg.verses.map((v: VerseCard) => (
                            <VerseCardComponent key={v.reference} verse={v} collapsible />
                          ))}
                        </div>
                      )}

                      {/* Carry the guidance into daily practice */}
                      {msg.verses && msg.verses.length > 0 && (
                        <button
                          onClick={() => makeIntention(msg)}
                          className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full
                                     border border-saffron/40 text-saffron hover:bg-saffron/10 transition-colors"
                        >
                          🕉 Make this my intention for today →
                        </button>
                      )}

                      {/* Disclaimer */}
                      {msg.disclaimer && (
                        <p className="text-ink/25 text-xs px-1 leading-relaxed">
                          {msg.disclaimer}
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {loading && (
              <div className="flex justify-start">
                <div className="mr-3 flex-shrink-0 mt-1">
                  <MadhavLight thinking size={32} />
                </div>
                <div className="bg-saffron/5 rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex gap-1.5 items-center h-5">
                    <span
                      className="w-2 h-2 rounded-full bg-saffron/50 animate-bounce"
                      style={{ animationDelay: '0ms' }}
                    />
                    <span
                      className="w-2 h-2 rounded-full bg-saffron/50 animate-bounce"
                      style={{ animationDelay: '150ms' }}
                    />
                    <span
                      className="w-2 h-2 rounded-full bg-saffron/50 animate-bounce"
                      style={{ animationDelay: '300ms' }}
                    />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input bar */}
          <div className="border-t border-saffron/10 p-4">
            {/* Tuning bar — optional, persisted to localStorage. Lets Madhav fit
                analogies to the seeker's world and reply in their language. */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="text-ink/30 text-xs select-none">Tune for you:</span>
              <select
                aria-label="Your age group (optional)"
                value={profile.ageGroup ?? ''}
                onChange={(e) =>
                  updateProfile({
                    ...profile,
                    ageGroup: (e.target.value || undefined) as AgeGroup | undefined,
                  })
                }
                className="bg-saffron/5 border border-saffron/20 rounded-lg px-2.5 py-1.5 text-xs text-ink/70
                           focus:outline-none focus:border-saffron/60 transition-colors cursor-pointer"
              >
                {AGE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <select
                aria-label="Answer language"
                value={profile.language}
                onChange={(e) =>
                  updateProfile({ ...profile, language: e.target.value as AnswerLanguage })
                }
                className="bg-saffron/5 border border-saffron/20 rounded-lg px-2.5 py-1.5 text-xs text-ink/70
                           focus:outline-none focus:border-saffron/60 transition-colors cursor-pointer"
              >
                {LANGUAGE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              {/* Read answers aloud automatically — for hands-free / accessible use. */}
              <button
                type="button"
                onClick={toggleAutoRead}
                aria-pressed={autoRead}
                className={`text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${
                  autoRead
                    ? 'border-saffron/60 text-saffron bg-saffron/10'
                    : 'border-saffron/20 text-ink/50 hover:border-saffron/40'
                }`}
              >
                🔊 {autoRead ? 'Read aloud: on' : 'Read aloud'}
              </button>
              {/* The tuning bar is subtle — say what it does so it's discoverable. */}
              <span className="text-ink/25 text-[11px] basis-full">
                Optional — shapes Madhav&apos;s voice and language to you. Saved on this device only.
              </span>
            </div>
            <div className="flex gap-3">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask a life question, or tap the mic to speak..."
                disabled={loading}
                className="flex-1 bg-saffron/5 border border-saffron/20 rounded-xl px-4 py-3 text-ink
                           placeholder:text-ink/30 focus:outline-none focus:border-saffron/60
                           transition-colors disabled:opacity-50 text-sm"
              />
              <MicButton
                language={profile.language}
                disabled={loading}
                onInterim={(t) => setInput(t)}
                onResult={(t) => handleSend(t)}
              />
              <button
                onClick={() => handleSend()}
                disabled={loading || !input.trim()}
                className="px-6 py-3 bg-saffron text-navy font-medium rounded-xl hover:bg-saffron-light
                           transition-all disabled:opacity-40 disabled:cursor-not-allowed text-sm
                           hover:scale-105 active:scale-95"
              >
                Ask
              </button>
            </div>
            <p className="text-ink/20 text-xs mt-2 text-center">
              Press Enter to send · tap the mic to ask by voice
            </p>
            {/* Crisis pathway — always present, gentle, never gating the chat. */}
            <p className="text-ink/30 text-xs mt-1 text-center">
              In crisis or unsafe? You&apos;re not alone — please reach a real person now at{' '}
              <a
                href="https://findahelpline.com"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-saffron transition-colors"
              >
                findahelpline.com
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

// Open a shareable Wisdom Card image for this line of guidance. The card is
// rendered on the fly by /api/og; on mobile the native share sheet is offered.
function ShareAnswerButton({ quote, question }: { quote: string; question?: string }) {
  const buildUrl = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const params = new URLSearchParams({ quote })
    if (question) params.set('q', question)
    return `${origin}/api/og?${params.toString()}`
  }

  const share = async () => {
    const url = buildUrl()
    const nav = typeof navigator !== 'undefined' ? navigator : undefined
    if (nav && typeof nav.share === 'function') {
      try {
        await nav.share({ title: 'Ask Madhav', text: quote, url })
        return
      } catch {
        /* dismissed / unsupported — fall through to opening the card */
      }
    }
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <button
      type="button"
      onClick={share}
      aria-label="Share this guidance as an image"
      className="text-saffron/60 hover:text-saffron text-[11px] flex items-center gap-1 transition-colors"
    >
      ↗ Share
    </button>
  )
}

// Copy an answer to the clipboard, with a brief confirmation.
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      /* clipboard blocked — silently no-op */
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label="Copy this answer"
      className="text-saffron/60 hover:text-saffron text-[11px] flex items-center gap-1 transition-colors"
    >
      {copied ? '✓ Copied' : '⧉ Copy'}
    </button>
  )
}
