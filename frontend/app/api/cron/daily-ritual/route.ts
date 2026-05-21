import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { sendDailyVerse, isEmailEnabled } from '@/lib/email'
import { dailyVerse } from '@/lib/verseEngine'

export const runtime = 'nodejs'
export const maxDuration = 60

/**
 * Sends the day's verse to all active subscribers. Triggered by a Vercel Cron
 * job (see vercel.json). Protected by CRON_SECRET — Vercel Cron sends it as a
 * Bearer token automatically when the env var is set.
 */
export async function GET(req: NextRequest) {
  // Require CRON_SECRET so the send endpoint can never be triggered
  // unguarded (which would let anyone spam subscribers / burn email quota).
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return NextResponse.json(
      { error: 'Daily Ritual requires CRON_SECRET to be configured.' },
      { status: 503 },
    )
  }
  if (req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getAdminClient()
  if (!supabase || !isEmailEnabled()) {
    return NextResponse.json(
      { error: 'Daily Ritual requires Supabase + Resend to be configured.' },
      { status: 503 },
    )
  }

  const { data: subscribers, error } = await supabase
    .from('ritual_subscribers')
    .select('email')
    .eq('active', true)

  if (error) {
    console.error('cron read error', error)
    return NextResponse.json({ error: 'Could not load subscribers.' }, { status: 500 })
  }

  const verse = dailyVerse()
  const site = process.env.NEXT_PUBLIC_SITE_URL || ''
  let sent = 0

  for (const sub of subscribers || []) {
    const unsubscribeUrl = `${site}/api/unsubscribe?email=${encodeURIComponent(sub.email)}`
    if (await sendDailyVerse(sub.email, verse, unsubscribeUrl)) sent++
  }

  return NextResponse.json({ ok: true, verse: verse.reference, recipients: subscribers?.length || 0, sent })
}
