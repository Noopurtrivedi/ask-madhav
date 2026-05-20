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
