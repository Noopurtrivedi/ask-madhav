/**
 * The eighteen chapters of the Gita. Safe to import in client components: it
 * holds no verse text, so the 701 verses stay out of the browser bundle.
 */

export interface Chapter {
  n: number
  yoga: string
  short: string
  verses: number
  summary: string
}

export const CHAPTERS: Chapter[] = [
  { n: 1, yoga: 'Arjun Vishad Yog', short: "Arjuna's Grief", verses: 47,
    summary: 'Seeing his own kin arrayed for war, Arjuna is overcome with grief and lets his bow slip from his hands. The Gita begins in a very human collapse of resolve.' },
  { n: 2, yoga: 'Sankhya Yog', short: 'Eternal Soul & Duty', verses: 72,
    summary: 'The core teaching opens: the soul is eternal and indestructible — grieve not for what cannot die. Act from steadiness, not from attachment to results.' },
  { n: 3, yoga: 'Karm Yog', short: 'Path of Action', verses: 43,
    summary: 'No one can remain actionless. Do your duty without clinging to its fruit; selfless action purifies the heart and sets it free.' },
  { n: 4, yoga: 'Jnan Karm Sanyas Yog', short: 'Knowledge & Action', verses: 42,
    summary: 'Knowledge crowns action. I take birth age after age to restore dharma; offer your actions as a sacrifice, and wisdom burns away their binding.' },
  { n: 5, yoga: 'Karm Sanyas Yog', short: 'Renunciation', verses: 29,
    summary: 'Renunciation and selfless action lead to the same peace. The wise act without ego, resting steadily in the Self.' },
  { n: 6, yoga: 'Dhyan Yog', short: 'Meditation', verses: 47,
    summary: 'The path of meditation: steady the restless mind through practice and detachment. Lift yourself by your own mind — it is both your friend and your foe.' },
  { n: 7, yoga: 'Jnan Vijnan Yog', short: 'Knowledge & Wisdom', verses: 30,
    summary: 'Knowledge of the Divine in its fullness. All that exists is strung upon Me like beads upon a single thread.' },
  { n: 8, yoga: 'Akshar Brahm Yog', short: 'The Eternal Absolute', verses: 28,
    summary: 'On the imperishable Absolute, death, and where the soul travels. Remember the Divine even at the final hour, and you shall reach it.' },
  { n: 9, yoga: 'Raj Vidya Yog', short: 'Royal Knowledge', verses: 34,
    summary: 'The royal secret is loving devotion. Whatever you offer with a sincere heart, I accept; my devoted ones are never lost.' },
  { n: 10, yoga: 'Vibhuti Yog', short: 'Divine Manifestations', verses: 42,
    summary: 'The infinite glories of the Divine. Wherever there is excellence, beauty, or power, know it to be a spark of Me.' },
  { n: 11, yoga: 'Vishwarup Darshan Yog', short: 'Cosmic Form', verses: 55,
    summary: 'Arjuna beholds the cosmic form — all worlds and time itself contained within the Divine. Awe, terror, and finally surrender.' },
  { n: 12, yoga: 'Bhakti Yog', short: 'Path of Devotion', verses: 20,
    summary: 'The path of devotion is the most accessible of all. Dear to Me is the one who is humble, compassionate, and even-minded in joy and sorrow.' },
  { n: 13, yoga: 'Kshetra Kshetragya Vibhag Yog', short: 'Field & Its Knower', verses: 35,
    summary: 'The field — body and nature — and its knower, the soul. Wisdom is to discern the changing from the changeless within you.' },
  { n: 14, yoga: 'Gunatray Vibhag Yog', short: 'Three Modes of Nature', verses: 27,
    summary: 'The three gunas — sattva, rajas, tamas — bind the soul to nature. Rise above them, and you taste freedom.' },
  { n: 15, yoga: 'Purushottam Yog', short: 'The Supreme Person', verses: 20,
    summary: 'The Supreme Person beyond the perishable and the imperishable. Cut the deep-rooted tree of worldly entanglement with the axe of detachment.' },
  { n: 16, yoga: 'Daivasur Sampad Vibhag Yog', short: 'Divine & Demonic', verses: 24,
    summary: 'The divine and the demonic natures that live within us. Cultivate fearlessness, truth, and compassion; shed greed, anger, and pride.' },
  { n: 17, yoga: 'Shraddhatray Vibhag Yog', short: 'Three Kinds of Faith', verses: 28,
    summary: 'Faith takes three forms according to temperament. Even your food, your giving, and your speech reveal which mode of nature rules you.' },
  { n: 18, yoga: 'Moksh Sanyas Yog', short: 'Liberation', verses: 78,
    summary: 'The grand summation: act, surrender the fruits, and take refuge in the Divine. "Abandon all dharmas and come to Me alone — do not fear."' },
]

export const VERSES_PER_PAGE = 10
export const pageCount = (verses: number) => Math.ceil(verses / VERSES_PER_PAGE)

/** A few source translations carry editors' notes and stray punctuation. */
export function cleanMeaning(text: string): string {
  return text
    .replace(/\s*\(टिप्पणी[^)]*\)/g, '')
    .replace(/^[\s.]+/, '')
    .trim()
}

/** How seekers feel, and the verse themes that speak to it. */
export const FEELINGS = [
  { id: 'anxious', label: 'Anxious', themes: ['anxiety', 'surrender'], prompt: 'When the mind will not settle' },
  { id: 'angry', label: 'Angry', themes: ['anger', 'self-mastery'], prompt: 'When anger is rising' },
  { id: 'grieving', label: 'Grieving', themes: ['grief', 'death and rebirth'], prompt: 'When loss is heavy' },
  { id: 'lost', label: 'Lost', themes: ['purpose', 'dharma'], prompt: 'When the way is unclear' },
  { id: 'guilty', label: 'Guilty', themes: ['guilt'], prompt: 'When the past will not let go' },
  { id: 'afraid', label: 'Afraid', themes: ['courage', 'divine protection'], prompt: 'When courage is needed' },
  { id: 'jealous', label: 'Jealous', themes: ['jealousy', 'equanimity'], prompt: 'When comparison hurts' },
  { id: 'stuck', label: 'Stuck in a habit', themes: ['addiction', 'mind'], prompt: 'When a habit has hold of you' },
  { id: 'overworked', label: 'Tired of results', themes: ['karma yoga', 'detachment'], prompt: 'When effort feels wasted' },
  { id: 'seeking', label: 'Seeking peace', themes: ['devotion', 'soul'], prompt: 'When you want to come home' },
] as const
