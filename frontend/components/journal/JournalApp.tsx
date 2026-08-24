'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useAuth } from '@/components/auth/AuthProvider'
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

const PENDING_INTENTION_KEY = 'askmadhav_pending_intention'

const PRACTICE_PROMPTS = [
  { title: 'Svadharma', text: 'What is mine to do today, even if it is small, imperfect, or unseen?' },
  { title: 'Karma Yoga', text: 'Which result am I gripping too tightly, and how can I offer the action without clinging?' },
  { title: 'Samatvam', text: 'Where did praise, blame, success, or failure disturb my steadiness?' },
  { title: 'Ahankara', text: 'Where did ego want control, credit, or the final word?' },
]

const DEFAULT_ENTRY = {
  mood: '',
  intention: '',
  reflection: '',
  gratitude: '',
  attachment_to_release: '',
  duty_today: '',
  lesson_learned: '',
  next_right_action: '',
}

/**
 * JournalApp — the Sankalpa Journal.
 *
 * Sign-in is handled app-wide by AuthGate (email one-time code), so by the
 * time this renders the seeker is already signed in — the component only has
 * to be the journal. Without Supabase configured the whole feature stays
 * gracefully inert.
 */
export default function JournalApp() {
  const { configured, user, signOut } = useAuth()

  const [saved, setSaved] = useState<SavedVerse[]>([])
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [form, setForm] = useState(DEFAULT_ENTRY)
  const [savedToast, setSavedToast] = useState(false)
  const [saveFailed, setSaveFailed] = useState(false)
  const [intentionFromChat, setIntentionFromChat] = useState(false)

  const setField = (field: keyof typeof DEFAULT_ENTRY, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const loadData = useCallback(async () => {
    const [s, j] = await Promise.all([fetchSavedVerses(), fetchJournal()])
    setSaved(s)
    setEntries(j)
    const today = new Date().toISOString().slice(0, 10)
    const todayEntry = j.find((e) => e.entry_date === today)
    if (todayEntry) {
      setForm({
        mood: todayEntry.mood || '',
        intention: todayEntry.intention || '',
        reflection: todayEntry.reflection || '',
        gratitude: todayEntry.gratitude || '',
        attachment_to_release: todayEntry.attachment_to_release || '',
        duty_today: todayEntry.duty_today || '',
        lesson_learned: todayEntry.lesson_learned || '',
        next_right_action: todayEntry.next_right_action || '',
      })
    }
    try {
      const pending = window.localStorage.getItem(PENDING_INTENTION_KEY)
      if (pending) {
        setForm((prev) => ({ ...prev, intention: pending }))
        setIntentionFromChat(true)
        window.localStorage.removeItem(PENDING_INTENTION_KEY)
      }
    } catch {
      /* storage blocked */
    }
  }, [])

  useEffect(() => {
    if (user) loadData()
  }, [user, loadData])

  const saveEntry = async () => {
    if (!user) return
    const ok = await upsertTodayEntry(user.id, form)
    setSaveFailed(!ok)
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

  if (!configured) {
    return (
      <Shell>
        <p className="text-moonlight/65 text-center">The Sankalpa Journal activates once Supabase is configured.</p>
        <div className="text-center mt-4">
          <Link href="/" className="text-gold-soft/75 hover:text-gold-soft text-sm">Back home</Link>
        </div>
      </Shell>
    )
  }

  // AuthGate normally guarantees a user; this is only a quiet hold while the
  // session hydrates (or if the component is ever rendered outside the gate).
  if (!user) {
    return (
      <Shell>
        <div className="flex justify-center py-10"><span className="text-4xl lotus-pulse">ॐ</span></div>
      </Shell>
    )
  }

  const streak = computeStreak(entries)
  const insights = computeThemeInsights(saved)

  return (
    <Shell wide>
      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <div>
          <p className="text-gold-soft/70 text-xs uppercase tracking-[0.25em] mb-2">The Moat</p>
          <h1 className="text-3xl font-bold text-moonlight" style={{ fontFamily: 'Crimson Text, serif' }}>The Final Journal</h1>
          <p className="text-moonlight/48 text-sm">{user.email || user.phone}</p>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/" className="text-gold-soft/75 hover:text-gold-soft text-sm">Home</Link>
          <button onClick={signOut} className="text-moonlight/48 hover:text-moonlight/72 text-sm">Sign out</button>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <Stat label="Reflection streak" value={`${streak} ${streak === 1 ? 'day' : 'days'}`} />
        <Stat label="Verses saved" value={String(saved.length)} />
        <Stat label="Journal entries" value={String(entries.length)} />
      </div>

      {insights.length > 0 && (
        <p className="text-moonlight/65 text-sm mb-8 border border-gold/18 rounded-xl p-4 bg-saffron/[0.04]">
          You keep returning to <span className="text-gold-soft capitalize">{insights[0].theme}</span>
          {insights[1] && <> and <span className="text-gold-soft capitalize">{insights[1].theme}</span></>}.
          Let today&apos;s entry turn that theme into one clear action.
        </p>
      )}

      <section className="border border-gold/22 rounded-2xl p-6 mb-8" style={{ background: 'rgba(255,255,255,0.05)' }}>
        <h2 className="text-xl font-semibold text-moonlight mb-1" style={{ fontFamily: 'Crimson Text, serif' }}>Today&apos;s Gita Check-In</h2>
        <p className="text-moonlight/48 text-xs mb-5">A simple inward practice: see clearly, offer the action, release the fruit.</p>

        {intentionFromChat && (
          <p className="text-gold-soft/85 text-xs border border-gold/22 bg-saffron/[0.05] rounded-lg px-3 py-2 mb-4">
            Carried over from your conversation with Madhav. Make it your own, then save.
          </p>
        )}

        <FieldLabel>How is your heart?</FieldLabel>
        <div className="flex flex-wrap gap-2 mb-5">
          {MOODS.map((m) => (
            <button
              key={m}
              onClick={() => setField('mood', m)}
              className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                form.mood === m ? 'border-saffron/60 text-gold-soft bg-saffron/10' : 'border-gold/22 text-moonlight/58 hover:border-gold/35'
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        <JournalInput label="Sankalpa" value={form.intention} onChange={(v) => setField('intention', v)} placeholder="Today, I choose to..." />
        <JournalInput label="Gratitude" value={form.gratitude} onChange={(v) => setField('gratitude', v)} placeholder="Three things I received, learned, or was protected by..." />
        <JournalInput label="My Dharma Today" value={form.duty_today} onChange={(v) => setField('duty_today', v)} placeholder="The responsibility in front of me is..." />
        <JournalInput label="Attachment to Release" value={form.attachment_to_release} onChange={(v) => setField('attachment_to_release', v)} placeholder="I will act, but I release my grip on..." />
        <JournalInput label="Lesson Learned" value={form.lesson_learned} onChange={(v) => setField('lesson_learned', v)} placeholder="Today taught me..." />
        <JournalInput label="Next Right Action" value={form.next_right_action} onChange={(v) => setField('next_right_action', v)} placeholder="The next right action is..." />

        <label className="block mb-4">
          <FieldLabel>Reflection</FieldLabel>
          <textarea
            value={form.reflection}
            onChange={(e) => setField('reflection', e.target.value)}
            placeholder="Where did I act from steadiness? Where did I forget?"
            rows={4}
            className="w-full bg-saffron/5 border border-gold/22 rounded-xl px-4 py-3 text-moonlight placeholder:text-moonlight/38 focus:outline-none focus:border-saffron/60 text-sm resize-none"
          />
        </label>

        <div className="grid gap-3 md:grid-cols-2 mb-5">
          {PRACTICE_PROMPTS.map((prompt) => (
            <div key={prompt.title} className="rounded-xl border border-gold/14 bg-white/[0.035] p-4">
              <p className="text-gold-soft/75 text-xs uppercase tracking-[0.15em]">{prompt.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-moonlight/68">{prompt.text}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={saveEntry} className="px-6 py-2.5 bg-saffron text-navy font-medium rounded-xl hover:bg-saffron-light transition-all text-sm">Save today&apos;s journal</button>
          <Link href="/#chat" className="px-4 py-2.5 border border-gold/30 text-gold-soft rounded-xl hover:bg-gold-soft/[0.08] transition-colors text-sm">Ask Madhav about today</Link>
          {savedToast && <span className="text-gold-soft text-sm">Saved</span>}
          {saveFailed && (
            <span className="text-lotus text-sm">
              Could not save — if this persists, the journal tables may need the schema update.
            </span>
          )}
        </div>
      </section>

      <section className="border border-gold/18 rounded-2xl p-6 mb-8" style={{ background: 'rgba(255,255,255,0.04)' }}>
        <h2 className="text-xl font-semibold text-moonlight mb-3" style={{ fontFamily: 'Crimson Text, serif' }}>Donation Vision</h2>
        <p className="text-moonlight/62 text-sm leading-relaxed">
          Keep the wisdom free. Let donations support translations, audio, story narration, and tools that bring the Bhagavad Gita to seekers in simple language.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-moonlight mb-4" style={{ fontFamily: 'Crimson Text, serif' }}>Saved Verses</h2>
        {saved.length === 0 ? (
          <p className="text-moonlight/48 text-sm">No saved verses yet. Tap the bookmark on any verse to keep it here.</p>
        ) : (
          <div className="space-y-3">
            {saved.map((v) => (
              <div key={v.id} className="border border-gold/18 rounded-xl p-4 flex items-start justify-between gap-4" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <div>
                  <Link href={`/verse/${v.reference}`} className="text-gold-soft text-sm font-medium hover:underline">Bhagavad Gita {v.reference}</Link>
                  <p className="text-moonlight/72 text-sm mt-1 leading-relaxed">{v.english_meaning}</p>
                </div>
                <button onClick={() => unsave(v.reference)} aria-label="Remove" className="text-moonlight/38 hover:text-gold-soft text-xs flex-shrink-0">Remove</button>
              </div>
            ))}
          </div>
        )}
      </section>

      <p className="mt-10 text-moonlight/35 text-xs leading-relaxed">
        Ask Madhav offers reflection from the Bhagavad Gita perspective only. It is not professional coaching, therapy, legal, medical, or financial advice.
      </p>
    </Shell>
  )
}

function Shell({ children, wide = false }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <main className="darshan-page min-h-screen px-6 py-24">
      <div className={wide ? 'max-w-4xl mx-auto' : 'max-w-xl mx-auto'}>{children}</div>
    </main>
  )
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-gold-soft/65 text-xs uppercase tracking-wider mb-2">{children}</p>
}

function JournalInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder: string
}) {
  return (
    <label className="block mb-4">
      <FieldLabel>{label}</FieldLabel>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-saffron/5 border border-gold/22 rounded-xl px-4 py-3 text-moonlight placeholder:text-moonlight/38 focus:outline-none focus:border-saffron/60 text-sm"
      />
    </label>
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
