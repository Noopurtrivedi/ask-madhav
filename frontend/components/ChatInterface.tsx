'use client'

import { useState, useRef, useEffect } from 'react'
import { askQuestion } from '@/lib/api'
import type { ChatMessage, VerseCard } from '@/types'
import VerseCardComponent from './VerseCard'

function generateId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
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
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (question?: string) => {
    const q = (question || input).trim()
    if (!q || loading) return

    const userMsg: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: q,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const response = await askQuestion(q)
      const assistantMsg: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: response.answer,
        verses: response.verses,
        disclaimer: response.disclaimer,
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
            'Madhav is momentarily unavailable. Please ensure the backend server is running at localhost:8000 and try again.',
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
    <section id="chat" className="py-20 px-6" style={{ background: '#0A0F2E' }}>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <p className="text-saffron/70 text-xs tracking-[0.3em] uppercase mb-2">Gita Guidance</p>
          <h2
            className="text-4xl font-bold text-cream"
            style={{ fontFamily: 'Crimson Text, serif' }}
          >
            Ask Your Question
          </h2>
          <p className="text-cream/50 mt-3 text-sm">
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
              className="px-3 py-1.5 border border-saffron/20 text-cream/60 text-xs rounded-full
                         hover:border-saffron/50 hover:text-cream/90 transition-all disabled:opacity-40"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Chat window */}
        <div
          className="border border-saffron/20 rounded-2xl overflow-hidden"
          style={{ background: '#0D1225' }}
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
                      <div className="bg-white/5 rounded-2xl rounded-tl-sm px-4 py-3 text-cream/90 text-sm leading-relaxed">
                        {msg.content.split('\n\n').map((para, i) => (
                          <p key={i} className={i > 0 ? 'mt-3' : ''}>
                            {para}
                          </p>
                        ))}
                      </div>

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
                        <p className="text-cream/25 text-xs px-1 leading-relaxed">
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
                <div className="bg-white/5 rounded-2xl rounded-tl-sm px-4 py-3">
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
            <div className="flex gap-3">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask a life question..."
                disabled={loading}
                className="flex-1 bg-white/5 border border-saffron/20 rounded-xl px-4 py-3 text-cream
                           placeholder:text-cream/30 focus:outline-none focus:border-saffron/60
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
            <p className="text-cream/20 text-xs mt-2 text-center">
              Press Enter to send
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
