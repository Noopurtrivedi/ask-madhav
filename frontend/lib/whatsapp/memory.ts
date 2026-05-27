/**
 * Per-user conversation memory for the WhatsApp channel.
 *
 * WhatsApp delivers every message statelessly, so to let Madhav remember an
 * ongoing conversation we persist the last few turns (and the seeker's chosen
 * language) keyed by their phone number.
 *
 * Backed by Upstash Redis (already an optional integration in this app, free
 * tier, shared across serverless instances). FAIL-OPEN: if Redis is not
 * configured or a call errors, the channel simply runs stateless — each message
 * is answered on its own. It never takes down the webhook.
 *
 * NOTE (roadmap): when traffic grows we will migrate this store to Supabase
 * Postgres for durable, queryable conversation history. See WHATSAPP_SETUP.md.
 */
import { Redis } from '@upstash/redis'
import type { ChatTurn } from '@/lib/guidance'
import type { AnswerLanguage } from '@/types'

export interface WhatsAppSession {
  turns: ChatTurn[]
  language: AnswerLanguage
}

// How much context to keep, and for how long.
const MAX_TURNS = 12 // 6 exchanges
const SESSION_TTL_SECONDS = 60 * 60 * 24 // 24h of inactivity
const DEDUP_TTL_SECONDS = 60 * 60 * 6 // remember processed message ids for 6h

let redis: Redis | null = null
const url = process.env.UPSTASH_REDIS_REST_URL
const token = process.env.UPSTASH_REDIS_REST_TOKEN
if (url && token) {
  redis = new Redis({ url, token })
}

export function isMemoryEnabled(): boolean {
  return redis !== null
}

const sessionKey = (from: string) => `askmadhav:wa:session:${from}`
const dedupKey = (messageId: string) => `askmadhav:wa:msg:${messageId}`

/** Load a seeker's session, or a fresh empty one. Never throws. */
export async function getSession(from: string): Promise<WhatsAppSession> {
  const empty: WhatsAppSession = { turns: [], language: 'english' }
  if (!redis) return empty
  try {
    const raw = await redis.get<WhatsAppSession>(sessionKey(from))
    if (raw && Array.isArray(raw.turns)) {
      return { turns: raw.turns.slice(-MAX_TURNS), language: raw.language || 'english' }
    }
  } catch (err) {
    console.error('whatsapp getSession error', err)
  }
  return empty
}

/** Persist the updated session (trimmed to the last MAX_TURNS). Never throws. */
export async function saveSession(from: string, session: WhatsAppSession): Promise<void> {
  if (!redis) return
  try {
    const trimmed: WhatsAppSession = {
      turns: session.turns.slice(-MAX_TURNS),
      language: session.language,
    }
    await redis.set(sessionKey(from), trimmed, { ex: SESSION_TTL_SECONDS })
  } catch (err) {
    console.error('whatsapp saveSession error', err)
  }
}

/**
 * Idempotency guard. WhatsApp re-delivers a webhook if we don't 200 quickly,
 * which would otherwise make Madhav reply twice. Returns true the FIRST time a
 * message id is seen, false on any repeat. Fails open (treats as new) so a
 * Redis outage never silently drops real messages.
 */
export async function markMessageSeen(messageId: string): Promise<boolean> {
  if (!redis) return true
  try {
    // NX = set only if absent; returns null when the key already existed.
    const res = await redis.set(dedupKey(messageId), '1', {
      nx: true,
      ex: DEDUP_TTL_SECONDS,
    })
    return res === 'OK'
  } catch (err) {
    console.error('whatsapp markMessageSeen error', err)
    return true
  }
}
