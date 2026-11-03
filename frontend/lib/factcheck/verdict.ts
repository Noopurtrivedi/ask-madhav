/**
 * Signed verdicts. A passing check returns a token bound to the exact caption and
 * media URLs. publish.mjs asks /api/factcheck/verify before posting, so a post
 * can't go out unless this server approved that exact content.
 */
import { createHash, createHmac, timingSafeEqual } from 'node:crypto'

const TTL_MS = 6 * 60 * 60 * 1000

export function contentHash(caption: string, media: string[]): string {
  return createHash('sha256').update([caption.trim(), ...media].join('\n')).digest('hex')
}

function sign(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('base64url')
}

export function issueToken(hash: string, credibility: number, trend: number, secret: string): string {
  const payload = Buffer.from(JSON.stringify({ h: hash, c: credibility, t: trend, exp: Date.now() + TTL_MS })).toString('base64url')
  return `${payload}.${sign(payload, secret)}`
}

export function verifyToken(token: string, hash: string, secret: string): { ok: boolean; reason: string } {
  const [payload, sig] = token.split('.')
  if (!payload || !sig) return { ok: false, reason: 'Malformed token.' }
  const expected = Buffer.from(sign(payload, secret))
  const given = Buffer.from(sig)
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return { ok: false, reason: 'Bad signature.' }
  const data = JSON.parse(Buffer.from(payload, 'base64url').toString()) as { h: string; exp: number }
  if (data.exp < Date.now()) return { ok: false, reason: 'Verdict expired; check again.' }
  if (data.h !== hash) return { ok: false, reason: 'Caption or media changed after the check.' }
  return { ok: true, reason: 'Approved by the fact checker.' }
}

/** Constant-time bearer check against FACTCHECK_SECRET. */
export function authorised(header: string | null, secret: string): boolean {
  const given = Buffer.from((header ?? '').replace(/^Bearer\s+/i, ''))
  const expected = Buffer.from(secret)
  return given.length === expected.length && timingSafeEqual(given, expected)
}
