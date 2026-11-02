#!/usr/bin/env node
/**
 * Publishes one Instagram post through the Instagram API with Instagram Login.
 *
 *   NODE_USE_ENV_PROXY=1 node publish.mjs --urls <jpg,jpg,...> --caption-file caption.txt [--dry-run]
 *
 *   ... --reel <mp4> --cover <jpg> --caption-file caption.txt
 *   ... --story <mp4 or jpg>
 *
 * One URL makes a single image post; two or more make a carousel. Media must be
 * public URLs, because Meta fetches them itself. --container-only runs everything
 * except the publish step, so it proves Meta can process a file without posting.
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
const HOSTS = ['https://graph.facebook.com/v23.0', 'https://graph.instagram.com/v23.0']
const EXPECTED_USERNAME = 'askmadhav_world'
const IG_ID = '17841435472946983'
const MIN_GAP_HOURS = 20
const MAX_CAPTION = 2200
const POLL_MS = 15_000
const POLL_TRIES = 20 // Meta asks for about 5 minutes of polling at most.

function args(argv) {
  const out = {}
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--dry-run') out.dryRun = true
    else if (a === '--container-only') out.containerOnly = true
    else if (a === '--urls') out.urls = argv[++i]
    else if (a === '--reel') out.reel = argv[++i]
    else if (a === '--cover') out.cover = argv[++i]
    else if (a === '--story') out.story = argv[++i]
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

async function assertPublicMedia(url) {
  if (!/^https:\/\//.test(url)) throw new Error(`Not an https URL: ${url}`)
  const res = await fetch(url, { method: 'HEAD' })
  const type = res.headers.get('content-type') ?? ''
  // GitHub serves mp4 as application/octet-stream, which Meta accepts by content.
  const ok = /\.mp4$/.test(new URL(url).pathname)
    ? /video\/mp4|octet-stream/.test(type)
    : /image\/jpe?g/.test(type)
  if (!res.ok || !ok) throw new Error(`Meta can't use ${url}: status ${res.status}, type "${type}"`)
}

async function waitUntilReady(id) {
  for (let i = 0; i < POLL_TRIES; i++) {
    const { status_code: status, status: detail } = await call('GET', `/${id}`, { fields: 'status_code,status' })
    if (status === 'FINISHED') return
    if (status === 'ERROR' || status === 'EXPIRED') throw new Error(`Container ${id} is ${status}: ${detail ?? 'no detail'}`)
    await new Promise((r) => setTimeout(r, POLL_MS))
  }
  throw new Error(`Container ${id} wasn't ready in time`)
}

async function hoursSinceLatest(edge) {
  const latest = await call('GET', `/${IG_ID}/${edge}`, { fields: 'timestamp', limit: '1' })
  const last = latest.data?.[0]?.timestamp
  return last ? (Date.now() - new Date(last).getTime()) / 3_600_000 : Infinity
}

async function connect() {
  let lastError
  for (const host of HOSTS) {
    api = host
    try {
      const me = await call('GET', `/${IG_ID}`, { fields: 'username' })
      if (me.username !== EXPECTED_USERNAME) {
        throw new Error(`Connected to @${me.username}, expected @${EXPECTED_USERNAME}`)
      }
      return me
    } catch (err) {
      lastError = err
    }
  }
  throw lastError
}

/** Builds the container for the requested kind and returns its id. */
async function createContainer(opts, caption) {
  const media = (fields) => call('POST', `/${IG_ID}/media`, fields).then((c) => c.id)
  if (opts.reel) {
    const fields = { media_type: 'REELS', video_url: opts.reel, caption, share_to_feed: 'true', is_ai_generated: 'true' }
    if (opts.cover) fields.cover_url = opts.cover
    return media(fields)
  }
  if (opts.story) {
    const key = /\.mp4$/.test(new URL(opts.story).pathname) ? 'video_url' : 'image_url'
    return media({ media_type: 'STORIES', [key]: opts.story, is_ai_generated: 'true' })
  }
  if (opts.urls.length === 1) {
    return media({ image_url: opts.urls[0], caption, is_ai_generated: 'true' })
  }
  const children = []
  for (const image_url of opts.urls) {
    // The AI flag goes on the carousel only; Meta errors if a child has it.
    const id = await media({ image_url, is_carousel_item: 'true' })
    await waitUntilReady(id)
    children.push(id)
  }
  return media({ media_type: 'CAROUSEL', children: children.join(','), caption, is_ai_generated: 'true' })
}

async function main() {
  const opts = args(process.argv.slice(2))
  opts.urls = (opts.urls ?? '').split(',').map((u) => u.trim()).filter(Boolean)
  const kinds = [opts.urls.length > 0, Boolean(opts.reel), Boolean(opts.story)].filter(Boolean).length
  if (kinds !== 1) throw new Error('Pass exactly one of --urls, --reel or --story')
  if (opts.urls.length > 20) throw new Error('At most 20 URLs')

  const needsCaption = !opts.story
  let caption = ''
  if (needsCaption) {
    if (!opts.captionFile) throw new Error('Pass --caption-file')
    caption = readFileSync(opts.captionFile, 'utf8').trim()
    if (!caption || caption.length > MAX_CAPTION) throw new Error('Caption is empty or too long')
  }

  const media = [...opts.urls, opts.reel, opts.cover, opts.story].filter(Boolean)
  await Promise.all(media.map(assertPublicMedia))

  const me = await connect()

  // Stories sit outside the grid, so they have their own one-a-day guard.
  const hours = await hoursSinceLatest(opts.story ? 'stories' : 'media')
  if (hours < MIN_GAP_HOURS && !opts.containerOnly) {
    throw new Error(`Last ${opts.story ? 'story' : 'post'} was ${hours.toFixed(1)}h ago, under the ${MIN_GAP_HOURS}h gap`)
  }

  if (opts.dryRun) {
    console.log(`Dry run OK: @${me.username}, ${media.length} file(s), caption ${caption.length} chars`)
    return
  }

  const creationId = await createContainer(opts, caption)
  await waitUntilReady(creationId)

  // Meta accepted and processed the media, and an unpublished container just expires.
  if (opts.containerOnly) {
    console.log(`Container ${creationId} is ready. Nothing was published.`)
    return
  }

  const { id } = await call('POST', `/${IG_ID}/media_publish`, { creation_id: creationId })
  const { permalink } = await call('GET', `/${id}`, { fields: 'permalink' })
  console.log(`Published ${id}: ${permalink ?? '(stories have no permalink)'}`)
}

main().catch((err) => {
  console.error(`NOT PUBLISHED: ${err.message}`)
  process.exit(1)
})
