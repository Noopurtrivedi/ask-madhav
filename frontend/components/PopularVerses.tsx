'use client'

import { useRouter } from 'next/navigation'

// Curated from the 30 most-loved Gita verses — no API call needed
const POPULAR_VERSES = [
  {
    reference: '2.47',
    yoga: 'Karma Yoga',
    chapter: 2,
    verse: 47,
    label: 'The Most Famous Verse',
    snippet: 'You have a right to perform your duties, but you are not entitled to the fruits of your actions.',
  },
  {
    reference: '2.20',
    yoga: 'Sankhya Yoga',
    chapter: 2,
    verse: 20,
    label: 'The Eternal Soul',
    snippet: 'The soul is never born nor dies at any time. It is unborn, eternal, ever-existing, and primeval.',
  },
  {
    reference: '4.7',
    yoga: 'Jnana Karma Sanyasa Yoga',
    chapter: 4,
    verse: 7,
    label: 'Avatar Vani',
    snippet: 'Whenever there is a decline in righteousness and a rise in unrighteousness, I manifest myself.',
  },
  {
    reference: '18.66',
    yoga: 'Moksha Sanyasa Yoga',
    chapter: 18,
    verse: 66,
    label: 'The Final Teaching',
    snippet: 'Abandon all varieties of dharma and simply surrender unto Me. I shall deliver you from all sinful reactions — do not fear.',
  },
  {
    reference: '2.14',
    yoga: 'Sankhya Yoga',
    chapter: 2,
    verse: 14,
    label: 'On Pleasure & Pain',
    snippet: 'The non-permanent appearance of happiness and distress, and their disappearance in due course, are like the appearance of winter and summer seasons.',
  },
  {
    reference: '6.5',
    yoga: 'Dhyana Yoga',
    chapter: 6,
    verse: 5,
    label: 'Elevate Yourself',
    snippet: 'One must elevate, not degrade, oneself by one\'s own mind. The mind is the friend of the conditioned soul, and its enemy as well.',
  },
  {
    reference: '9.22',
    yoga: 'Raja Vidya Yoga',
    chapter: 9,
    verse: 22,
    label: 'Krishna\'s Promise',
    snippet: 'To those who worship Me with devotion, meditating on My transcendental form, I carry what they lack and preserve what they have.',
  },
  {
    reference: '3.21',
    yoga: 'Karma Yoga',
    chapter: 3,
    verse: 21,
    label: 'Lead By Example',
    snippet: 'Whatever action a great person performs, common people follow. Whatever standards they set, the world pursues.',
  },
  {
    reference: '12.13',
    yoga: 'Bhakti Yoga',
    chapter: 12,
    verse: 13,
    label: 'The True Devotee',
    snippet: 'One who is not envious but is a kind friend to all living entities, who does not think himself a proprietor — such a devotee of Mine is very dear to Me.',
  },
  {
    reference: '15.7',
    yoga: 'Purushottama Yoga',
    chapter: 15,
    verse: 7,
    label: 'The Eternal Fragment',
    snippet: 'The living entities in this conditioned world are My eternal fragmental parts. Due to conditioned life, they are struggling very hard with the six senses.',
  },
]

function scrollToChat(question: string) {
  const el = document.getElementById('chat')
  if (el) el.scrollIntoView({ behavior: 'smooth' })
  // Dispatch custom event so ChatInterface can pre-fill the question
  window.dispatchEvent(new CustomEvent('madhav:prefill', { detail: { question } }))
}

export default function PopularVerses() {
  return (
    <section className="py-20 px-6" style={{ background: '#FFFCF5' }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-saffron/60 text-xs font-medium uppercase tracking-widest mb-3">
            Timeless Wisdom
          </p>
          <h2
            className="text-3xl md:text-4xl text-ink mb-3"
            style={{ fontFamily: 'Crimson Text, serif' }}
          >
            Popular Verses
          </h2>
          <p className="text-ink/50 text-sm max-w-md mx-auto">
            The shlokas people return to again and again — in moments of doubt, grief, and searching.
          </p>
        </div>

        {/* Verse grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {POPULAR_VERSES.map((v) => (
            <button
              key={v.reference}
              onClick={() =>
                scrollToChat(`Tell me about Bhagavad Gita ${v.reference} — ${v.label}`)
              }
              className="group text-left border border-saffron/15 rounded-xl p-5
                         bg-saffron/[0.04] hover:bg-white/[0.05] hover:border-saffron/40
                         transition-all duration-200"
            >
              {/* Badges */}
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className="px-2 py-0.5 bg-saffron/20 text-saffron text-xs font-medium rounded-full">
                  {v.reference}
                </span>
                <span className="text-ink/30 text-xs">{v.yoga}</span>
              </div>

              {/* Label */}
              <p
                className="text-ink text-base font-semibold mb-2 group-hover:text-saffron transition-colors"
                style={{ fontFamily: 'Crimson Text, serif' }}
              >
                {v.label}
              </p>

              {/* Snippet */}
              <p className="text-ink/60 text-sm leading-relaxed line-clamp-3">
                &ldquo;{v.snippet}&rdquo;
              </p>

              {/* CTA */}
              <p className="text-saffron/50 text-xs mt-3 group-hover:text-saffron/80 transition-colors">
                Ask Madhav about this verse →
              </p>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
