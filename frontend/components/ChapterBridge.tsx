'use client'

/**
 * "Read the full chapter" bridge shown on a verse card. A single shloka often
 * leaves a seeker wanting the whole arc — this carries them into Madhav's chat
 * to explore the chapter it belongs to.
 *
 * On the home page (where the chat lives) it scrolls + prefills directly. On a
 * standalone page like /verse/2.47 it stashes the question and navigates home,
 * where ChatInterface picks it up on mount.
 */
export default function ChapterBridge({ chapter }: { chapter: number }) {
  const go = () => {
    const question = `Tell me the essence of Chapter ${chapter} of the Bhagavad Gita and how it applies to my life.`
    const chat = document.getElementById('chat')
    if (chat) {
      chat.scrollIntoView({ behavior: 'smooth' })
      window.dispatchEvent(new CustomEvent('madhav:prefill', { detail: { question } }))
    } else {
      try {
        sessionStorage.setItem('madhav:prefill', question)
      } catch {
        /* storage blocked — navigate anyway */
      }
      window.location.href = '/#chat'
    }
  }

  return (
    <button
      onClick={go}
      className="text-gold-soft/75 hover:text-saffron text-xs flex items-center gap-1 transition-colors"
    >
      📖 Read all of Chapter {chapter}
    </button>
  )
}
