import { NextRequest, NextResponse } from 'next/server'
import { authorised, contentHash, verifyToken } from '@/lib/factcheck/verdict'

export const runtime = 'nodejs'

/**
 * POST /api/factcheck/verify: publish.mjs calls this right before posting with
 * the verdict token and the exact caption and media it is about to send.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.FACTCHECK_SECRET
  if (!secret) return NextResponse.json({ ok: false, reason: 'Fact checker is not configured.' }, { status: 503 })
  if (!authorised(req.headers.get('authorization'), secret)) {
    return NextResponse.json({ ok: false, reason: 'Unauthorised.' }, { status: 401 })
  }
  try {
    const { token, caption, media } = (await req.json()) as { token?: string; caption?: string; media?: string[] }
    if (!token || !Array.isArray(media)) return NextResponse.json({ ok: false, reason: 'Missing token or media.' }, { status: 400 })
    return NextResponse.json(verifyToken(token, contentHash(String(caption ?? ''), media), secret))
  } catch {
    return NextResponse.json({ ok: false, reason: 'Verification failed.' }, { status: 400 })
  }
}
