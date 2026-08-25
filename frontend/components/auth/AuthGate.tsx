'use client'

/**
 * AuthGate — the darshan's doorway.
 *
 * Every seeker signs in before the app reveals itself, choosing between two
 * equal paths on one screen:
 *   - One-time code: email → 6-digit code (the email's sign-in link works too)
 *   - Password:     classic register / sign in, with email confirmation and a
 *                   forgot-password recovery flow (code → new password)
 *
 * All emails (code, confirmation, recovery) are composed by /api/auth-email
 * and sent via Resend from madhav@askmadhav.world.
 *
 * Fail-open discipline (see AuthProvider): without Supabase env vars, or with
 * NEXT_PUBLIC_REQUIRE_SIGNIN=false, the gate is invisible and the app is open.
 */

import { useState } from 'react'
import { getBrowserClient } from '@/lib/supabase/client'
import { useAuth } from './AuthProvider'

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { configured, loading, user } = useAuth()

  // Launch kill-switch: lets features ship while email delivery is wired up.
  const required = process.env.NEXT_PUBLIC_REQUIRE_SIGNIN !== 'false'

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

type Mode = 'code' | 'password'
/** Password-mode sub-flow: normal → confirm email → reset code → new password. */
type PasswordStep = 'idle' | 'confirm' | 'reset-code' | 'new-password'

const inputCls =
  'w-full bg-saffron/5 border border-gold/22 rounded-xl px-4 py-3 text-moonlight ' +
  'placeholder:text-moonlight/38 focus:outline-none focus:border-saffron/60 text-sm'

function SignIn() {
  const supabase = getBrowserClient()
  const [mode, setMode] = useState<Mode>('code')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [sent, setSent] = useState(false) // code mode: email dispatched
  const [step, setStep] = useState<PasswordStep>('idle')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  const switchMode = (next: Mode) => {
    setMode(next)
    setMessage('')
    setCode('')
    setSent(false)
    setStep('idle')
  }

  const fail = (msg: string) => {
    setBusy(false)
    setMessage(msg)
  }

  // ── One-time code path ────────────────────────────────────────────────────

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
    if (error) return fail(error.message)
    setSent(true)
    setMessage('Sent from madhav@askmadhav.world — check your inbox (and spam, the first time). Enter the code, or tap the email’s sign-in link.')
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
    if (error) fail(error.message)
    // Success: AuthProvider's onAuthStateChange lifts the gate.
  }

  // ── Password path ─────────────────────────────────────────────────────────

  const signIn = async () => {
    if (!supabase || !email.trim() || !password || busy) return
    setBusy(true)
    setMessage('')
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    setBusy(false)
    if (!error) return
    if (/confirm/i.test(error.message)) {
      // Registered but never confirmed — resend the confirmation code.
      await supabase.auth.resend({ type: 'signup', email: email.trim() }).catch(() => {})
      setStep('confirm')
      setMessage('Your email isn’t confirmed yet. We’ve sent a fresh code — enter it below.')
      return
    }
    fail(error.message)
  }

  const signUp = async () => {
    if (!supabase || !email.trim() || busy) return
    if (password.length < 8) return fail('Choose a password of at least 8 characters.')
    setBusy(true)
    setMessage('')
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { emailRedirectTo: window.location.origin },
    })
    setBusy(false)
    if (error) return fail(error.message)
    if (data.session) return // confirmations disabled — signed in already
    setStep('confirm')
    setMessage('Almost there — we’ve emailed you a confirmation code from madhav@askmadhav.world.')
  }

  const confirmSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!supabase || !email.trim() || !code.trim() || busy) return
    setBusy(true)
    setMessage('')
    // 'email' covers signup confirmation codes on current GoTrue; fall back to
    // the legacy 'signup' type for completeness.
    let { error } = await supabase.auth.verifyOtp({ email: email.trim(), token: code.trim(), type: 'email' })
    if (error) {
      ;({ error } = await supabase.auth.verifyOtp({ email: email.trim(), token: code.trim(), type: 'signup' }))
    }
    setBusy(false)
    if (error) fail(error.message)
  }

  const forgotPassword = async () => {
    if (!supabase || busy) return
    if (!email.trim()) return fail('Enter your email first, then tap "Forgot password" again.')
    setBusy(true)
    setMessage('')
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: window.location.origin,
    })
    setBusy(false)
    if (error) return fail(error.message)
    setStep('reset-code')
    setCode('')
    setMessage('Recovery code sent. Enter it below, then choose a new password.')
  }

  const verifyReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!supabase || !email.trim() || !code.trim() || busy) return
    setBusy(true)
    setMessage('')
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: code.trim(),
      type: 'recovery',
    })
    setBusy(false)
    if (error) return fail(error.message)
    setStep('new-password')
    setPassword('')
    setMessage('Code accepted. Set your new password.')
  }

  const saveNewPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!supabase || busy) return
    if (password.length < 8) return fail('Choose a password of at least 8 characters.')
    setBusy(true)
    setMessage('')
    const { error } = await supabase.auth.updateUser({ password })
    setBusy(false)
    if (error) return fail(error.message)
    // The recovery session is already active — the gate lifts on its own.
  }

  return (
    <main className="darshan-page min-h-screen flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <span className="text-4xl select-none">🪷</span>
          <h1 className="mt-3 text-3xl font-bold text-moonlight" style={{ fontFamily: 'Crimson Text, serif' }}>
            Ask Madhav
          </h1>
          <p className="mt-3 text-moonlight/58 text-sm leading-relaxed max-w-sm mx-auto">
            Enter as Parth — your questions, journal, and saved verses stay yours alone.
          </p>
        </div>

        <div
          className="rounded-2xl border border-gold/22 p-6 backdrop-blur-md shadow-2xl shadow-black/40"
          style={{ background: 'rgba(255,255,255,0.05)' }}
        >
          {/* Mode tabs */}
          <div className="mb-5 grid grid-cols-2 gap-2 rounded-xl border border-gold/18 bg-white/[0.04] p-1">
            {(['code', 'password'] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => switchMode(m)}
                className={`rounded-lg px-4 py-2 text-sm transition-colors ${
                  mode === m ? 'bg-saffron text-navy font-medium' : 'text-moonlight/62 hover:text-gold-soft'
                }`}
              >
                {m === 'code' ? 'One-time code' : 'Password'}
              </button>
            ))}
          </div>

          <label className="block mb-3">
            <span className="text-gold-soft/65 text-xs uppercase tracking-wider">Email</span>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className={`mt-2 ${inputCls}`}
            />
          </label>

          {mode === 'code' && (
            <>
              <form onSubmit={sendCode}>
                <button
                  type="submit"
                  disabled={busy}
                  className="w-full px-6 py-3 bg-saffron text-navy font-medium rounded-xl hover:bg-saffron-light transition-all text-sm disabled:opacity-60"
                >
                  {busy && !sent ? 'Sending…' : sent ? 'Resend code' : 'Email me a sign-in code'}
                </button>
              </form>
              {sent && (
                <form onSubmit={verifyCode} className="mt-3 flex gap-3">
                  <input
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="One-time code"
                    className={`flex-1 ${inputCls}`}
                  />
                  <button
                    type="submit"
                    disabled={busy}
                    className="px-5 py-3 border border-gold/35 text-gold-soft rounded-xl hover:bg-gold-soft/[0.08] transition-colors text-sm disabled:opacity-60"
                  >
                    Enter
                  </button>
                </form>
              )}
            </>
          )}

          {mode === 'password' && step === 'idle' && (
            <>
              <label className="block mb-4">
                <span className="text-gold-soft/65 text-xs uppercase tracking-wider">Password</span>
                <input
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`mt-2 ${inputCls}`}
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={signIn}
                  disabled={busy}
                  className="px-6 py-3 bg-saffron text-navy font-medium rounded-xl hover:bg-saffron-light transition-all text-sm disabled:opacity-60"
                >
                  Sign in
                </button>
                <button
                  type="button"
                  onClick={signUp}
                  disabled={busy}
                  className="px-6 py-3 border border-gold/35 text-gold-soft rounded-xl hover:bg-gold-soft/[0.08] transition-colors text-sm disabled:opacity-60"
                >
                  Create account
                </button>
              </div>
              <button
                type="button"
                onClick={forgotPassword}
                disabled={busy}
                className="mt-4 text-moonlight/45 hover:text-gold-soft text-xs transition-colors"
              >
                Forgot password?
              </button>
            </>
          )}

          {mode === 'password' && step === 'confirm' && (
            <form onSubmit={confirmSignup} className="flex gap-3">
              <input
                inputMode="numeric"
                autoComplete="one-time-code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Confirmation code"
                className={`flex-1 ${inputCls}`}
              />
              <button
                type="submit"
                disabled={busy}
                className="px-5 py-3 bg-saffron text-navy font-medium rounded-xl hover:bg-saffron-light transition-all text-sm disabled:opacity-60"
              >
                Confirm
              </button>
            </form>
          )}

          {mode === 'password' && step === 'reset-code' && (
            <form onSubmit={verifyReset} className="flex gap-3">
              <input
                inputMode="numeric"
                autoComplete="one-time-code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Recovery code"
                className={`flex-1 ${inputCls}`}
              />
              <button
                type="submit"
                disabled={busy}
                className="px-5 py-3 bg-saffron text-navy font-medium rounded-xl hover:bg-saffron-light transition-all text-sm disabled:opacity-60"
              >
                Verify
              </button>
            </form>
          )}

          {mode === 'password' && step === 'new-password' && (
            <form onSubmit={saveNewPassword}>
              <label className="block mb-3">
                <span className="text-gold-soft/65 text-xs uppercase tracking-wider">New password</span>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className={`mt-2 ${inputCls}`}
                />
              </label>
              <button
                type="submit"
                disabled={busy}
                className="w-full px-6 py-3 bg-saffron text-navy font-medium rounded-xl hover:bg-saffron-light transition-all text-sm disabled:opacity-60"
              >
                Save password & enter
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
