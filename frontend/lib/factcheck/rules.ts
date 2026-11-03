/**
 * Deterministic checks for an Instagram post. No model is involved here, so a
 * failure is a fact, not an opinion: any failed check blocks the post.
 *
 * Sources of record: the app's own verse data (data/verses.json), the IIT Kanpur
 * Gita Supersite for the Sanskrit, and Drik Panchang for festival dates.
 */
import { findVerse } from '@/lib/verseEngine'

export interface VerseClaim {
  ref: string
  sanskrit: string
  hindi: string
  english: string
}

export interface DateClaim {
  event: string
  /** ISO date, e.g. 2026-11-05 */
  date: string
  /** Drik Panchang page that shows this date for one location */
  sourceUrl: string
}

export interface PostDraft {
  kind: 'carousel' | 'image' | 'reel' | 'story'
  caption: string
  /** Exactly the URLs that publish.mjs will send, in the same order. */
  media: string[]
  /** Every word that appears on the pictures or video frames. */
  onImageText: string[]
  verses: VerseClaim[]
  dates?: DateClaim[]
}

export interface CheckResult {
  check: string
  pass: boolean
  detail: string
}

const MAX_CAPTION = 2200
const MAX_HASHTAGS = 5

// The panchang honesty rules: things that sound scientific but aren't supported.
const BANNED_CLAIMS: [RegExp, string][] = [
  [/moon[^.]{0,80}(pull|tide|water)/i, 'claims the moon pulls water in the body'],
  [/\bdetox/i, 'detox claim'],
  [/autophag/i, 'autophagy claim'],
  [/scien\w*\s+(prove|confirm|show)s?\b|scientifically\s+(proven|backed)/i, 'claims science proves a ritual'],
  [/\b(cures?|heals?)\s+(cancer|diabetes|disease)/i, 'medical cure claim'],
]

// House style for captions (humanizer rules the owner set).
const BANNED_WORDS = [
  'delve', 'leverage', 'utilize', 'navigate', 'harness', 'foster', 'streamline', 'underscore',
  'seamless', 'robust', 'tapestry', 'realm', 'landscape', 'moreover', 'furthermore', 'additionally',
]

const FASTING = /ekadashi|\bfast(ing)?\b|\bvrat\b|upvas|upavasa|व्रत|उपवास|एकादशी/i
const SAFETY_TERMS = [/pregnan/i, /diabet/i, /medication/i, /eating disorder/i]

/** Strips everything but Devanagari letters and marks, so punctuation and spacing don't matter. */
export function normaliseSanskrit(s: string): string {
  return s.replace(/[^ऀ-ॣ०-ॿ]/g, '')
}

const has = (re: RegExp, s: string) => re.test(s)

export function verseChecks(post: PostDraft): CheckResult[] {
  const out: CheckResult[] = []
  if (post.verses.length === 0) {
    out.push({ check: 'verse present', pass: false, detail: 'Every post must carry at least one verse.' })
    return out
  }
  for (const v of post.verses) {
    const known = findVerse(v.ref)
    if (!known) {
      out.push({ check: `verse ${v.ref} exists`, pass: false, detail: 'Not found in data/verses.json.' })
      continue
    }
    const claimed = normaliseSanskrit(v.sanskrit)
    const source = normaliseSanskrit(known.sanskrit_text)
    out.push({
      check: `verse ${v.ref} Sanskrit matches app data`,
      pass: claimed.length >= 12 && source.includes(claimed),
      detail: claimed.length < 12 ? 'Sanskrit is missing or too short to verify.' : 'Compared against data/verses.json.',
    })
    out.push({
      check: `verse ${v.ref} has Hindi`,
      pass: has(/[ऀ-ॿ]{3}/, v.hindi),
      detail: 'Hindi must be in Devanagari.',
    })
    out.push({
      check: `verse ${v.ref} has English`,
      pass: /[A-Za-z]{3}/.test(v.english) && v.english.trim().split(/\s+/).length >= 4,
      detail: 'English rendering must be present.',
    })
    const everything = [post.caption, ...post.onImageText].join('\n')
    out.push({
      check: `verse ${v.ref} reference shown`,
      pass: everything.includes(v.ref),
      detail: 'The verse number must appear in the caption or on the visuals.',
    })
  }
  return out
}

export function textChecks(post: PostDraft): CheckResult[] {
  const out: CheckResult[] = []
  const all = [post.caption, ...post.onImageText].join('\n')

  for (const [re, label] of BANNED_CLAIMS) {
    out.push({ check: `no ${label}`, pass: !re.test(all), detail: re.test(all) ? `Matched: ${all.match(re)?.[0]}` : 'Clear.' })
  }

  const words = BANNED_WORDS.filter((w) => new RegExp(`\\b${w}`, 'i').test(post.caption))
  out.push({ check: 'house style words', pass: words.length === 0, detail: words.length ? `Uses: ${words.join(', ')}` : 'Clear.' })
  out.push({ check: 'no em or en dashes', pass: !/[–—]/.test(all), detail: 'House style bans them.' })

  if (FASTING.test(all)) {
    const missing = SAFETY_TERMS.filter((re) => !re.test(post.caption))
    out.push({
      check: 'fasting safety line',
      pass: missing.length === 0,
      detail: missing.length ? 'Fasting posts must name pregnancy, diabetes, regular medication and eating disorders.' : 'Present.',
    })
  }

  if (post.kind !== 'story') {
    out.push({ check: 'caption length', pass: post.caption.length > 0 && post.caption.length <= MAX_CAPTION, detail: `${post.caption.length} chars.` })
    const tags = (post.caption.match(/#\w+/g) ?? []).length
    out.push({ check: 'hashtags', pass: tags <= MAX_HASHTAGS, detail: `${tags} hashtags.` })
  }

  const expected = { carousel: [2, 20], image: [1, 1], reel: [2, 2], story: [1, 1] }[post.kind]
  out.push({
    check: 'media count',
    pass: post.media.length >= expected[0] && post.media.length <= expected[1],
    detail: `${post.media.length} file(s) for a ${post.kind}.`,
  })
  out.push({
    check: 'media hosted on the media branch',
    pass: post.media.every((u) => u.startsWith('https://raw.githubusercontent.com/Noopurtrivedi/ask-madhav/claude/ig-media/')),
    detail: 'Only files the routine committed can be published.',
  })
  return out
}
