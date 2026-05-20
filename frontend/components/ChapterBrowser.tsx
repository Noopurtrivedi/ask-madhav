'use client'

const CHAPTERS = [
  { n: 1,  yoga: 'Arjuna Vishada Yoga',              short: 'Arjuna\'s Grief',        verses: 47,  color: 'from-red-900/30' },
  { n: 2,  yoga: 'Sankhya Yoga',                     short: 'Eternal Soul & Duty',    verses: 72,  color: 'from-orange-900/30' },
  { n: 3,  yoga: 'Karma Yoga',                       short: 'Path of Action',         verses: 43,  color: 'from-amber-900/30' },
  { n: 4,  yoga: 'Jnana Karma Sanyasa Yoga',         short: 'Knowledge & Action',     verses: 42,  color: 'from-yellow-900/30' },
  { n: 5,  yoga: 'Karma Sanyasa Yoga',               short: 'Renunciation',           verses: 29,  color: 'from-lime-900/30' },
  { n: 6,  yoga: 'Dhyana Yoga',                      short: 'Meditation',             verses: 47,  color: 'from-green-900/30' },
  { n: 7,  yoga: 'Jnana Vijnana Yoga',               short: 'Knowledge & Wisdom',     verses: 30,  color: 'from-teal-900/30' },
  { n: 8,  yoga: 'Akshara Brahma Yoga',              short: 'The Eternal Absolute',   verses: 28,  color: 'from-cyan-900/30' },
  { n: 9,  yoga: 'Raja Vidya Yoga',                  short: 'Royal Knowledge',        verses: 34,  color: 'from-sky-900/30' },
  { n: 10, yoga: 'Vibhuti Yoga',                     short: 'Divine Manifestations',  verses: 42,  color: 'from-blue-900/30' },
  { n: 11, yoga: 'Vishwarupa Darshana Yoga',         short: 'Cosmic Form',            verses: 55,  color: 'from-indigo-900/30' },
  { n: 12, yoga: 'Bhakti Yoga',                      short: 'Path of Devotion',       verses: 20,  color: 'from-violet-900/30' },
  { n: 13, yoga: 'Kshetra Kshetrajna Vibhaga Yoga',  short: 'Field & Its Knower',    verses: 35,  color: 'from-purple-900/30' },
  { n: 14, yoga: 'Gunatraya Vibhaga Yoga',           short: 'Three Modes of Nature',  verses: 27,  color: 'from-fuchsia-900/30' },
  { n: 15, yoga: 'Purushottama Yoga',                short: 'The Supreme Person',     verses: 20,  color: 'from-pink-900/30' },
  { n: 16, yoga: 'Daivasura Sampad Vibhaga Yoga',   short: 'Divine & Demonic',       verses: 24,  color: 'from-rose-900/30' },
  { n: 17, yoga: 'Shraddhatraya Vibhaga Yoga',       short: 'Three Kinds of Faith',   verses: 28,  color: 'from-red-900/30' },
  { n: 18, yoga: 'Moksha Sanyasa Yoga',              short: 'Liberation',             verses: 78,  color: 'from-orange-900/30' },
]

function scrollToChat(question: string) {
  const el = document.getElementById('chat')
  if (el) el.scrollIntoView({ behavior: 'smooth' })
  window.dispatchEvent(new CustomEvent('madhav:prefill', { detail: { question } }))
}

export default function ChapterBrowser() {
  return (
    <section className="py-20 px-6" style={{ background: '#050A1E' }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-saffron/60 text-xs font-medium uppercase tracking-widest mb-3">
            18 Chapters · 700 Verses
          </p>
          <h2
            className="text-3xl md:text-4xl text-cream mb-3"
            style={{ fontFamily: 'Crimson Text, serif' }}
          >
            The Yogas of the Bhagavad Gita
          </h2>
          <p className="text-cream/50 text-sm max-w-md mx-auto">
            Each chapter is a complete yoga — a path. Click any chapter to ask Madhav about it.
          </p>
        </div>

        {/* Chapter grid */}
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
          {CHAPTERS.map((ch) => (
            <button
              key={ch.n}
              onClick={() =>
                scrollToChat(
                  `Tell me about Chapter ${ch.n} of the Bhagavad Gita — ${ch.yoga}`
                )
              }
              className={`group text-left rounded-xl p-4 border border-saffron/10
                          bg-gradient-to-br ${ch.color} to-transparent
                          hover:border-saffron/35 hover:to-white/[0.03]
                          transition-all duration-200`}
            >
              {/* Chapter number */}
              <div className="flex items-start justify-between mb-2">
                <span
                  className="text-saffron/40 text-3xl font-bold leading-none"
                  style={{ fontFamily: 'Crimson Text, serif' }}
                >
                  {ch.n}
                </span>
                <span className="text-cream/25 text-xs mt-1">{ch.verses} verses</span>
              </div>

              {/* Yoga name */}
              <p
                className="text-cream/90 text-sm font-semibold mb-0.5 group-hover:text-saffron transition-colors leading-snug"
                style={{ fontFamily: 'Crimson Text, serif' }}
              >
                {ch.yoga}
              </p>

              {/* Short description */}
              <p className="text-cream/40 text-xs">{ch.short}</p>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
