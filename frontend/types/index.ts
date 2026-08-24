export interface Verse {
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
  /** Full spoken retelling (kept within the TTS character window). */
  narration?: string
  /** What to carry from the story into daily life. */
  lesson?: string
  /** Gita verses that anchor the story's teaching. */
  gita_refs?: { ref: string; line: string }[]
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
  themes?: string[]
}

export type AnswerSource = 'ai' | 'template'

// ── User profile (Phase 1): age band tunes the analogies; language selects the
// answer language. Self-declared, stored in localStorage — no PII collected. ──
export type AgeGroup = 'under-18' | '18-25' | '26-40' | '41-60' | '60-plus'
export type AnswerLanguage = 'english' | 'hindi' | 'hinglish'

// `ageGroup` is optional — a seeker may pick a language without disclosing age,
// in which case Madhav answers in that language with untuned (general) analogies.
export interface UserProfile {
  ageGroup?: AgeGroup
  language: AnswerLanguage
}

export interface AskResponse {
  question: string
  answer: string
  verses: VerseCard[]
  disclaimer: string
  source?: AnswerSource
}

export type MessageRole = 'user' | 'assistant'

export interface ChatMessage {
  id: string
  role: MessageRole
  content: string
  verses?: VerseCard[]
  disclaimer?: string
  source?: AnswerSource
  timestamp: Date
}

export interface DailyVerseResponse {
  date: string
  verse: Verse
}

export interface StoriesResponse {
  stories: Story[]
}
