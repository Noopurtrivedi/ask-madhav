/**
 * Rate limiting for cost-sensitive endpoints (the LLM-backed /api/ask).
 *
 * Two layers, both free:
 *  1. Upstash Redis (free tier, no card) — used when UPSTASH_REDIS_REST_URL /
 *     UPSTASH_REDIS_REST_TOKEN are set. Reliable across all serverless instances.
 *  2. In-memory best-effort fallback — runs with zero setup. Limited because
 *     serverless instances don't share memory, but still throttles a single
 *     hot instance and costs nothing.
 */
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const WINDOW_MS = 60_000
const MAX_PER_WINDOW = 20

let upstash: Ratelimit | null = null
const url = process.env.UPSTASH_REDIS_REST_URL
const token = process.env.UPSTASH_REDIS_REST_TOKEN
if (url && token) {
  upstash = new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(MAX_PER_WINDOW, '60 s'),
    prefix: 'askmadhav:ask',
    analytics: false,
  })
}

// In-memory sliding window (per-instance fallback).
const hits = new Map<string, number[]>()
function memoryLimit(key: string): boolean {
  const now = Date.now()
  const recent = (hits.get(key) || []).filter((t) => now - t < WINDOW_MS)
  recent.push(now)
  hits.set(key, recent)
  if (hits.size > 5000) hits.clear() // crude cleanup to bound memory
  return recent.length <= MAX_PER_WINDOW
}

/** Returns true if the request is allowed, false if the limit is exceeded. */
export async function checkRateLimit(key: string): Promise<boolean> {
  try {
    if (upstash) {
      const { success } = await upstash.limit(key)
      return success
    }
  } catch (err) {
    // Never let the limiter take down the endpoint — fail open to the memory layer.
    console.error('upstash ratelimit error', err)
  }
  return memoryLimit(key)
}
