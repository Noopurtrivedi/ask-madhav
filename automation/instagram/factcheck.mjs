#!/usr/bin/env node
/**
 * Sends a draft to the independent fact checker at askmadhav.world.
 *
 *   NODE_USE_ENV_PROXY=1 node factcheck.mjs draft.json [--attempt N]
 *
 * draft.json: { post: { kind, caption, media, onImageText, verses, dates? }, history }
 * media must be exactly what publish.mjs will send: carousel URLs, or the reel then
 * its cover, or the story. Prints the decision and scores, writes verdict.json,
 * and exits 0 only for "publish". The bearer secret is a cloud network secret.
 */
import { readFileSync, writeFileSync } from 'node:fs'

const URL_ = 'https://www.askmadhav.world/api/factcheck'

const [draftPath, flag, n] = process.argv.slice(2)
if (!draftPath) {
  console.error('Usage: node factcheck.mjs draft.json [--attempt N]')
  process.exit(2)
}
const draft = JSON.parse(readFileSync(draftPath, 'utf8'))
const attempt = flag === '--attempt' ? Number(n) || 1 : 1

const res = await fetch(URL_, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', ...(process.env.FACTCHECK_SECRET ? { Authorization: `Bearer ${process.env.FACTCHECK_SECRET}` } : {}) },
  body: JSON.stringify({ ...draft, attempt, today: new Date().toISOString().slice(0, 10) }),
}).catch((err) => ({ ok: false, status: 0, json: async () => ({ decision: 'block', reason: err.message }) }))
const out = await res.json().catch(() => ({ decision: 'block', reason: `HTTP ${res.status}` }))
writeFileSync('verdict.json', JSON.stringify(out, null, 2))

console.log(`Decision: ${out.decision} (attempt ${out.attempt ?? attempt})`)
if (out.reason) console.log(`Reason: ${out.reason}`)
if (out.credibility) console.log(`Credibility ${out.credibility.score}/100, trend ${out.trend.score}/100, pass mark ${out.passMark}`)
for (const c of (out.hard ?? []).filter((c) => !c.pass)) console.log(`HARD FAIL: ${c.check}: ${c.detail}`)
for (const f of out.fixes ?? []) console.log(`FIX: ${f}`)
if (out.decision === 'publish') console.log('Verdict token saved in verdict.json as "verdict".')
process.exit(out.decision === 'publish' ? 0 : 1)
