'use client'

import { useState, useRef, useEffect } from 'react'
import { askQuestion, type ChatTurn } from '@/lib/api'
import type { AgeGroup, AnswerLanguage, ChatMessage, UserProfile, VerseCard } from '@/types'
import VerseCardComponent from './VerseCard'

function generateId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

const PROFILE_KEY = 'askmadhav_profile'

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

const SUGGESTED_QUESTIONS = [
  'I feel like giving up on my job',
  'How do I deal with anxiety?',
  "I'm grieving a loved one",
  'How do I control my anger?',
  'What is my purpose in life?',
]

export default function ChatInterface() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: generateId(),
      role: 'assistant',
      content:
        'Namaste. I am here to share the wisdom of the Bhagavad Gita with you. What is weighing on your heart today?',
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState<UserProfile>({ language: 'english' })
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const didMount = useRef(false)

  // Hydrate the saved profile after mount (avoids SSR/client markup mismatch).
  useEffect(() => {
    setProfile(loadProfile())
  }, [])

  const updateProfile = (next: UserProfile) => {
    setProfile(next)
    try {
      window.localStorage.setItem(PROFILE_KEY, JSON.stringify(next))
    } catch {
      // Storage blocked (private mode) — the in-memory choice still applies.
    }
  }

  useEffect(() => {
    // Skip the initial mount so the homepage opens on the hero, not the chat.
    if (!didMount.current) {
      didMount.current = true
      return
    }
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [messages])

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

  return (
    <section id="chat" className="py-20 px-6" style={{ background: '#FFFCF5' }}>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <p className="text-saffron/70 text-xs tracking-[0.3em] uppercase mb-2">Gita Guidance</p>
          <h2
            className="text-4xl font-bold text-ink"
            style={{ fontFamily: 'Crimson Text, serif' }}
          >
            Ask Your Question
          </h2>
          <p className="text-ink/50 mt-3 text-sm">
            Every answer is grounded in a real verse from the Bhagavad Gita
          </p>
        </div>

        {/* Suggested questions */}
        <div className="flex flex-wrap gap-2 justify-center mb-6">
          {SUGGESTED_QUESTIONS.map((q) => (
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

        {/* Chat window */}
        <div
          className="border border-saffron/20 rounded-2xl overflow-hidden"
          style={{ background: '#FFFFFF' }}
        >
          {/* Messages area */}
          <div className="h-[520px] overflow-y-auto p-6 space-y-6">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {/* Avatar for assistant */}
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-saffron/20 flex items-center justify-center mr-3 flex-shrink-0 mt-1">
                    <span className="text-sm select-none">🪷</span>
                  </div>
                )}

                <div className={msg.role === 'user' ? 'max-w-[70%]' : 'max-w-[90%] space-y-3'}>
                  {msg.role === 'user' ? (
                    <div className="bg-saffron text-navy rounded-2xl rounded-tr-sm px-4 py-3 text-sm font-medium">
                      {msg.content}
                    </div>
                  ) : (
                    <>
                      {/* Answer text — preserve newlines */}
                      <div className="bg-saffron/5 rounded-2xl rounded-tl-sm px-4 py-3 text-ink/90 text-sm leading-relaxed">
                        {msg.content.split('\n\n').map((para, i) => (
                          <p key={i} className={i > 0 ? 'mt-3' : ''}>
                            {para}
                          </p>
                        ))}
                      </div>

                      {/* Source badge */}
                      {msg.source === 'ai' && (
                        <p className="text-saffron/40 text-[10px] tracking-wider uppercase px-1 flex items-center gap-1">
                          <span className="select-none">✦</span> Guided by Madhav, grounded in the verses below
                        </p>
                      )}

                      {/* Verse cards */}
                      {msg.verses && msg.verses.length > 0 && (
                        <div className="space-y-3">
                          {msg.verses.map((v: VerseCard) => (
                            <VerseCardComponent key={v.reference} verse={v} />
                          ))}
                        </div>
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
                <div className="w-8 h-8 rounded-full bg-saffron/20 flex items-center justify-center mr-3 flex-shrink-0">
                  <span className="text-sm lotus-pulse select-none">🪷</span>
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
            </div>
            <div className="flex gap-3">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask a life question..."
                disabled={loading}
                className="flex-1 bg-saffron/5 border border-saffron/20 rounded-xl px-4 py-3 text-ink
                           placeholder:text-ink/30 focus:outline-none focus:border-saffron/60
                           transition-colors disabled:opacity-50 text-sm"
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
              Press Enter to send
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
