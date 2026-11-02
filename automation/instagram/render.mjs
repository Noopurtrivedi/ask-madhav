#!/usr/bin/env node
/**
 * Renders Instagram cards to 1080x1350 JPEGs.
 *
 *   node render.mjs spec.json out-dir
 *
 * A browser does the text because Devanagari needs real shaping. Fonts come from
 * npm packages, so nothing here depends on a network font at render time.
 *
 * spec.kind "theme":  { art, ref, quote: [lines], sanskrit: [lines], hindi, english, tryToday }
 *                     Three slides: quote, verse, one try today.
 * spec.kind "event":  { art, eyebrow, line1, line2, sanskrit, hindi, english, panel, accent }
 *                     One Krishna close-up card for a panchang event.
 */
import { mkdirSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import chromium from '@sparticuz/chromium'
import puppeteer from 'puppeteer-core'

const require = createRequire(import.meta.url)
const W = 1080
const H = 1350

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

const BASE = `<style>${FONTS}
*{margin:0;box-sizing:border-box}html,body{width:${W}px;height:${H}px;overflow:hidden}
.x{position:absolute;inset:0;background-size:cover;background-position:center}
.ink{color:#10183A}.c{position:absolute;left:90px;right:90px;text-align:center}
.sa{font:44px/1.6 'Tiro Devanagari Sanskrit'}.hn{font:500 38px/1.55 'Noto Serif Devanagari'}.en{font:500 37px/1.45 'DM Sans'}
.ttl{font:600 58px 'Playfair Display'}.ref{font:700 26px 'DM Sans';letter-spacing:.2em}
.tag{position:absolute;right:48px;bottom:34px;font:500 25px 'DM Sans';color:rgba(255,255,255,.92)}
</style>`

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
const lines = (a) => a.map(esc).join('<br>')

function themeSlides(s, art) {
  const bg = (extra) => `background-image:url(${art});${extra}`
  return [
    `<div class=x style="${bg('')}"></div>
     <div class="c ink" style="top:96px;font:600 66px 'Playfair Display'">Krishna Says to Arjun</div>
     <div style="position:absolute;top:192px;left:230px;right:230px;height:3px;background:#10183A"></div>
     <div class="c ink" style="top:236px;font:500 50px/1.42 'Playfair Display'">"${lines(s.quote)}"</div>
     <div class="c ink ref" style="top:640px">GITA ${esc(s.ref)}</div>
     <div class=tag>@askmadhav_world</div>`,
    `<div class=x style="${bg('background-size:2000px auto;background-position:top')}"></div>
     <div class="c ink" style="top:150px"><div class=ttl>The verse</div>
     <div class=sa style="margin-top:50px">${lines(s.sanskrit)}</div>
     <div class=hn style="margin-top:50px">${esc(s.hindi)}</div>
     <div class=en style="margin-top:50px">${esc(s.english)}</div>
     <div class=ref style="margin-top:50px">BHAGAVAD GITA ${esc(s.ref)}</div></div>`,
    `<div class=x style="${bg('background-size:1500px auto;background-position:bottom')}"></div>
     <div class="c ink" style="top:120px"><div class=ttl>One try today</div>
     <div style="font:500 44px/1.45 'Playfair Display';margin-top:44px">${esc(s.tryToday)}</div>
     <div class=en style="margin-top:48px">Bring your own question to Madhav.<br><b>askmadhav.world</b></div></div>
     <div class=tag>AI guide inspired by the Gita</div>`,
  ]
}

function eventSlide(s, art) {
  const accent = s.accent ?? '#FFE27A'
  const panel = s.panel ?? '#04523F'
  return [
    `<div class=x style="background-image:url(${art});background-position:top"></div>
     <div style="position:absolute;left:0;right:0;bottom:0;height:760px;background:linear-gradient(transparent,${panel} 42%,${panel})"></div>
     <div style="position:absolute;left:72px;right:72px;bottom:60px;color:#fff">
     <div style="font:700 27px 'DM Sans';letter-spacing:.22em;color:${accent}">${esc(s.eyebrow)}</div>
     <div style="font:600 76px/1.12 'Playfair Display';margin-top:18px">${esc(s.line1)}<br><em style="font-weight:700;color:${accent}">${esc(s.line2)}</em></div>
     <div style="font:34px/1.5 'Tiro Devanagari Sanskrit';margin-top:24px">${esc(s.sanskrit)}</div>
     <div style="font:500 29px/1.4 'Noto Serif Devanagari';margin-top:10px">${esc(s.hindi)}</div>
     <div style="font:500 27px/1.4 'DM Sans';margin-top:10px">${esc(s.english)}</div>
     <div style="font:500 23px 'DM Sans';margin-top:22px;display:flex;justify-content:space-between"><span>AI guide inspired by the Gita</span><b style="color:${accent}">askmadhav.world</b></div></div>`,
  ]
}

async function main() {
  const [specPath, outDir] = process.argv.slice(2)
  if (!specPath || !outDir) throw new Error('Usage: node render.mjs spec.json out-dir')
  const spec = JSON.parse(readFileSync(specPath, 'utf8'))
  const artFile = resolve(dirname(specPath), spec.art)
  const art = `data:image/jpeg;base64,${readFileSync(artFile).toString('base64')}`
  const slides = spec.kind === 'theme' ? themeSlides(spec, art) : spec.kind === 'event' ? eventSlide(spec, art) : null
  if (!slides) throw new Error(`Unknown kind: ${spec.kind}`)

  mkdirSync(outDir, { recursive: true })
  const browser = await puppeteer.launch({
    executablePath: process.env.CHROME_PATH || (await chromium.executablePath()),
    args: process.env.CHROME_PATH ? [] : chromium.args,
    headless: true,
    defaultViewport: { width: W, height: H },
  })
  try {
    const page = await browser.newPage()
    for (const [i, body] of slides.entries()) {
      await page.setContent(`<!doctype html><meta charset=utf-8>${BASE}${body}`, { waitUntil: 'load' })
      await page.evaluate(() => document.fonts.ready)
      const path = join(outDir, `${i + 1}.jpg`)
      await page.screenshot({ path, type: 'jpeg', quality: 92 })
      console.log(path)
    }
  } finally {
    await browser.close()
  }
}

main().catch((err) => {
  console.error(err.message)
  process.exit(1)
})
