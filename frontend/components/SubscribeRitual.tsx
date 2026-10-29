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
    <section id="ritual" className="py-20 sm:py-28 px-6" >
      <div className="max-w-2xl mx-auto text-center">
        <p className="eyebrow mb-5">Daily Ritual</p>
        <h2 className="section-title mb-4" style={{ fontFamily: 'var(--font-display), serif' }}>
          A verse in your inbox, <em className="gold-leaf">every morning</em>
        </h2>
        <p className="section-lede mb-8 max-w-lg mx-auto">
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
              className="flex-1 bg-gold-soft/[0.07] border border-gold/22 rounded-xl px-4 py-3 text-moonlight
                         placeholder:text-moonlight/38 focus:outline-none focus:border-saffron/60 transition-colors text-sm"
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              className="px-6 py-3 btn-leaf rounded-xl
                         transition-all disabled:opacity-40 text-sm whitespace-nowrap"
            >
              {status === 'loading' ? 'Subscribing…' : 'Subscribe'}
            </button>
          </form>
        )}

        {status === 'error' && <p className="text-moonlight/48 text-xs mt-3">{message}</p>}
      </div>
    </section>
  )
}
