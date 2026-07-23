/**
 * Darshan Experience Engine — default configuration.
 *
 * This file is the *fallback* configuration: what the engine uses when no CMS
 * is wired up. It has exactly the shape of the `darshan_config` +
 * `avatar_forms` rows in `supabase/darshan-schema.sql`, so moving to
 * admin-editable content later is a swap of the loader, not a rewrite.
 *
 * ── On the nine forms ─────────────────────────────────────────────────────
 * The engine supports up to nine sacred forms/experience modes. Only ONE ships
 * active: `madhav_presence`, which — consistent with the app's existing safety
 * constraint and `MadhavLight` — depicts Madhav as luminous presence rather
 * than a face. The remaining slots are reserved, inactive, and deliberately
 * *undefined*: naming a form is a theological act, so each must be authored by
 * the founder and cleared by a reviewer (`reviewer_notes`) before
 * `active_status` is flipped. Nothing in the codebase asserts what they are.
 */
import type { AvatarForm, DarshanConfig } from './types'

/** The one form that ships. */
const MADHAV_PRESENCE: AvatarForm = {
  form_id: 'madhav_presence',
  display_name: 'Madhav',
  spiritual_theme: 'Presence',
  description:
    'Madhav as he is shown throughout the app — crowned with mor pankh, hand ' +
    'raised in teaching — brought alive with breath, parallax and an aura of ' +
    'light, with a translucent divine form rising behind him.',
  symbol: 'peacock_feather',
  // TODO(asset): drop a commissioned, licensed GLB at /models/madhav-presence.glb
  // and set this to '/models/madhav-presence.glb'. Until then the engine renders
  // the artwork below, animated, with a WebGL atmosphere behind it.
  // Register the asset in `sacred_assets` FIRST — the schema rejects models
  // without commercial_use_allowed + an approved cultural review.
  model_url: null,
  thumbnail_url: '/art/scene-2.png',
  animation_set_id: null,
  quote_theme: 'dharma',
  color_palette: {
    primary: '#F0B830', // soft saffron
    deep: '#12203F', // deep indigo
    accent: '#D4A017', // gold
    glow: '#8FD3D8', // peacock blue-green
  },
  entry_animation: 'light_bloom',
  active_status: true,
  reviewer_notes:
    'Approved. The artwork already ships across the app; the divine form behind ' +
    'him is a faceless silhouette, so nothing here claims to depict the deity. ' +
    'The footer disclaimer remains the binding statement.',
}

/**
 * The Vishwaroop / Cosmic Form. Present as a *scene*, not a homepage default —
 * it is only ever entered by explicit tap (see `config.vishwaroop`).
 */
const VISHWAROOP: AvatarForm = {
  form_id: 'vishwaroop_darshan',
  display_name: 'Cosmic Form',
  spiritual_theme: 'Vastness',
  description:
    'The Vishwaroop moment of Chapter 11 rendered as scale and light: an ' +
    'expanding mandala, layered silhouettes, a field of stars. Awe without ' +
    'horror — no multiplied faces, no violence, no spectacle.',
  symbol: 'cosmic_mandala',
  model_url: null,
  thumbnail_url: null,
  animation_set_id: null,
  quote_theme: 'courage',
  color_palette: {
    primary: '#6C63C4',
    deep: '#05081C',
    accent: '#D4A017',
    glow: '#BFB6FF',
  },
  entry_animation: 'mandala_open',
  active_status: true,
  reviewer_notes:
    'Approved as an abstract, non-figurative treatment. Must stay opt-in and ' +
    'time-bounded; must never become an ambient background.',
}

/**
 * Seven reserved slots. Intentionally unnamed — see the file header.
 * An admin fills these in via the CMS; the UI lists only `active_status: true`.
 */
const RESERVED_FORMS: AvatarForm[] = Array.from({ length: 7 }, (_, i) => ({
  form_id: `reserved_form_${i + 3}`,
  display_name: `Reserved Form ${i + 3}`,
  spiritual_theme: '',
  description:
    'Reserved slot. Define name, theme, description, symbol and palette in the ' +
    'CMS, attach a licensed model, record a cultural review, then activate.',
  symbol: 'lotus_mandala',
  model_url: null,
  thumbnail_url: null,
  animation_set_id: null,
  quote_theme: 'dharma',
  color_palette: {
    primary: '#F0B830',
    deep: '#12203F',
    accent: '#D4A017',
    glow: '#FFE9B0',
  },
  entry_animation: 'fade',
  active_status: false,
  reviewer_notes: 'AWAITING DEFINITION AND CULTURAL REVIEW — do not activate.',
}))

export const DEFAULT_DARSHAN_CONFIG: DarshanConfig = {
  enabled: true,
  hero: {
    // `auto`: the procedural 3D presence on capable devices, the existing
    // Kurukshetra artwork everywhere else. Set to 'static' to disable WebGL
    // entirely, or '3d' to force it (dev/QA only — it ignores device tiering).
    mode: 'auto',
    active_form_id: 'madhav_presence',
    // scene-1 is the closest thing to a portrait in the set — crown, mor pankh,
    // gentle expression, teaching gesture — so it frames best inside the arch.
    fallback_image: '/art/scene-1.png',
    fallback_image_alt:
      'Krishna — Madhav — crowned with a peacock feather, raising a hand in teaching, beside Arjuna at Kurukshetra',
    particles_enabled: true,
  },
  vishwaroop: {
    enabled: true,
    require_explicit_consent: true,
    // Bounded on purpose: a rare moment that ends on its own, so it can never
    // become an ambient drain or an overwhelming loop.
    max_duration_ms: 34_000,
    // Drop a rendered loop in here and it plays behind the real-time scene.
    // Absent → the real-time Dashavatar/Vishwaroop is the whole experience.
    video_url: null,
    video_poster: null,
  },
  chakra: {
    launch_enabled: true,
    idle_rpm: 3, // ~20s per revolution — barely perceptible
    processing_rpm: 16, // deliberate, never frantic
    trail_enabled: true,
  },
  quotes: {
    // A shloka needs to be *read* — Sanskrit, then transliteration, then the
    // meaning. Nine seconds was not enough time to finish one.
    rotate_ms: 18_000,
    themes: [], // empty = draw from every theme
    show_hindi: false,
  },
  transitions: {
    mor_pankh_on_first_load: true,
    mor_pankh_on_refresh: true,
    mor_pankh_feather_count: 3,
    mor_pankh_duration_ms: 1800,
    chakra_launch_enabled: true,
    chakra_launch_duration_ms: 7000, // matches WELCOME.doneMs in ChakraLaunch
    route_fade_ms: 320,
  },
  default_mood: 'dawn',
  forms: [MADHAV_PRESENCE, VISHWAROOP, ...RESERVED_FORMS],
}

/**
 * Resolve the configuration for this render.
 *
 * Today: the defaults above, optionally overridden by a partial passed in by
 * the caller (used by the debug panel and by tests).
 *
 * TODO(cms): fetch the `darshan_config` + `avatar_forms` rows from Supabase in
 * a Server Component and pass the result into `<DarshanProvider config={…}>`.
 * The loader must keep the same fail-open contract as the rest of the app: on
 * any error, return `DEFAULT_DARSHAN_CONFIG` rather than throwing. The engine
 * must never be able to break the page.
 */
export function resolveDarshanConfig(overrides?: DeepPartial<DarshanConfig>): DarshanConfig {
  if (!overrides) return DEFAULT_DARSHAN_CONFIG
  return mergeConfig(DEFAULT_DARSHAN_CONFIG, overrides)
}

export function findForm(config: DarshanConfig, formId: string): AvatarForm | undefined {
  return config.forms.find((f) => f.form_id === formId)
}

export function activeForms(config: DarshanConfig): AvatarForm[] {
  return config.forms.filter((f) => f.active_status)
}

/** The form the hero should render, falling back to the first active one. */
export function heroForm(config: DarshanConfig): AvatarForm {
  return (
    findForm(config, config.hero.active_form_id) ??
    activeForms(config)[0] ??
    MADHAV_PRESENCE
  )
}

// ── merge helpers ──────────────────────────────────────────────────────────

export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends Array<unknown> ? T[K] : T[K] extends object ? DeepPartial<T[K]> : T[K]
}

function mergeConfig<T>(base: T, patch: DeepPartial<T>): T {
  const out = { ...base } as T
  for (const key of Object.keys(patch) as (keyof T)[]) {
    const value = patch[key]
    if (value === undefined) continue
    const current = base[key]
    if (
      current &&
      typeof current === 'object' &&
      !Array.isArray(current) &&
      typeof value === 'object' &&
      !Array.isArray(value)
    ) {
      out[key] = mergeConfig(current, value as DeepPartial<T[keyof T]>)
    } else {
      out[key] = value as T[keyof T]
    }
  }
  return out
}
