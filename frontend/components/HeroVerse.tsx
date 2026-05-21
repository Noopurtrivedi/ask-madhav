'use client'

import { useEffect, useState } from 'react'

/**
 * HeroVerse — an elegant rotating shloka on the landing hero. It always opens
 * with Gita 4.7 ("Yada yada hi dharmasya" — Krishna's promise to descend
 * whenever dharma declines), then gently cross-fades through a few other
 * iconic verses, so the hero feels alive each time the site is launched.
 *
 * Verse text mirrors data/verses.json; kept inline here so the hero stays a
 * lightweight client component (no fetch on first paint).
 */
interface HeroShloka {
  reference: string
  sanskrit: string
  transliteration: string
  english: string
}

const VERSES: HeroShloka[] = [
  {
    reference: '4.7',
    sanskrit: 'यदा यदा हि धर्मस्य ग्लानिर्भवति भारत। अभ्युत्थानमधर्मस्य तदात्मानं सृजाम्यहम्॥',
    transliteration: 'yadā yadā hi dharmasya glānir bhavati bhārata, abhyutthānam adharmasya tadātmānaṃ sṛjāmy aham',
    english: 'Whenever dharma declines and adharma rises, O Bharata, then I manifest Myself.',
  },
  {
    reference: '2.47',
    sanskrit: 'कर्मण्येवाधिकारस्ते मा फलेषु कदाचन। मा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि॥',
    transliteration: 'karmaṇy evādhikāras te mā phaleṣu kadācana, mā karma-phala-hetur bhūr mā te saṅgo ’stv akarmaṇi',
    english: 'You have a right to your actions alone, never to their fruits. Act, but not for the reward.',
  },
  {
    reference: '2.20',
    sanskrit: 'न जायते म्रियते वा कदाचिन्नायं भूत्वा भविता वा न भूयः। अजो नित्यः शाश्वतोऽयं पुराणो न हन्यते हन्यमाने शरीरे॥',
    transliteration: 'na jāyate mriyate vā kadācin nāyaṃ bhūtvā bhavitā vā na bhūyaḥ, ajo nityaḥ śāśvato ’yaṃ purāṇo na hanyate hanyamāne śarīre',
    english: 'The soul is never born and never dies. Unborn, eternal, ever-existing — it is not slain when the body is slain.',
  },
  {
    reference: '6.5',
    sanskrit: 'उद्धरेदात्मनात्मानं नात्मानमवसादयेत्। आत्मैव ह्यात्मनो बन्धुरात्मैव रिपुरात्मनः॥',
    transliteration: 'uddhared ātmanātmānaṃ nātmānam avasādayet, ātmaiva hy ātmano bandhur ātmaiva ripur ātmanaḥ',
    english: 'Lift yourself by your own mind; never let it drag you down. The mind is your friend, and also your enemy.',
  },
  {
    reference: '2.48',
    sanskrit: 'योगस्थः कुरु कर्माणि सङ्गं त्यक्त्वा धनञ्जय। सिद्ध्यसिद्ध्योः समो भूत्वा समत्वं योग उच्यते॥',
    transliteration: 'yogasthaḥ kuru karmāṇi saṅgaṃ tyaktvā dhanañjaya, siddhy-asiddhyoḥ samo bhūtvā samatvaṃ yoga ucyate',
    english: 'Established in yoga, act — let go of attachment, even-minded in success and failure. That evenness is yoga.',
  },
]

const ROTATE_MS = 7000

export default function HeroVerse() {
  const [index, setIndex] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const id = setInterval(() => {
      // Fade out, swap, fade back in.
      setVisible(false)
      const t = setTimeout(() => {
        setIndex((i) => (i + 1) % VERSES.length)
        setVisible(true)
      }, 600)
      return () => clearTimeout(t)
    }, ROTATE_MS)
    return () => clearInterval(id)
  }, [])

  const v = VERSES[index]

  return (
    <div
      className="mx-auto max-w-2xl rounded-2xl border border-saffron/25 bg-white/70 backdrop-blur-sm
                 px-6 py-5 shadow-lg shadow-saffron/10"
      aria-live="polite"
    >
      <div
        className={`transition-opacity duration-500 ${visible ? 'opacity-100' : 'opacity-0'}`}
      >
        <p
          className="text-ink text-lg md:text-xl leading-relaxed mb-2"
          style={{ fontFamily: 'Tiro Devanagari Hindi, Noto Serif Devanagari, serif' }}
          lang="sa"
        >
          {v.sanskrit}
        </p>
        <p className="text-saffron/80 text-sm italic mb-2">{v.transliteration}</p>
        <p className="text-ink/70 text-sm md:text-base leading-relaxed">
          “{v.english}”
        </p>
        <p className="text-saffron/60 text-xs tracking-[0.2em] uppercase mt-3">
          Bhagavad Gita · {v.reference}
        </p>
      </div>

      {/* Rotation dots */}
      <div className="flex justify-center gap-1.5 mt-4">
        {VERSES.map((verse, i) => (
          <span
            key={verse.reference}
            className={`h-1.5 rounded-full transition-all duration-500 ${
              i === index ? 'w-5 bg-saffron' : 'w-1.5 bg-saffron/30'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
