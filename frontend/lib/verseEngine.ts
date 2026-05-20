/**
 * Keyword-based verse retrieval engine — a TypeScript port of the original
 * Python `verse_engine.py`. Runs inside Next.js API routes so the app needs
 * no separate backend. Architecture stays ready for semantic search: swap
 * `scoreVerses()` for an embedding similarity query when embeddings exist.
 */
import versesData from '@/data/verses.json'
import storiesData from '@/data/stories.json'

export interface RawVerse {
  id: number
  chapter_number: number
  verse_number: number
  reference: string
  sanskrit_text: string
  transliteration: string
  hindi_meaning: string
  english_meaning: string
  keywords: string[]
  themes: string[]
  practical_guidance: string
}

export interface Story {
  id: number
  title: string
  description: string
  characters: string[]
  moral: string
  chapter_reference: number
  image_placeholder: string
}

export interface VerseCard {
  chapter: number
  verse: number
  reference: string
  sanskrit: string
  transliteration: string
  hindi_meaning: string
  english_meaning: string
  practical_guidance: string
  themes: string[]
}

export const VERSES = versesData as RawVerse[]
export const STORIES = storiesData as Story[]

const STOP_WORDS = new Set([
  'the', 'and', 'but', 'for', 'with', 'that', 'this', 'have', 'from',
  'they', 'will', 'your', 'what', 'how', 'can', 'its', 'our', 'are',
  'was', 'has', 'had', 'not', 'been', 'were', 'would', 'could', 'should',
  'very', 'just', 'also', 'more', 'into', 'than', 'then', 'when', 'where',
  'who', 'which', 'there', 'their', 'about', 'after', 'being', 'each',
  'other', 'much', 'some', 'such', 'only', 'even', 'most', 'over', 'same',
])

// Theme-to-keyword expansion map (mirrors THEME_EXPANSIONS in Python)
const THEME_EXPANSIONS: Record<string, string[]> = {
  anger: ['angry', 'rage', 'furious', 'frustrat', 'irritat', 'annoy'],
  grief: ['grieving', 'loss', 'mourn', 'sad', 'sorrow', 'bereave', 'died', 'death', 'dead'],
  anxiety: ['anxious', 'worry', 'worrying', 'fear', 'scared', 'stress', 'panic', 'nervous'],
  duty: ['job', 'work', 'career', 'responsib', 'obligat', 'task', 'role'],
  detachment: ['attachment', 'letting go', 'release', 'outcome', 'result', 'expectation'],
  courage: ['brave', 'fear', 'coward', 'giving up', 'quit', 'weak', 'strength'],
  purpose: ['meaning', 'life', 'goal', 'direction', 'calling', 'mission'],
  mind: ['focus', 'concentrat', 'distract', 'procrastinat', 'meditat'],
  soul: ['death', 'dying', 'eternal', 'rebirth', 'spirit', 'atma'],
  devotion: ['pray', 'faith', 'god', 'krishna', 'worship', 'surrender'],
  jealousy: ['envy', 'jealous', 'colleague', 'success', 'competi'],
  addiction: ['habit', 'craving', 'desire', 'temptation', 'compulsion'],
  guilt: ['regret', 'mistake', 'past', 'shame', 'remorse', 'forgive'],
}

const THEME_OPENERS: Record<string, string> = {
  detachment: 'The Gita reminds us that inner peace comes when we release our grip on outcomes.',
  duty: "Krishna's wisdom calls us to focus on our sacred duty, performed with a full heart.",
  'karma yoga': 'Through selfless action, the Gita shows us a path beyond suffering.',
  devotion: 'Bhagavan Krishna assures us that sincere devotion is the surest path to peace.',
  courage: 'The Gita urges us to rise — not despite our fear, but through it.',
  anger: 'The Gita warns that uncontrolled anger clouds wisdom and leads to suffering.',
  grief: 'Even the greatest warrior, Arjuna, faced deep grief. The Gita holds space for your pain.',
  wisdom: 'True wisdom, says the Gita, is seeing the eternal Self beyond all temporary circumstances.',
  soul: 'You are not this body or these emotions — you are the eternal, indestructible soul.',
  surrender: 'When you surrender your burden to the Divine, true freedom begins.',
  mind: 'Your restless mind can be tamed — not by force, but by patient, consistent practice.',
  equanimity: 'The Gita calls us to be the unshaken center of the storm, not its victim.',
}

type KeywordIndex = Map<string, Set<number>>

function buildKeywordIndex(verses: RawVerse[]): KeywordIndex {
  const index: KeywordIndex = new Map()
  const add = (token: string, id: number) => {
    if (!index.has(token)) index.set(token, new Set())
    index.get(token)!.add(id)
  }
  for (const verse of verses) {
    for (const kw of verse.keywords || []) {
      for (const token of kw.toLowerCase().split(/\s+/)) add(token, verse.id)
    }
    for (const theme of verse.themes || []) {
      for (const token of theme.toLowerCase().split(/\s+/)) add(token, verse.id)
    }
  }
  return index
}

// Built once per server instance.
const KEYWORD_INDEX = buildKeywordIndex(VERSES)
const VERSE_MAP = new Map(VERSES.map((v) => [v.id, v]))

function tokenize(text: string): Set<string> {
  const matches = text.toLowerCase().match(/\b[a-z]{3,}\b/g) || []
  return new Set(matches.filter((t) => !STOP_WORDS.has(t)))
}

function expandTokens(tokens: Set<string>): Set<string> {
  const expanded = new Set(tokens)
  for (const token of Array.from(tokens)) {
    for (const [theme, synonyms] of Object.entries(THEME_EXPANSIONS)) {
      const hit =
        synonyms.includes(token) ||
        synonyms.some((s) => s.length >= 4 && token.startsWith(s.slice(0, 4)))
      if (hit) {
        expanded.add(theme)
        synonyms.slice(0, 2).forEach((s) => expanded.add(s))
      }
    }
  }
  return expanded
}

export function scoreVerses(question: string): RawVerse[] {
  const tokens = expandTokens(tokenize(question))
  const scores = new Map<number, number>()
  const bump = (id: number, by: number) => scores.set(id, (scores.get(id) || 0) + by)

  for (const token of tokens) {
    // Exact match
    for (const id of KEYWORD_INDEX.get(token) || []) bump(id, 3)
    // Prefix match (e.g. "anxi" matches "anxiety")
    if (token.length >= 4) {
      for (const [kw, ids] of KEYWORD_INDEX) {
        if (kw.startsWith(token) || token.startsWith(kw)) {
          for (const id of ids) bump(id, 1)
        }
      }
    }
  }

  const ranked = Array.from(scores.entries())
    .filter(([, score]) => score > 0)
    .sort((a, b) => b[1] - a[1])

  const result: RawVerse[] = []
  for (const [id] of ranked) {
    result.push(VERSE_MAP.get(id)!)
    if (result.length >= 3) break
  }

  // Fallback: day-of-year verse so the response is never empty
  if (result.length === 0 && VERSES.length) {
    result.push(VERSES[dayOfYear() % VERSES.length])
  }
  return result
}

export function verseCard(verse: RawVerse): VerseCard {
  return {
    chapter: verse.chapter_number,
    verse: verse.verse_number,
    reference: verse.reference,
    sanskrit: verse.sanskrit_text,
    transliteration: verse.transliteration,
    hindi_meaning: verse.hindi_meaning,
    english_meaning: verse.english_meaning,
    practical_guidance:
      verse.practical_guidance ||
      'Reflect on this verse today and take one small action aligned with its teaching.',
    themes: verse.themes || [],
  }
}

export function disclaimer(): string {
  return (
    'This guidance is inspired by the teachings of the Bhagavad Gita. ' +
    'It is not a substitute for medical, legal, or financial advice, ' +
    'and this chatbot does not speak as the divine Krishna.'
  )
}

export interface AskResponse {
  question: string
  answer: string
  verses: VerseCard[]
  disclaimer: string
}

/** Template answer used when no LLM key is configured (faithful to the Python original). */
export function buildTemplateAnswer(question: string, verses: RawVerse[]): AskResponse {
  if (verses.length === 0) {
    return {
      question,
      answer: 'The Bhagavad Gita teaches that every question has a spiritual answer within.',
      verses: [],
      disclaimer: disclaimer(),
    }
  }

  const verse = verses[0]
  let opening = 'The Bhagavad Gita speaks directly to your heart in this moment.'
  outer: for (const theme of verse.themes || []) {
    for (const [key, phrase] of Object.entries(THEME_OPENERS)) {
      if (theme.toLowerCase().includes(key)) {
        opening = phrase
        break outer
      }
    }
  }

  const middle = `In Chapter ${verse.chapter_number}, verse ${verse.verse_number}, Krishna teaches: "${verse.english_meaning}"`
  const closing = 'Sit with this wisdom today. Let it guide your next small step forward.'

  return {
    question,
    answer: `${opening} ${middle} ${closing}`,
    verses: verses.map(verseCard),
    disclaimer: disclaimer(),
  }
}

export function dayOfYear(d = new Date()): number {
  const start = Date.UTC(d.getUTCFullYear(), 0, 0)
  const now = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
  return Math.floor((now - start) / 86400000)
}

export function dailyVerse(): RawVerse {
  return VERSES[dayOfYear() % VERSES.length]
}

export function findVerse(reference: string): RawVerse | undefined {
  return VERSES.find((v) => v.reference === reference)
}
