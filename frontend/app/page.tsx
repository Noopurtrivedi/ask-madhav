import Navbar from '@/components/Navbar'
import Hero from '@/components/Hero'
import DailyVerse from '@/components/DailyVerse'
import ChatInterface from '@/components/ChatInterface'
import StoryCards from '@/components/StoryCards'
import PopularVerses from '@/components/PopularVerses'
import ChapterBrowser from '@/components/ChapterBrowser'
import SubscribeRitual from '@/components/SubscribeRitual'

const STATS = [
  {
    number: '18',
    label: 'Yogas',
    desc: 'Each chapter a complete path — from Karma Yoga to Moksha Sanyasa Yoga',
  },
  {
    number: '700',
    label: 'Verses',
    desc: 'Every shloka a gem of wisdom applicable to daily life',
  },
  {
    number: '5000+',
    label: 'Years of Guidance',
    desc: 'Ancient wisdom that speaks directly to the modern human heart',
  },
]

export default function Home() {
  return (
    <main>
      <Navbar />
      <Hero />

      {/* Stats bar */}
      <section className="py-16 px-6" style={{ background: '#050A1E' }}>
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            {STATS.map((item) => (
              <div key={item.label} className="p-6">
                <p
                  className="text-5xl font-bold text-saffron mb-2"
                  style={{ fontFamily: 'Crimson Text, serif' }}
                >
                  {item.number}
                </p>
                <p className="text-cream font-medium mb-2">{item.label}</p>
                <p className="text-cream/50 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <DailyVerse />
      <ChatInterface />
      <PopularVerses />
      <ChapterBrowser />
      <StoryCards />
      <SubscribeRitual />

      {/* Footer */}
      <footer
        className="py-12 px-6 border-t border-saffron/10"
        style={{ background: '#050A1E' }}
      >
        <div className="max-w-4xl mx-auto text-center">
          <span className="text-3xl select-none">🪷</span>
          <p className="text-cream/60 mt-3 text-sm font-medium">
            Ask Madhav — Bhagavad Gita Guidance
          </p>

          {/* Gita Press attribution — the credibility line */}
          <p className="text-saffron/50 text-xs mt-3 font-medium">
            Sanskrit & Hindi Bhavartha: Swami Ramsukhdas,{' '}
            <span className="italic">Sadhak-Sanjivani</span>
            {' '}(Gita Press, Gorakhpur) · English: Swami Gambhirananda
          </p>

          <p className="text-cream/30 text-xs mt-4 max-w-lg mx-auto leading-relaxed">
            This application provides spiritual guidance inspired by the Bhagavad Gita.
            It is not a religious authority, does not represent the divine Krishna,
            and is not a substitute for medical, legal, or financial advice.
          </p>
          <p className="text-cream/20 text-xs mt-6">
            Built with reverence for timeless wisdom
          </p>
        </div>
      </footer>
    </main>
  )
}
