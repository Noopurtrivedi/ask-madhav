#!/usr/bin/env node
/**
 * Publishes one Instagram post through the Instagram API with Instagram Login.
 *
 *   node publish.mjs --urls <jpg,jpg,...> --caption-file caption.txt [--dry-run]
 *
 * One URL makes a single image post; two or more make a carousel. Media must be
 * public JPEG URLs, because Meta fetches them itself.
 *
 * The token is a network secret on graph.instagram.com and graph.facebook.com, so
 * in a cloud session the proxy adds it and this script never sees it. IG_ACCESS_TOKEN is only for a
 * manual run on a trusted machine, and must never be committed.
 *
 * Guards: refuses any account but EXPECTED_USERNAME, and refuses to post within
 * MIN_GAP_HOURS of the last post, because the user wants at most one a day.
 */
import { readFileSync } from 'node:fs'

// Unified login tokens may belong to either host, so run() finds the one that works.
const HOSTS = ['https://graph.instagram.com/v23.0', 'https://graph.facebook.com/v23.0']
const EXPECTED_USERNAME = 'askmadhav_world'
const IG_ID = '17841435472946983'
const MIN_GAP_HOURS = 20
const MAX_CAPTION = 2200
const POLL_MS = 15_000
const POLL_TRIES = 20 // Meta asks for no more than about 5 minutes of polling.

function args(argv) {
  const out = {}
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--dry-run') out.dryRun = true
    else if (a === '--urls') out.urls = argv[++i]
    else if (a === '--caption-file') out.captionFile = argv[++i]
    else throw new Error(`Unknown argument: ${a}`)
  }
  return out
}

function headers() {
  const token = process.env.IG_ACCESS_TOKEN
  return token ? { Authorization: `Bearer ${token}` } : {}
}

let api = HOSTS[0]

async function call(method, path, params) {
  const url = new URL(`${api}${path}`)
  const init = { method, headers: headers() }
  if (method === 'GET') {
    for (const [k, v] of Object.entries(params ?? {})) url.searchParams.set(k, v)
  } else {
    init.body = new URLSearchParams(params)
  }
  const res = await fetch(url, init)
  const body = await res.json().catch(() => ({}))
  if (!res.ok || body.error) {
    throw new Error(`${method} ${path} failed (${res.status}): ${body.error?.message ?? 'no detail'}`)
  }
  return body
}

async function assertPublicJpeg(url) {
  if (!/^https:\/\//.test(url)) throw new Error(`Not an https URL: ${url}`)
  const res = await fetch(url, { method: 'HEAD' })
  const type = res.headers.get('content-type') ?? ''
  if (!res.ok || !/image\/jpe?g/.test(type)) {
    throw new Error(`Meta can't use ${url}: status ${res.status}, type "${type}"`)
  }
}

async function waitUntilReady(id) {
  for (let i = 0; i < POLL_TRIES; i++) {
    const { status_code: status } = await call('GET', `/${id}`, { fields: 'status_code' })
    if (status === 'FINISHED') return
    if (status === 'ERROR' || status === 'EXPIRED') throw new Error(`Container ${id} is ${status}`)
    await new Promise((r) => setTimeout(r, POLL_MS))
  }
  throw new Error(`Container ${id} wasn't ready in time`)
}

async function main() {
  const opts = args(process.argv.slice(2))
  const urls = (opts.urls ?? '').split(',').map((u) => u.trim()).filter(Boolean)
  if (urls.length < 1 || urls.length > 20) throw new Error('Pass 1 to 20 URLs with --urls')
  if (!opts.captionFile) throw new Error('Pass --caption-file')
  const caption = readFileSync(opts.captionFile, 'utf8').trim()
  if (!caption || caption.length > MAX_CAPTION) throw new Error('Caption is empty or too long')

  await Promise.all(urls.map(assertPublicJpeg))

  let me
  let lastError
  for (const host of HOSTS) {
    api = host
    try {
      me = await call('GET', `/${IG_ID}`, { fields: 'username' })
      break
    } catch (err) {
      lastError = err
    }
  }
  if (!me) throw lastError
  if (me.username !== EXPECTED_USERNAME) {
    throw new Error(`Connected to @${me.username}, expected @${EXPECTED_USERNAME}`)
  }

  const latest = await call('GET', `/${IG_ID}/media`, { fields: 'timestamp', limit: '1' })
  const last = latest.data?.[0]?.timestamp
  if (last) {
    const hours = (Date.now() - new Date(last).getTime()) / 3_600_000
    if (hours < MIN_GAP_HOURS) {
      throw new Error(`Last post was ${hours.toFixed(1)}h ago, under the ${MIN_GAP_HOURS}h gap`)
    }
  }

  if (opts.dryRun) {
    console.log(`Dry run OK: @${me.username}, ${urls.length} image(s), caption ${caption.length} chars`)
    return
  }

  let creationId
  if (urls.length === 1) {
    const c = await call('POST', `/${IG_ID}/media`, {
      image_url: urls[0],
      caption,
      is_ai_generated: 'true',
    })
    creationId = c.id
  } else {
    const children = []
    for (const image_url of urls) {
      // The AI flag goes on the carousel only; Meta errors if a child has it.
      const c = await call('POST', `/${IG_ID}/media`, { image_url, is_carousel_item: 'true' })
      await waitUntilReady(c.id)
      children.push(c.id)
    }
    const c = await call('POST', `/${IG_ID}/media`, {
      media_type: 'CAROUSEL',
      children: children.join(','),
      caption,
      is_ai_generated: 'true',
    })
    creationId = c.id
  }

  await waitUntilReady(creationId)
  const { id } = await call('POST', `/${IG_ID}/media_publish`, { creation_id: creationId })
  const { permalink } = await call('GET', `/${id}`, { fields: 'permalink' })
  console.log(`Published ${id}: ${permalink}`)
}

main().catch((err) => {
  console.error(`NOT PUBLISHED: ${err.message}`)
  process.exit(1)
})
