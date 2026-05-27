/**
 * Shared guidance pipeline — the single place that turns a seeker's question
 * into Madhav's reply. Used by BOTH the web chat (`/api/ask`) and the WhatsApp
 * webhook (`/api/whatsapp`) so the two channels never drift apart.
 *
 * Mirrors the core RAG discipline of the app: retrieval always succeeds, the
 * template answer is a guaranteed fallback, and a failing LLM call never throws.
 */
import { scoreVerses, buildTemplateAnswer, type AskResponse } from '@/lib/verseEngine'
import { generateGuidance, type ChatTurn } from '@/lib/gemini'
import type { UserProfile } from '@/types'

export type { ChatTurn } from '@/lib/gemini'

export interface GuidanceResult extends AskResponse {
  source: 'ai' | 'template'
}

/**
 * Retrieve grounding verses, build the deterministic template answer, then try
 * to overlay an LLM reply. Returns `source: 'ai'` when the LLM succeeded,
 * `'template'` otherwise. Never throws.
 */
export async function answerQuestion(
  question: string,
  history: ChatTurn[] = [],
  profile?: UserProfile,
): Promise<GuidanceResult> {
  // Retrieval is in-memory and always returns at least one verse.
  const matched = scoreVerses(question)
  const base = buildTemplateAnswer(question, matched)

  let answer = base.answer
  let usedAi = false
  try {
    const ai = await generateGuidance(question, matched, history, profile)
    if (ai) {
      answer = ai
      usedAi = true
    }
  } catch (err) {
    console.error('generateGuidance failed', err)
  }

  return { ...base, answer, source: usedAi ? 'ai' : 'template' }
}
