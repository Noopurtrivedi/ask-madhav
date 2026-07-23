/**
 * Generates frontend/data/quotes.json — the seed for the Gita Quote Reflection
 * system (and for the `gita_quotes` CMS table).
 *
 * Sanskrit / transliteration / Hindi are taken VERBATIM from data/verses.json
 * (the app's own dataset) so nothing is re-sourced from the web. Only the
 * `english_meaning` is curated here: a plain, simple-language rendering meant
 * to be read on a hero, not a scholarly translation.
 *
 * Run:  node scripts/gen_quotes.js
 */
const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const verses = require(path.join(ROOT, 'data/verses.json'))
const byRef = new Map(verses.map((v) => [v.reference, v]))

/**
 * data/verses.json is transliterated inconsistently: the 30 hand-curated verses
 * carry plain-ASCII transliteration while the scraped majority carry proper
 * IAST. The quote module is the app's most typographically prominent surface,
 * so we normalise to IAST here rather than ship mixed diacritics on the hero.
 * (Fixing the upstream dataset is tracked in docs/DARSHAN.md.)
 */
const IAST_OVERRIDES = {
  '4.7':
    'yadā yadā hi dharmasya glānir bhavati bhārata, abhyutthānam adharmasya tadātmānaṃ sṛjāmy aham',
  '2.47':
    'karmaṇy evādhikāras te mā phaleṣu kadācana, mā karma-phala-hetur bhūr mā te saṅgo ’stv akarmaṇi',
  '2.20':
    'na jāyate mriyate vā kadācin nāyaṃ bhūtvā bhavitā vā na bhūyaḥ, ajo nityaḥ śāśvato ’yaṃ purāṇo na hanyate hanyamāne śarīre',
  '6.5':
    'uddhared ātmanātmānaṃ nātmānam avasādayet, ātmaiva hy ātmano bandhur ātmaiva ripur ātmanaḥ',
  '2.14':
    'mātrā-sparśās tu kaunteya śītoṣṇa-sukha-duḥkha-dāḥ, āgamāpāyino ’nityās tāṃs titikṣasva bhārata',
  '5.10':
    'brahmaṇy ādhāya karmāṇi saṅgaṃ tyaktvā karoti yaḥ, lipyate na sa pāpena padma-patram ivāmbhasā',
  '12.15':
    'yasmān nodvijate loko lokān nodvijate ca yaḥ, harṣāmarṣa-bhayodvegair mukto yaḥ sa ca me priyaḥ',
  '18.66':
    'sarva-dharmān parityajya mām ekaṃ śaraṇaṃ vraja, ahaṃ tvāṃ sarva-pāpebhyo mokṣayiṣyāmi mā śucaḥ',
  '4.38':
    'na hi jñānena sadṛśaṃ pavitram iha vidyate, tat svayaṃ yoga-saṃsiddhaḥ kālenātmani vindati',
}

// reference, theme, mood, simple English meaning, display_priority
const CURATED = [
  {
    ref: '4.7',
    theme: 'dharma',
    mood: 'dawn',
    english:
      'Whenever dharma fades and wrongdoing rises, I make Myself known again.',
    priority: 100,
  },
  {
    ref: '2.47',
    theme: 'karma',
    mood: 'ember',
    english:
      'Your right is to the work itself, never to its fruit. Act — but not for the reward.',
    priority: 98,
  },
  {
    ref: '2.48',
    theme: 'detachment',
    mood: 'river',
    english:
      'Steady yourself, then act. Let go of clinging. Be the same in success and failure — that evenness is yoga.',
    priority: 95,
  },
  {
    ref: '2.20',
    theme: 'courage',
    mood: 'cosmos',
    english:
      'You were never born and you will never die. What you truly are is untouched when the body falls.',
    priority: 93,
  },
  {
    ref: '6.5',
    theme: 'mind',
    mood: 'lamp',
    english:
      'Lift yourself by your own self; never let yourself sink. Your mind is your closest friend — and your only enemy.',
    priority: 92,
  },
  {
    ref: '2.14',
    theme: 'peace',
    mood: 'stillness',
    english:
      'Pleasure and pain come and go like winter and summer. They arrive, they pass. Learn to sit through them.',
    priority: 90,
  },
  {
    ref: '2.70',
    theme: 'peace',
    mood: 'river',
    english:
      'Peace comes to the one who lets desires enter and pass as rivers enter the sea — and the sea stays the sea.',
    priority: 88,
  },
  {
    ref: '6.19',
    theme: 'discipline',
    mood: 'lamp',
    english:
      'A lamp in a windless place does not flicker. So is the mind of one who has learned to gather itself.',
    priority: 86,
  },
  {
    ref: '5.10',
    theme: 'detachment',
    mood: 'bloom',
    english:
      'Do your work, offer the outcome, hold nothing — and stay unstained, as a lotus leaf stays dry in water.',
    priority: 84,
  },
  {
    ref: '3.35',
    theme: 'dharma',
    mood: 'dawn',
    english:
      'Your own path, walked imperfectly, is better than another’s path walked well. Live your own truth.',
    priority: 82,
  },
  {
    ref: '12.15',
    theme: 'devotion',
    mood: 'bloom',
    english:
      'The one who troubles no one and is troubled by no one — free of thrill, anger, fear and unrest — is dear to Me.',
    priority: 80,
  },
  {
    ref: '18.66',
    theme: 'devotion',
    mood: 'cosmos',
    english:
      'Set down every burden and simply come to Me. I will carry you through. Do not grieve.',
    priority: 78,
  },
  {
    // The Vishwaroop verse. Surfaced by components/darshan/VishwaroopDarshan.tsx —
    // if you remove it, that reveal loses its text.
    ref: '11.12',
    theme: 'clarity',
    mood: 'cosmos',
    english:
      'If a thousand suns rose in the sky at once, their light might come close to the radiance of that vastness.',
    priority: 77,
  },
  {
    ref: '4.38',
    theme: 'clarity',
    mood: 'cosmos',
    english:
      'Nothing in this world purifies like true understanding. In time, the steady seeker finds it within.',
    priority: 76,
  },
]

const quotes = CURATED.map((c, i) => {
  const v = byRef.get(c.ref)
  if (!v) throw new Error(`Missing verse ${c.ref} in data/verses.json`)
  return {
    id: `gq_${c.ref.replace('.', '_')}`,
    chapter: v.chapter_number,
    verse: v.verse_number,
    reference: v.reference,
    sanskrit: v.sanskrit_text,
    transliteration: IAST_OVERRIDES[c.ref] || v.transliteration,
    english_meaning: c.english,
    hindi_meaning: v.hindi_meaning,
    theme: c.theme,
    mood: c.mood,
    display_priority: c.priority,
    active_status: true,
    reviewer_notes: '',
  }
})

const out = {
  __generated_by: 'scripts/gen_quotes.js — see docs/DARSHAN.md',
  __note:
    'Sanskrit/transliteration/Hindi copied verbatim from data/verses.json. english_meaning is a curated simple-language rendering for display, not a scholarly translation. Seed for the gita_quotes CMS table.',
  quotes,
}

fs.writeFileSync(
  path.join(ROOT, 'data/quotes.json'),
  JSON.stringify(out, null, 2) + '\n'
)
console.log(`wrote ${quotes.length} quotes`)
