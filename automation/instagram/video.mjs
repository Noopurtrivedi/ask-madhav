#!/usr/bin/env node
/**
 * Renders a vertical reel or story to 1080x1920 MP4, plus a cover JPEG for reels.
 *
 *   node video.mjs spec.json out-dir
 *
 * spec: { kind: "reel"|"story", art, accent, textAt, duration,
 *         cover: { eyebrow, title, accentLine },
 *         beats: [{ start, end, eyebrow?, title?, accentLine?, sanskrit?, hindi?, english?, ref?, note? }] }
 *
 * textAt is the vertical centre of the words, as a percentage. Use about 72 for a
 * face in the upper half and about 33 for a silhouette low in the frame. Between 25
 * and 75 stays clear of Instagram's buttons and survives the grid crop. A browser draws the text because Devanagari needs real
 * shaping. The music is a soft original drone, so there's nothing to license.
 */
import { spawnSync } from 'node:child_process'
import { mkdirSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import ffmpeg from '@ffmpeg-installer/ffmpeg'
import chromium from '@sparticuz/chromium'
import puppeteer from 'puppeteer-core'

const require = createRequire(import.meta.url)
const W = 1080
const H = 1920
const FPS = 30

function font(pkg, file, family, weight, style = 'normal') {
  const path = join(dirname(require.resolve(`${pkg}/package.json`)), 'files', file)
  const data = readFileSync(path).toString('base64')
  return `@font-face{font-family:'${family}';font-weight:${weight};font-style:${style};src:url(data:font/woff2;base64,${data}) format('woff2')}`
}

const FONTS = [
  font('@fontsource/playfair-display', 'playfair-display-latin-600-normal.woff2', 'Playfair Display', 600),
  font('@fontsource/playfair-display', 'playfair-display-latin-700-italic.woff2', 'Playfair Display', 700, 'italic'),
  font('@fontsource/dm-sans', 'dm-sans-latin-500-normal.woff2', 'DM Sans', 500),
  font('@fontsource/dm-sans', 'dm-sans-latin-700-normal.woff2', 'DM Sans', 700),
  font('@fontsource/tiro-devanagari-sanskrit', 'tiro-devanagari-sanskrit-devanagari-400-normal.woff2', 'Tiro Devanagari Sanskrit', 400),
  font('@fontsource/noto-serif-devanagari', 'noto-serif-devanagari-devanagari-500-normal.woff2', 'Noto Serif Devanagari', 500),
].join('')

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])

function css(accent, textAt) {
  return `<style>${FONTS}
*{margin:0;box-sizing:border-box}html,body{width:${W}px;height:${H}px;overflow:hidden;background:transparent}
.band{position:absolute;left:0;right:0;top:${textAt}%;transform:translateY(-50%);padding:90px 84px;text-align:center;color:#fff;
background:linear-gradient(transparent,rgba(6,8,30,.62) 16%,rgba(6,8,30,.62) 84%,transparent)}
.ey{font:700 30px 'DM Sans';letter-spacing:.2em;color:${accent};text-transform:uppercase;margin-bottom:26px}
.t{font:600 86px/1.16 'Playfair Display'}.a{font:italic 700 86px/1.16 'Playfair Display';color:${accent}}
.sa{font:50px/1.55 'Tiro Devanagari Sanskrit'}.hn{font:500 44px/1.5 'Noto Serif Devanagari';margin-top:30px}
.en{font:500 44px/1.42 'DM Sans';margin-top:30px}.rf{font:700 30px 'DM Sans';letter-spacing:.18em;color:${accent};margin-top:34px}
.nt{font:500 40px/1.4 'DM Sans';margin-top:34px}
</style>`
}

function panel(b) {
  const part = (cls, v) => (v ? `<div class=${cls}>${esc(v)}</div>` : '')
  return `<div class=band>${part('ey', b.eyebrow)}${part('t', b.title)}${part('a', b.accentLine)}${part('sa', b.sanskrit)}${part('hn', b.hindi)}${part('en', b.english)}${part('rf', b.ref)}${part('nt', b.note)}</div>`
}

function sparkles(seed, count) {
  let x = seed
  const next = () => (x = (x * 16807) % 2147483647) / 2147483647
  let dots = ''
  for (let i = 0; i < count; i++) {
    const size = 2 + next() * 7
    const glow = size * 3
    dots += `<i style="position:absolute;left:${next() * W}px;top:${next() * H * 2}px;width:${size}px;height:${size}px;border-radius:50%;background:#fff;opacity:${0.35 + next() * 0.6};box-shadow:0 0 ${glow}px ${glow / 3}px rgba(255,255,255,.55)"></i>`
  }
  return dots
}

function run(args) {
  const res = spawnSync(ffmpeg.path, args, { stdio: ['ignore', 'ignore', 'pipe'], maxBuffer: 1 << 26 })
  if (res.status !== 0) throw new Error(`ffmpeg failed: ${res.stderr?.toString().slice(-800)}`)
}

async function main() {
  const [specPath, outDir] = process.argv.slice(2)
  if (!specPath || !outDir) throw new Error('Usage: node video.mjs spec.json out-dir')
  const spec = JSON.parse(readFileSync(specPath, 'utf8'))
  if (!['reel', 'story'].includes(spec.kind)) throw new Error(`Unknown kind: ${spec.kind}`)
  const artFile = resolve(dirname(specPath), spec.art)
  const dur = spec.duration
  const accent = spec.accent ?? '#8CFFE8'
  const textAt = spec.textAt ?? 72
  mkdirSync(outDir, { recursive: true })

  const browser = await puppeteer.launch({
    executablePath: process.env.CHROME_PATH || (await chromium.executablePath()),
    args: process.env.CHROME_PATH ? [] : chromium.args,
    headless: true,
    defaultViewport: { width: W, height: H * 2 },
  })
  const layers = []
  try {
    const page = await browser.newPage()
    const shot = async (name, html, height = H) => {
      await page.setViewport({ width: W, height })
      await page.setContent(`<!doctype html><meta charset=utf-8>${css(accent, textAt)}<body style="height:${height}px">${html}`, { waitUntil: 'load' })
      await page.evaluate(() => document.fonts.ready)
      const path = join(outDir, name)
      await page.screenshot({ path, type: 'png', omitBackground: true })
      return path
    }
    layers.push(await shot('sparkle-a.png', sparkles(7, 90), H * 2))
    layers.push(await shot('sparkle-b.png', sparkles(99, 60), H * 2))
    for (const [i, b] of spec.beats.entries()) layers.push(await shot(`beat-${i}.png`, panel(b)))
    if (spec.cover) layers.push(await shot('cover.png', panel(spec.cover)))
  } finally {
    await browser.close()
  }

  const beats = spec.beats
  const frames = Math.round(dur * FPS)
  const inputs = ['-loop', '1', '-t', String(dur), '-i', artFile]
  for (const l of layers.slice(0, 2 + beats.length)) inputs.push('-loop', '1', '-t', String(dur), '-i', l)
  const drone = "0.16*sin(2*PI*138.6*t)*(0.75+0.25*sin(2*PI*0.21*t))+0.11*sin(2*PI*207.9*t)*(0.7+0.3*sin(2*PI*0.17*t+1))+0.09*sin(2*PI*277.2*t)*(0.7+0.3*sin(2*PI*0.13*t+2))+0.05*sin(2*PI*415.8*t)"
  inputs.push('-f', 'lavfi', '-i', `aevalsrc='${drone}':s=44100:d=${dur}`)
  const audio = 3 + beats.length

  const chain = [
    `[0:v]scale=2160:3840:force_original_aspect_ratio=increase,crop=2160:3840,zoompan=z='1+0.08*on/${frames}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=${W}x${H}:fps=${FPS}[base]`,
    `[base][1:v]overlay=y='-mod(t*38\\,${H})':format=auto[s1]`,
    `[s1][2:v]overlay=y='-${H}+mod(t*22\\,${H})':format=auto[v0]`,
  ]
  beats.forEach((b, i) => {
    chain.push(`[${3 + i}:v]format=rgba,fade=t=in:st=${b.start}:d=0.5:alpha=1,fade=t=out:st=${b.end - 0.4}:d=0.4:alpha=1[t${i}]`)
    chain.push(`[v${i}][t${i}]overlay=format=auto[v${i + 1}]`)
  })
  chain.push(`[${audio}:a]afade=t=in:d=1.5,afade=t=out:st=${dur - 1.5}:d=1.5[a]`)

  const mp4 = join(outDir, `${spec.kind}.mp4`)
  run(['-y', ...inputs, '-filter_complex', chain.join(';'), '-map', `[v${beats.length}]`, '-map', '[a]',
    '-t', String(dur), '-r', String(FPS), '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p',
    '-profile:v', 'high', '-level', '4.1', '-c:a', 'aac', '-b:a', '160k', '-ar', '44100', '-movflags', '+faststart', mp4])
  console.log(mp4)

  if (spec.cover) {
    const cover = join(outDir, 'cover.jpg')
    run(['-y', '-i', artFile, '-i', join(outDir, 'cover.png'), '-filter_complex',
      `[0:v]scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H}[b];[b][1:v]overlay`, '-frames:v', '1', '-q:v', '2', cover])
    console.log(cover)
  }
}

main().catch((err) => {
  console.error(err.message)
  process.exit(1)
})
