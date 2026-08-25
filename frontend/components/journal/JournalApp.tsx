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
  localISODate,
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

/** Field order + labels for the Past Reflections read-back view. */
const ENTRY_FIELDS: { key: keyof typeof DEFAULT_ENTRY; label: string }[] = [
  { key: 'intention', label: 'Sankalpa' },
  { key: 'gratitude', label: 'Gratitude' },
  { key: 'duty_today', label: 'My Dharma' },
  { key: 'attachment_to_release', label: 'Released' },
  { key: 'lesson_learned', label: 'Lesson' },
  { key: 'next_right_action', label: 'Next Right Action' },
  { key: 'reflection', label: 'Reflection' },
]

function formatDay(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

/**
 * JournalApp — the Sankalpa Journal.
 *
 * Sign-in is handled app-wide by AuthGate, so this component only has to BE
 * the journal: today's Gita check-in (upserted onto the seeker's LOCAL
 * calendar day), streaks, past reflections, and saved verses. Without
 * Supabase configured the whole feature stays gracefully inert.
 */
export default function JournalApp() {
  const { configured, user, signOut } = useAuth()

  const [saved, setSaved] = useState<SavedVerse[]>([])
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [form, setForm] = useState(DEFAULT_ENTRY)
  const [saving, setSaving] = useState(false)
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
    const today = localISODate()
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
    if (!user || saving) return
    setSaving(true)
    const ok = await upsertTodayEntry(user.id, form)
    setSaving(false)
    setSaveFailed(!ok)
    if (ok) {
      setIntentionFromChat(false)
      setSavedToast(true)
      setTimeout(() => setSavedToast(false), 2000)
      loadData()
    }
  }

  const unsave = async (reference: string) => {
    await removeVerse(reference)
    setSaved((prev) => prev.filter((v) => v.reference !== reference))
  }

  // Hand today's check-in to Madhav in the chat (sessionStorage prefill is the
  // cross-page idiom ChatInterface already consumes on mount).
  const askMadhavAboutToday = () => {
    const parts: string[] = []
    if (form.mood) parts.push(`my heart feels ${form.mood.toLowerCase()}`)
    if (form.intention) parts.push(`my sankalpa is "${form.intention}"`)
    if (form.duty_today) parts.push(`the duty in front of me is "${form.duty_today}"`)
    if (form.attachment_to_release) parts.push(`I am trying to release my grip on "${form.attachment_to_release}"`)
    const question = parts.length
      ? `Madhav, today ${parts.join('; ')}. Looking at my day through the Gita, what should I understand, and what one step should I take?`
      : 'Madhav, help me reflect on my day through the lens of the Gita — what should I ask myself tonight?'
    try {
      sessionStorage.setItem('madhav:prefill', question)
    } catch {
      /* storage blocked — the link still lands on the chat */
    }
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
  // session hydrates.
  if (!user) {
    return (
      <Shell>
        <div className="flex justify-center py-10"><span className="text-4xl lotus-pulse">ॐ</span></div>
      </Shell>
    )
  }

  const streak = computeStreak(entries)
  const insights = computeThemeInsights(saved)
  const today = localISODate()
  const pastEntries = entries.filter((e) => e.entry_date !== today)

  return (
    <Shell wide>
      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <div>
          <p className="text-gold-soft/70 text-xs uppercase tracking-[0.25em] mb-2">Daily Practice</p>
          <h1 className="text-3xl font-bold text-moonlight" style={{ fontFamily: 'Crimson Text, serif' }}>Sankalpa Journal</h1>
          <p className="text-moonlight/48 text-sm">{user.email}</p>
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
        <div className="flex items-baseline justify-between flex-wrap gap-2 mb-1">
          <h2 className="text-xl font-semibold text-moonlight" style={{ fontFamily: 'Crimson Text, serif' }}>Today&apos;s Gita Check-In</h2>
          <span className="text-moonlight/38 text-xs">{formatDay(today)}</span>
        </div>
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
              onClick={() => setField('mood', form.mood === m ? '' : m)}
              aria-pressed={form.mood === m}
              className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                form.mood === m ? 'border-saffron/60 text-gold-soft bg-saffron/10' : 'border-gold/22 text-moonlight/58 hover:border-gold/35'
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        <JournalInput label="Sankalpa" value={form.intention} onChange={(v) => setField('intention', v)} placeholder="Today, I choose to..." />
        <JournalInput label="Gratitude" value={form.gratitude} onChange={(v) => setField('gratitude', v)} placeholder="Three things I received, learned, or was protected by..." multiline />
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
          <button
            onClick={saveEntry}
            disabled={saving}
            className="px-6 py-2.5 bg-saffron text-navy font-medium rounded-xl hover:bg-saffron-light transition-all text-sm disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save today’s journal'}
          </button>
          <Link
            href="/#chat"
            onClick={askMadhavAboutToday}
            className="px-4 py-2.5 border border-gold/30 text-gold-soft rounded-xl hover:bg-gold-soft/[0.08] transition-colors text-sm"
          >
            Ask Madhav about today
          </Link>
          {savedToast && <span className="text-gold-soft text-sm">Saved ✓</span>}
          {saveFailed && (
            <span className="text-lotus text-sm">
              Could not save — check your connection and try again.
            </span>
          )}
        </div>
      </section>

      {pastEntries.length > 0 && (
        <section className="border border-gold/18 rounded-2xl p-6 mb-8" style={{ background: 'rgba(255,255,255,0.04)' }}>
          <h2 className="text-xl font-semibold text-moonlight mb-1" style={{ fontFamily: 'Crimson Text, serif' }}>Past Reflections</h2>
          <p className="text-moonlight/48 text-xs mb-4">Svadhyaya — read yourself back. Tap a day to reopen it.</p>
          <div className="space-y-2">
            {pastEntries.slice(0, 30).map((entry) => (
              <details key={entry.entry_date} className="group rounded-xl border border-gold/14 bg-white/[0.03] open:bg-white/[0.05] transition-colors">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3">
                  <span className="text-moonlight/82 text-sm font-medium">{formatDay(entry.entry_date)}</span>
                  <span className="flex items-center gap-2">
                    {entry.mood && (
                      <span className="rounded-full border border-gold/22 px-2 py-0.5 text-[11px] text-gold-soft/80">{entry.mood}</span>
                    )}
                    <span className="text-gold-soft/50 transition-transform group-open:rotate-180">▾</span>
                  </span>
                </summary>
                <div className="space-y-3 border-t border-gold/12 px-4 py-4">
                  {ENTRY_FIELDS.filter(({ key }) => entry[key]).map(({ key, label }) => (
                    <div key={key}>
                      <p className="text-gold-soft/65 text-[11px] uppercase tracking-wider mb-0.5">{label}</p>
                      <p className="text-moonlight/76 text-sm leading-relaxed whitespace-pre-wrap">{entry[key]}</p>
                    </div>
                  ))}
                  {ENTRY_FIELDS.every(({ key }) => !entry[key]) && (
                    <p className="text-moonlight/45 text-sm">A quiet day — only presence was recorded.</p>
                  )}
                </div>
              </details>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-xl font-semibold text-moonlight mb-4" style={{ fontFamily: 'Crimson Text, serif' }}>Saved Verses</h2>
        {saved.length === 0 ? (
          <p className="text-moonlight/48 text-sm">
            No saved verses yet. Tap <span className="text-gold-soft">Save</span> on the Daily Wisdom card, a popular
            verse, or any verse Madhav shares in the chat — they gather here.
          </p>
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
  multiline = false,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder: string
  multiline?: boolean
}) {
  const cls =
    'w-full bg-saffron/5 border border-gold/22 rounded-xl px-4 py-3 text-moonlight placeholder:text-moonlight/38 focus:outline-none focus:border-saffron/60 text-sm'
  return (
    <label className="block mb-4">
      <FieldLabel>{label}</FieldLabel>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={2}
          className={`${cls} resize-none`}
        />
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={cls} />
      )}
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
