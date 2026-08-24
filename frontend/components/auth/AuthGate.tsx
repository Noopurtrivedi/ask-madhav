'use client'

/**
 * AuthGate — the darshan's doorway.
 *
 * Every seeker signs in with their email (a one-time code, or the sign-in link
 * in the same email) before the app reveals itself. The gate wraps all routes
 * via app/layout.tsx and follows the app's fail-open discipline:
 *
 *  - Supabase not configured → the gate is invisible and the app runs open
 *    (zero-env dev keeps working; nothing hard-depends on auth).
 *  - While the stored session is being read → a quiet cosmic hold screen, so
 *    signed-in seekers never see a sign-in flash.
 *  - Signed in → children render, and the Hero's launch ritual plays as usual
 *    (it mounts only now, so the chakra flight is never wasted behind a gate).
 *
 * Phone/2FA was deliberately left out — email OTP is the single entry path.
 */

import { useState } from 'react'
import { getBrowserClient } from '@/lib/supabase/client'
import { useAuth } from './AuthProvider'

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { configured, loading, user } = useAuth()

  // Launch kill-switch: with NEXT_PUBLIC_REQUIRE_SIGNIN=false the gate stays
  // dormant even though Supabase is configured — used to ship features while
  // the sign-in email delivery (auth-email hook) is still being wired up.
  const required = process.env.NEXT_PUBLIC_REQUIRE_SIGNIN !== 'false'

  // No Supabase (or gate disabled) → open app.
  if (!configured || !required) return <>{children}</>

  if (loading) {
    return (
      <div className="darshan-page fixed inset-0 z-[60] flex items-center justify-center">
        <span className="text-4xl text-gold-soft/80 lotus-pulse select-none" aria-hidden="true">ॐ</span>
        <span className="sr-only">Opening the darshan…</span>
      </div>
    )
  }

  if (!user) return <SignIn />

  return <>{children}</>
}

function SignIn() {
  const supabase = getBrowserClient()
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  const sendCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!supabase || !email.trim() || busy) return
    setBusy(true)
    setMessage('')
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin },
    })
    setBusy(false)
    if (error) {
      setMessage(error.message)
      return
    }
    setSent(true)
    setMessage('Sent. Open the email and tap its sign-in link — or enter the one-time code if your email shows one.')
  }

  const verifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!supabase || !email.trim() || !code.trim() || busy) return
    setBusy(true)
    setMessage('')
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: code.trim(),
      type: 'email',
    })
    setBusy(false)
    if (error) setMessage(error.message)
    // Success needs no handling — AuthProvider's onAuthStateChange lifts the gate.
  }

  return (
    <main className="darshan-page min-h-screen flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <span className="text-4xl select-none">🪷</span>
          <h1
            className="mt-3 text-3xl font-bold text-moonlight"
            style={{ fontFamily: 'Crimson Text, serif' }}
          >
            Ask Madhav
          </h1>
          <p className="mt-3 text-moonlight/58 text-sm leading-relaxed max-w-sm mx-auto">
            Enter as Parth. One email, one code — your questions, journal, and
            saved verses stay yours alone.
          </p>
        </div>

        <div
          className="rounded-2xl border border-gold/22 p-6 backdrop-blur-md shadow-2xl shadow-black/40"
          style={{ background: 'rgba(255,255,255,0.05)' }}
        >
          <form onSubmit={sendCode} className="space-y-3">
            <label className="block">
              <span className="text-gold-soft/65 text-xs uppercase tracking-wider">Email</span>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-2 w-full bg-saffron/5 border border-gold/22 rounded-xl px-4 py-3 text-moonlight
                           placeholder:text-moonlight/38 focus:outline-none focus:border-saffron/60 text-sm"
              />
            </label>
            <button
              type="submit"
              disabled={busy}
              className="w-full px-6 py-3 bg-saffron text-navy font-medium rounded-xl hover:bg-saffron-light
                         transition-all text-sm disabled:opacity-60"
            >
              {busy && !sent ? 'Sending…' : sent ? 'Resend code' : 'Send sign-in code'}
            </button>
          </form>

          {sent && (
            <form onSubmit={verifyCode} className="mt-4 flex gap-3">
              <input
                inputMode="numeric"
                autoComplete="one-time-code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="One-time code"
                className="flex-1 bg-saffron/5 border border-gold/22 rounded-xl px-4 py-3 text-moonlight
                           placeholder:text-moonlight/38 focus:outline-none focus:border-saffron/60 text-sm"
              />
              <button
                type="submit"
                disabled={busy}
                className="px-5 py-3 border border-gold/35 text-gold-soft rounded-xl hover:bg-gold-soft/[0.08]
                           transition-colors text-sm disabled:opacity-60"
              >
                Enter
              </button>
            </form>
          )}

          {message && <p className="mt-4 text-center text-sm text-gold-soft/85">{message}</p>}
        </div>

        <p className="mt-8 text-moonlight/35 text-xs text-center leading-relaxed max-w-sm mx-auto">
          Everything here is free. Guidance is offered through the lens of the
          Bhagavad Gita only — not professional, medical, legal, or financial advice.
        </p>
      </div>
    </main>
  )
}
