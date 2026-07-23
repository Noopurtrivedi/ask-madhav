'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import type { User } from '@supabase/supabase-js'
import { getBrowserClient, isSupabaseConfigured } from '@/lib/supabase/client'
import {
  MOODS,
  fetchSavedVerses,
  fetchJournal,
  upsertTodayEntry,
  removeVerse,
  computeStreak,
  computeThemeInsights,
  type SavedVerse,
  type JournalEntry,
} from '@/lib/journal'

// Handoff key written by the chat's "Make this my intention" action.
const PENDING_INTENTION_KEY = 'askmadhav_pending_intention'

export default function JournalApp() {
  const configured = isSupabaseConfigured()
  const supabase = getBrowserClient()

  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [linkSent, setLinkSent] = useState(false)

  const [saved, setSaved] = useState<SavedVerse[]>([])
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [mood, setMood] = useState('')
  const [intention, setIntention] = useState('')
  const [reflection, setReflection] = useState('')
  const [savedToast, setSavedToast] = useState(false)

  // Track auth state.
  useEffect(() => {
    if (!supabase) {
      setAuthLoading(false)
      return
    }
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      setAuthLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
    })
    return () => sub.subscription.unsubscribe()
  }, [supabase])

  // Set when a seeker arrives from a chat answer via "Make this my intention".
  const [intentionFromChat, setIntentionFromChat] = useState(false)

  const loadData = useCallback(async () => {
    const [s, j] = await Promise.all([fetchSavedVerses(), fetchJournal()])
    setSaved(s)
    setEntries(j)
    const today = new Date().toISOString().slice(0, 10)
    const todayEntry = j.find((e) => e.entry_date === today)
    if (todayEntry) {
      setMood(todayEntry.mood || '')
      setIntention(todayEntry.intention || '')
      setReflection(todayEntry.reflection || '')
    }
    // A guidance step carried over from the chat takes precedence — it's what
    // the seeker just chose to commit to. Consume it once, then forget it.
    try {
      const pending = window.localStorage.getItem(PENDING_INTENTION_KEY)
      if (pending) {
        setIntention(pending)
        setIntentionFromChat(true)
        window.localStorage.removeItem(PENDING_INTENTION_KEY)
      }
    } catch {
      /* storage blocked — nothing to carry over */
    }
  }, [])

  useEffect(() => {
    if (user) loadData()
  }, [user, loadData])

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!supabase || !email.trim()) return
    await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/journal` },
    })
    setLinkSent(true)
  }

  const signOut = async () => {
    await supabase?.auth.signOut()
    setUser(null)
    setSaved([])
    setEntries([])
  }

  const saveEntry = async () => {
    if (!user) return
    const ok = await upsertTodayEntry(user.id, { mood, intention, reflection })
    if (ok) {
      setSavedToast(true)
      setTimeout(() => setSavedToast(false), 2000)
      loadData()
    }
  }

  const unsave = async (reference: string) => {
    await removeVerse(reference)
    setSaved((prev) => prev.filter((v) => v.reference !== reference))
  }

  // ── Not configured ──────────────────────────────────────────────────
  if (!configured) {
    return (
      <Shell>
        <p className="text-moonlight/65 text-center">
          The Sankalpa Journal is coming soon. (It activates once Supabase is configured.)
        </p>
        <div className="text-center mt-4">
          <Link href="/" className="text-gold-soft/75 hover:text-gold-soft text-sm">← Back home</Link>
        </div>
      </Shell>
    )
  }

  if (authLoading) {
    return (
      <Shell>
        <div className="flex justify-center py-10"><span className="text-4xl lotus-pulse">🪷</span></div>
      </Shell>
    )
  }

  // ── Signed out ──────────────────────────────────────────────────────
  if (!user) {
    return (
      <Shell>
        <h1 className="text-3xl font-bold text-moonlight text-center mb-2" style={{ fontFamily: 'Crimson Text, serif' }}>
          Your Sankalpa Journal
        </h1>
        <p className="text-moonlight/58 text-sm text-center mb-8 max-w-md mx-auto">
          Save verses, set a daily intention, and watch your reflection streak grow. Sign in with a
          magic link — no password.
        </p>
        {linkSent ? (
          <p className="text-gold-soft text-center">✦ Check your inbox for a sign-in link.</p>
        ) : (
          <form onSubmit={signIn} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="flex-1 bg-saffron/5 border border-gold/22 rounded-xl px-4 py-3 text-moonlight placeholder:text-moonlight/38 focus:outline-none focus:border-saffron/60 text-sm"
            />
            <button type="submit" className="px-6 py-3 bg-saffron text-navy font-medium rounded-xl hover:bg-saffron-light transition-all text-sm">
              Send magic link
            </button>
          </form>
        )}
        <div className="text-center mt-8">
          <Link href="/" className="text-gold-soft/75 hover:text-gold-soft text-sm">← Back home</Link>
        </div>
      </Shell>
    )
  }

  // ── Signed in ───────────────────────────────────────────────────────
  const streak = computeStreak(entries)
  const insights = computeThemeInsights(saved)

  return (
    <Shell wide>
      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-moonlight" style={{ fontFamily: 'Crimson Text, serif' }}>
            Namaste 🙏
          </h1>
          <p className="text-moonlight/48 text-sm">{user.email}</p>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/" className="text-gold-soft/75 hover:text-gold-soft text-sm">← Home</Link>
          <button onClick={signOut} className="text-moonlight/48 hover:text-moonlight/72 text-sm">Sign out</button>
        </div>
      </div>

      {/* Streak + insight */}
      <div className="grid sm:grid-cols-3 gap-4 mb-10">
        <Stat label="Reflection streak" value={`${streak} ${streak === 1 ? 'day' : 'days'}`} />
        <Stat label="Verses saved" value={String(saved.length)} />
        <Stat label="Journal entries" value={String(entries.length)} />
      </div>

      {insights.length > 0 && (
        <p className="text-moonlight/65 text-sm mb-10 border border-gold/18 rounded-xl p-4 bg-saffron/[0.04]">
          ✦ You keep returning to <span className="text-gold-soft capitalize">{insights[0].theme}</span>
          {insights[1] && <> and <span className="text-gold-soft capitalize">{insights[1].theme}</span></>}.
          The Gita has much more to say here — ask Madhav about it on the{' '}
          <Link href="/#chat" className="text-gold-soft underline">home page</Link>.
        </p>
      )}

      {/* Today's Sankalpa */}
      <section className="border border-gold/22 rounded-2xl p-6 mb-10" style={{ background: 'rgba(255,255,255,0.05)' }}>
        <h2 className="text-xl font-semibold text-moonlight mb-1" style={{ fontFamily: 'Crimson Text, serif' }}>
          Today&apos;s Sankalpa
        </h2>
        <p className="text-moonlight/48 text-xs mb-5">A sankalpa is a heartfelt intention. Set one for today.</p>

        {intentionFromChat && (
          <p className="text-gold-soft/85 text-xs border border-gold/22 bg-saffron/[0.05] rounded-lg px-3 py-2 mb-4">
            ✦ Carried over from your conversation with Madhav. Make it your own, then save.
          </p>
        )}

        <p className="text-gold-soft/65 text-xs uppercase tracking-wider mb-2">How is your heart?</p>
        <div className="flex flex-wrap gap-2 mb-5">
          {MOODS.map((m) => (
            <button
              key={m}
              onClick={() => setMood(m)}
              className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                mood === m ? 'border-saffron/60 text-gold-soft bg-saffron/10' : 'border-gold/22 text-moonlight/58 hover:border-gold/35'
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        <input
          value={intention}
          onChange={(e) => setIntention(e.target.value)}
          placeholder="My intention for today is…"
          className="w-full bg-saffron/5 border border-gold/22 rounded-xl px-4 py-3 text-moonlight placeholder:text-moonlight/38 focus:outline-none focus:border-saffron/60 text-sm mb-3"
        />
        <textarea
          value={reflection}
          onChange={(e) => setReflection(e.target.value)}
          placeholder="A short reflection… (optional)"
          rows={3}
          className="w-full bg-saffron/5 border border-gold/22 rounded-xl px-4 py-3 text-moonlight placeholder:text-moonlight/38 focus:outline-none focus:border-saffron/60 text-sm mb-4 resize-none"
        />
        <div className="flex items-center gap-3">
          <button onClick={saveEntry} className="px-6 py-2.5 bg-saffron text-navy font-medium rounded-xl hover:bg-saffron-light transition-all text-sm">
            Save today&apos;s Sankalpa
          </button>
          {savedToast && <span className="text-gold-soft text-sm">✓ Saved</span>}
        </div>
      </section>

      {/* Saved verses */}
      <section>
        <h2 className="text-xl font-semibold text-moonlight mb-4" style={{ fontFamily: 'Crimson Text, serif' }}>
          Saved Verses
        </h2>
        {saved.length === 0 ? (
          <p className="text-moonlight/48 text-sm">
            No saved verses yet. Tap the bookmark on any verse to keep it here.
          </p>
        ) : (
          <div className="space-y-3">
            {saved.map((v) => (
              <div key={v.id} className="border border-gold/18 rounded-xl p-4 flex items-start justify-between gap-4" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <div>
                  <Link href={`/verse/${v.reference}`} className="text-gold-soft text-sm font-medium hover:underline">
                    Bhagavad Gita {v.reference}
                  </Link>
                  <p className="text-moonlight/72 text-sm mt-1 leading-relaxed">{v.english_meaning}</p>
                </div>
                <button onClick={() => unsave(v.reference)} aria-label="Remove" className="text-moonlight/38 hover:text-gold-soft text-xs flex-shrink-0">
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </Shell>
  )
}

function Shell({ children, wide = false }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <main className="darshan-page min-h-screen px-6 py-24">
      <div className={wide ? 'max-w-3xl mx-auto' : 'max-w-xl mx-auto'}>{children}</div>
    </main>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-gold/18 rounded-xl p-5 text-center backdrop-blur-sm" style={{ background: 'rgba(255,255,255,0.05)' }}>
      <p className="text-3xl font-bold text-gold-soft" style={{ fontFamily: 'Crimson Text, serif' }}>{value}</p>
      <p className="text-moonlight/58 text-xs mt-1">{label}</p>
    </div>
  )
}
