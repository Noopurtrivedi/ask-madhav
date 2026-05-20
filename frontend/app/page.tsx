import Navbar from '@/components/Navbar'
import Hero from '@/components/Hero'
import DailyVerse from '@/components/DailyVerse'
import ChatInterface from '@/components/ChatInterface'
import StoryCards from '@/components/StoryCards'
import PopularVerses from '@/components/PopularVerses'
import ChapterBrowser from '@/components/ChapterBrowser'
import SubscribeRitual from '@/components/SubscribeRitual'
import ScrollReveal from '@/components/ScrollReveal'

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
      <ScrollReveal />
      <Navbar />
      <Hero />

      {/* Stats bar */}
      <section className="py-16 px-6" style={{ background: '#F3E7CD' }} data-reveal>
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
                <p className="text-ink font-medium mb-2">{item.label}</p>
                <p className="text-ink/50 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div data-reveal><DailyVerse /></div>
      <div data-reveal><ChatInterface /></div>
      <div data-reveal><PopularVerses /></div>
      <div data-reveal><ChapterBrowser /></div>
      <div data-reveal><StoryCards /></div>
      <div data-reveal><SubscribeRitual /></div>

      {/* Footer */}
      <footer
        className="py-12 px-6 border-t border-saffron/10"
        style={{ background: '#F3E7CD' }}
      >
        <div className="max-w-4xl mx-auto text-center">
          <span className="text-3xl select-none">🪷</span>
          <p className="text-ink/60 mt-3 text-sm font-medium">
            Ask Madhav — Bhagavad Gita Guidance
          </p>

          {/* Gita Press attribution — the credibility line */}
          <p className="text-ink/55 text-xs mt-3 font-medium">
            Sanskrit & Hindi Bhavartha: Swami Ramsukhdas,{' '}
            <span className="italic">Sadhak-Sanjivani</span>
            {' '}(Gita Press, Gorakhpur) · English: Swami Gambhirananda
          </p>

          <p className="text-ink/30 text-xs mt-4 max-w-lg mx-auto leading-relaxed">
            This application provides spiritual guidance inspired by the Bhagavad Gita.
            It is not a religious authority, does not represent the divine Krishna,
            and is not a substitute for medical, legal, or financial advice.
          </p>
          <p className="text-ink/20 text-xs mt-6">
            Built with reverence for timeless wisdom
          </p>
        </div>
      </footer>
    </main>
  )
}
