/**
 * Darshan Experience Engine — the registries.
 *
 * Visual moods, quote categories and sacred symbols. These are the vocabulary
 * the rest of the engine speaks in: a quote declares a `mood`, a mood declares
 * a palette and a background symbol, and every layer (aura, particles, quote
 * card, 3D rim light) derives its colour from that one declaration. Change a
 * mood here and the entire scene re-tunes coherently.
 *
 * Palettes are drawn from the app's existing sacred range — peacock blue, deep
 * indigo, gold, soft saffron — so the 3D layers sit inside the same identity as
 * the 2D pages rather than beside it.
 */
import type {
  QuoteCategory,
  QuoteTheme,
  SacredSymbolId,
  VisualMood,
  VisualMoodId,
} from './types'

export const VISUAL_MOODS: Record<VisualMoodId, VisualMood> = {
  dawn: {
    id: 'dawn',
    display_name: 'Dawn',
    palette: { primary: '#F0B830', deep: '#3A2A18', accent: '#E8A620', glow: '#FFE9B0' },
    background_symbol: 'sun_rays',
    particle_density: 0.6,
  },
  stillness: {
    id: 'stillness',
    display_name: 'Stillness',
    palette: { primary: '#8FB8C9', deep: '#1B2A38', accent: '#D4A017', glow: '#E6F1F6' },
    background_symbol: 'still_water',
    particle_density: 0.25,
  },
  ember: {
    id: 'ember',
    display_name: 'Ember',
    palette: { primary: '#E8A620', deep: '#2A1608', accent: '#F6D27A', glow: '#FFD27A' },
    background_symbol: 'lamp_flame',
    particle_density: 0.7,
  },
  cosmos: {
    id: 'cosmos',
    display_name: 'Cosmos',
    palette: { primary: '#6C63C4', deep: '#0A0F2E', accent: '#D4A017', glow: '#BFB6FF' },
    background_symbol: 'cosmic_mandala',
    particle_density: 1,
  },
  river: {
    id: 'river',
    display_name: 'River',
    palette: { primary: '#2F8F6B', deep: '#10322B', accent: '#E8A620', glow: '#BFE8D6' },
    background_symbol: 'still_water',
    particle_density: 0.4,
  },
  lamp: {
    id: 'lamp',
    display_name: 'Lamp',
    palette: { primary: '#D4A017', deep: '#241A0C', accent: '#FFE9B0', glow: '#FFDD9E' },
    background_symbol: 'lamp_flame',
    particle_density: 0.35,
  },
  bloom: {
    id: 'bloom',
    display_name: 'Bloom',
    palette: { primary: '#D98CA6', deep: '#2E1626', accent: '#E8A620', glow: '#FFD9E4' },
    background_symbol: 'lotus_mandala',
    particle_density: 0.5,
  },
}

export const QUOTE_CATEGORIES: Record<QuoteTheme, QuoteCategory> = {
  karma: {
    id: 'karma',
    display_name: 'Karma — Action',
    description: 'Doing the work that is yours to do, and letting the fruit go.',
    default_mood: 'ember',
  },
  dharma: {
    id: 'dharma',
    display_name: 'Dharma — Right Path',
    description: 'Knowing your own way and walking it, imperfectly, honestly.',
    default_mood: 'dawn',
  },
  detachment: {
    id: 'detachment',
    display_name: 'Vairagya — Detachment',
    description: 'Holding without gripping. Present, unstained.',
    default_mood: 'river',
  },
  devotion: {
    id: 'devotion',
    display_name: 'Bhakti — Devotion',
    description: 'Love as a way of knowing; surrender as a way of resting.',
    default_mood: 'bloom',
  },
  mind: {
    id: 'mind',
    display_name: 'Manas — The Mind',
    description: 'The mind as friend and adversary; the work of turning it.',
    default_mood: 'lamp',
  },
  discipline: {
    id: 'discipline',
    display_name: 'Abhyasa — Discipline',
    description: 'Steadiness practised daily until it becomes nature.',
    default_mood: 'lamp',
  },
  peace: {
    id: 'peace',
    display_name: 'Shanti — Peace',
    description: 'What remains when the wanting stops arguing.',
    default_mood: 'stillness',
  },
  courage: {
    id: 'courage',
    display_name: 'Dhairya — Courage',
    description: 'Standing in what is, because what you are cannot be destroyed.',
    default_mood: 'cosmos',
  },
  clarity: {
    id: 'clarity',
    display_name: 'Jnana — Clarity',
    description: 'Seeing plainly, without the story laid over the top.',
    default_mood: 'cosmos',
  },
}

/**
 * Sacred symbols available as background motifs. Each id maps to a *vector*
 * component in `components/darshan/SacredSymbols.tsx` — deliberately not to an
 * image file, so nothing here can be an unlicensed download.
 */
export const SYMBOL_REGISTRY: Record<SacredSymbolId, { display_name: string; note: string }> = {
  sun_rays: { display_name: 'Sun Rays', note: 'Radiance; the dawn of understanding.' },
  lotus_mandala: { display_name: 'Lotus Mandala', note: 'Unfolding; unstained growth.' },
  peacock_feather: { display_name: 'Mor Pankh', note: "Krishna's emblem; lightness, grace." },
  sudarshan_chakra: { display_name: 'Sudarshan Chakra', note: 'Discernment; the turning of truth.' },
  still_water: { display_name: 'Still Water', note: 'The sea that rivers cannot disturb (2.70).' },
  lamp_flame: { display_name: 'Lamp Flame', note: 'The unflickering lamp in a windless place (6.19).' },
  cosmic_mandala: { display_name: 'Cosmic Mandala', note: 'Vastness; the form beyond form.' },
}

export function moodOf(id: VisualMoodId | undefined): VisualMood {
  return (id && VISUAL_MOODS[id]) || VISUAL_MOODS.dawn
}

export function moodForTheme(theme: QuoteTheme): VisualMood {
  return moodOf(QUOTE_CATEGORIES[theme]?.default_mood)
}

export const ALL_QUOTE_THEMES = Object.keys(QUOTE_CATEGORIES) as QuoteTheme[]
