import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { checkRateLimit } from '@/lib/ratelimit'

export const runtime = 'nodejs'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req: NextRequest) {
  // Throttle per IP — this writes to the DB and seeds the email list, so an
  // unbounded endpoint invites enumeration and quota-burn abuse.
  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'anon'
  if (!(await checkRateLimit(`subscribe:${ip}`))) {
    return NextResponse.json(
      { error: 'Too many attempts. Please pause a moment, then try again.' },
      { status: 429 },
    )
  }

  let body: { email?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const email = (body.email || '').trim().toLowerCase()
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 })
  }

  const supabase = getAdminClient()
  if (!supabase) {
    return NextResponse.json(
      { error: 'Daily Ritual is not configured yet. Please check back soon.' },
      { status: 503 },
    )
  }

  // Upsert so re-subscribing is idempotent and reactivates the address.
  const { error } = await supabase
    .from('ritual_subscribers')
    .upsert({ email, active: true }, { onConflict: 'email' })

  if (error) {
    console.error('subscribe error', error)
    return NextResponse.json({ error: 'Could not subscribe. Please try again.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, message: 'You are subscribed to the Daily Ritual. 🪷' })
}
