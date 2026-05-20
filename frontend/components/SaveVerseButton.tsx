'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getBrowserClient, isSupabaseConfigured } from '@/lib/supabase/client'
import { saveVerse, removeVerse } from '@/lib/journal'

interface Props {
  reference: string
  englishMeaning: string
  themes?: string[]
}

/**
 * Bookmark a verse to the Sankalpa Journal. Hidden when Supabase isn't
 * configured. If signed out, routes to /journal to sign in first.
 */
export default function SaveVerseButton({ reference, englishMeaning, themes = [] }: Props) {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!isSupabaseConfigured()) return
    const supabase = getBrowserClient()
    if (!supabase) return
    supabase.auth.getUser().then(async ({ data }) => {
      const uid = data.user?.id ?? null
      setUserId(uid)
      if (uid) {
        const { data: rows } = await supabase
          .from('saved_verses')
          .select('reference')
          .eq('reference', reference)
          .limit(1)
        setSaved(Boolean(rows && rows.length))
      }
    })
  }, [reference])

  if (!isSupabaseConfigured()) return null

  const toggle = async () => {
    if (!userId) {
      router.push('/journal')
      return
    }
    setBusy(true)
    if (saved) {
      await removeVerse(reference)
      setSaved(false)
    } else {
      await saveVerse(userId, reference, englishMeaning, themes)
      setSaved(true)
    }
    setBusy(false)
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      aria-label={saved ? 'Remove from journal' : 'Save to journal'}
      title={userId ? (saved ? 'Saved — tap to remove' : 'Save to your journal') : 'Sign in to save'}
      className="text-ink/40 hover:text-saffron transition-colors text-xs flex items-center gap-1 disabled:opacity-50"
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
      </svg>
      {saved ? 'Saved' : 'Save'}
    </button>
  )
}
