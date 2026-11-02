'use client'

/**
 * "What do you think?" The story ends on an open question. The seeker can answer
 * first and carry their own view to Madhav, including a view that disagrees.
 */

import { useState } from 'react'

export default function StoryQuestion({ title, question }: { title: string; question: string }) {
  const [answer, setAnswer] = useState('')

  const open = () => {
    const view = answer.trim()
    const prompt = view
      ? `In the story "${title}", I was asked: ${question} My view is: ${view} Tell me honestly where I am right and where the Gita would challenge me.`
      : `In the story "${title}", I was asked: ${question} Help me think it through, without telling me what to believe.`
    try {
      sessionStorage.setItem('madhav:prefill', prompt)
    } catch {
      // Storage blocked: the chat still opens.
    }
    window.location.href = '/#chat'
  }

  return (
    <section className="mt-8 text-center">
      <p className="eyebrow mb-4">What do you think?</p>
      <p className="font-display text-2xl leading-snug text-moonlight">{question}</p>
      <textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        maxLength={600}
        rows={3}
        placeholder="Write your view. You are free to disagree."
        aria-label="Your view"
        className="library-input mt-5 resize-none"
      />
      <button type="button" onClick={open} className="btn-leaf mt-4 px-6 py-3 text-xs">
        Talk it through with Madhav
      </button>
    </section>
  )
}
