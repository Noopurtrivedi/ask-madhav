'use client'

import { useState } from 'react'

/**
 * Daily Ritual — opt-in to receive the day's verse by email. Posts to
 * /api/subscribe. Degrades gracefully (shows a friendly message) when the
 * backend email/DB isn't configured.
 */
export default function SubscribeRitual() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || status === 'loading') return
    setStatus('loading')
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        setStatus('done')
        setMessage(data.message || 'You are subscribed. 🪷')
        setEmail('')
      } else {
        setStatus('error')
        setMessage(data.error || 'Could not subscribe right now.')
      }
    } catch {
      setStatus('error')
      setMessage('Could not subscribe right now. Please try again.')
    }
  }

  return (
    <section className="py-14 sm:py-20 px-6" style={{ background: '#FFFCF5' }}>
      <div className="max-w-2xl mx-auto text-center">
        <p className="text-saffron/70 text-xs tracking-[0.3em] uppercase mb-2">Daily Ritual</p>
        <h2 className="text-3xl md:text-4xl font-bold text-ink mb-3" style={{ fontFamily: 'Crimson Text, serif' }}>
          A verse in your inbox, every morning
        </h2>
        <p className="text-ink/50 text-sm mb-8 max-w-lg mx-auto">
          Begin each day with one verse from the Gita and a small practical step. No noise, just wisdom.
        </p>

        {status === 'done' ? (
          <p className="text-saffron text-lg">{message}</p>
        ) : (
          <form onSubmit={submit} className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="flex-1 bg-saffron/5 border border-saffron/20 rounded-xl px-4 py-3 text-ink
                         placeholder:text-ink/30 focus:outline-none focus:border-saffron/60 transition-colors text-sm"
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              className="px-6 py-3 bg-saffron text-navy font-medium rounded-xl hover:bg-saffron-light
                         transition-all disabled:opacity-40 text-sm whitespace-nowrap"
            >
              {status === 'loading' ? 'Subscribing…' : 'Subscribe'}
            </button>
          </form>
        )}

        {status === 'error' && <p className="text-ink/40 text-xs mt-3">{message}</p>}
      </div>
    </section>
  )
}
