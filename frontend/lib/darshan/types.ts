/**
 * Darshan Experience Engine — shared types.
 *
 * These interfaces are the contract between three layers:
 *   1. the CMS/database (see `supabase/darshan-schema.sql` — the table columns
 *      are 1:1 with the fields here),
 *   2. the local default configuration (`lib/darshan/config.ts`), which is what
 *      ships today and what the app falls back to when no CMS is configured,
 *   3. the React runtime (`components/darshan/*`).
 *
 * Anything the founder/admin must be able to change WITHOUT a code deploy lives
 * here as data — never as a hardcoded literal inside a component. That is the
 * whole point of the engine: sacred forms, quotes, palettes and motion budgets
 * are content, and content is reviewable.
 */

// ── Motion / capability tiers ──────────────────────────────────────────────

/**
 * How much motion this visitor's device + preferences can carry.
 *  - `full`  — WebGL 3D scenes, particles, the whole darshan.
 *  - `lite`  — CSS/SVG only. No WebGL. Fewer particles, shorter transitions.
 *  - `still` — essentially static: reduced-motion, text-only, or a device we
 *              refuse to punish. Every animation degrades to a fade or nothing.
 */
export type MotionTier = 'full' | 'lite' | 'still'

/** What the seeker themselves asked for, persisted across visits. */
export type MotionPreference = 'auto' | 'full' | 'reduced' | 'text-only'

export interface DeviceCapability {
  tier: MotionTier
  prefersReducedMotion: boolean
  webglAvailable: boolean
  /** navigator.deviceMemory, when the browser reports it. */
  deviceMemoryGb: number | null
  hardwareConcurrency: number | null
  /** Data Saver is on — treat like a slow connection. */
  saveData: boolean
  coarsePointer: boolean
  /** Why we landed on this tier — surfaced in the debug panel. */
  reason: string
}

// ── Engine states ──────────────────────────────────────────────────────────

/**
 * The engine's finite states. Every visual subsystem (avatar, chakra, aura,
 * particles, quote) reads the current state and decides how to behave; nothing
 * animates on its own schedule.
 */
export type DarshanState =
  /** First paint. Nothing is ready; the chakra is centre-stage. */
  | 'loading'
  /** The chakra has flown to the logo; the scene is materialising. */
  | 'entering'
  /** The resting state. Breathing, drifting, quiet. */
  | 'idle'
  /** A Gita quote is being revealed and held. */
  | 'quote_reveal'
  /** A question was asked; Madhav is listening/considering. */
  | 'thinking'
  /** The answer is arriving — the aura opens slightly. */
  | 'answering'
  /** A closing/benedictory beat after a deep answer. */
  | 'blessing'
  /** Generic processing (any async work) — drives the chakra loader. */
  | 'chakra_processing'
  /** The rare cosmic-form reveal. */
  | 'vishwaroop_reveal'
  /** Route change in flight. */
  | 'page_transition'
  /** Something failed. The engine calms down; it never flashes. */
  | 'error'
  /** Terminal accessibility state: motion is off by preference. */
  | 'reduced_motion'

/** Per-state motion description the visual layers read. */
export interface DarshanStateProfile {
  id: DarshanState
  /** 0..1 — how energetic the scene may be in this state. */
  intensity: number
  /** Breathing / rotation period multiplier. >1 = slower = calmer. */
  tempo: number
  /** Auto-advance to this state after `holdMs`, when set. */
  next?: DarshanState
  holdMs?: number
  /** Human description — shown in the debug panel and the docs. */
  description: string
}

// ── Sacred assets (CMS: `sacred_assets`) ───────────────────────────────────

export type SacredAssetType =
  | 'avatar_model'
  | 'symbol'
  | 'texture'
  | 'environment'
  | 'lottie'
  | 'rive'
  | 'audio'
  | 'image'

export type CulturalReviewStatus = 'pending' | 'approved' | 'rejected' | 'not_required'

/**
 * Every third-party or commissioned asset MUST have one of these before it can
 * be referenced by a form. `commercial_use_allowed` and `cultural_review_status`
 * are load-bearing: `resolveAsset()` refuses to hand back an asset that has not
 * cleared both. See docs/DARSHAN.md § Asset licensing.
 */
export interface SacredAsset {
  id: string
  asset_name: string
  asset_type: SacredAssetType
  model_url: string | null
  thumbnail_url: string | null
  file_format: string | null
  license_source: string
  commercial_use_allowed: boolean
  modification_allowed: boolean
  ai_usage_allowed: boolean
  cultural_review_status: CulturalReviewStatus
  notes: string
  created_at?: string
  updated_at?: string
}

// ── Avatar forms (CMS: `avatar_forms`) ─────────────────────────────────────

export type EntryAnimation = 'light_bloom' | 'mist_rise' | 'mandala_open' | 'fade' | 'none'

export interface ColorPalette {
  /** Primary luminance — the aura core. */
  primary: string
  /** Deep field colour — the space the form stands in. */
  deep: string
  /** Accent — trim, rim light, chakra gold. */
  accent: string
  /** Soft secondary glow. */
  glow: string
}

/**
 * One of the (up to nine) sacred forms/experience modes.
 *
 * IMPORTANT — this is deliberately data, not code. No form's name, description
 * or theology is hardcoded anywhere in the components. The founder/reviewer
 * defines each form in the CMS and marks `active_status` only after
 * `reviewer_notes` records a cultural/spiritual accuracy review.
 */
export interface AvatarForm {
  form_id: string
  display_name: string
  spiritual_theme: string
  description: string
  /** Key into SYMBOL_REGISTRY — the vector motif drawn behind this form. */
  symbol: SacredSymbolId
  /** GLB/glTF URL. `null` → the procedural placeholder presence is used. */
  model_url: string | null
  thumbnail_url: string | null
  animation_set_id: string | null
  /** Which quote theme this form draws its reflections from. */
  quote_theme: QuoteTheme
  color_palette: ColorPalette
  entry_animation: EntryAnimation
  active_status: boolean
  reviewer_notes: string
}

// ── Quotes (CMS: `gita_quotes`, `quote_categories`, `visual_moods`) ────────

export type QuoteTheme =
  | 'karma'
  | 'dharma'
  | 'detachment'
  | 'devotion'
  | 'mind'
  | 'discipline'
  | 'peace'
  | 'courage'
  | 'clarity'

export type VisualMoodId = 'dawn' | 'stillness' | 'ember' | 'cosmos' | 'river' | 'lamp' | 'bloom'

export type SacredSymbolId =
  | 'sun_rays'
  | 'lotus_mandala'
  | 'peacock_feather'
  | 'sudarshan_chakra'
  | 'still_water'
  | 'lamp_flame'
  | 'cosmic_mandala'

/** A visual mood maps a quote's feeling to colour + background symbol. */
export interface VisualMood {
  id: VisualMoodId
  display_name: string
  palette: ColorPalette
  background_symbol: SacredSymbolId
  /** 0..1 — how much ambient particle activity this mood invites. */
  particle_density: number
}

export interface QuoteCategory {
  id: QuoteTheme
  display_name: string
  description: string
  default_mood: VisualMoodId
}

export interface GitaQuote {
  id: string
  chapter: number
  verse: number
  /** "2.47" — matches `Verse.reference` in the main dataset. */
  reference: string
  sanskrit: string
  transliteration: string
  /** Simple, plain-language English. Not a scholarly translation. */
  english_meaning: string
  hindi_meaning?: string
  theme: QuoteTheme
  mood: VisualMoodId
  display_priority: number
  active_status: boolean
  reviewer_notes?: string
  /** Optional recitation audio. Never autoplays. */
  audio_url?: string | null
  created_at?: string
  updated_at?: string
}

// ── Page transitions (CMS: `page_transition_settings`) ─────────────────────

export interface PageTransitionSettings {
  /** Mor pankh drift on first load of a session. */
  mor_pankh_on_first_load: boolean
  /** …and on a hard refresh. Deliberately NOT on every soft navigation. */
  mor_pankh_on_refresh: boolean
  mor_pankh_feather_count: number
  mor_pankh_duration_ms: number
  /** Chakra launch: centre → logo. Once per session. */
  chakra_launch_enabled: boolean
  chakra_launch_duration_ms: number
  /** Cross-fade duration for soft route changes. */
  route_fade_ms: number
}

// ── Engine configuration (the root object an admin edits) ──────────────────

export type HeroMode = '3d' | 'static' | 'auto'

export interface DarshanConfig {
  /** Master switch. `false` → the app renders exactly as it did pre-engine. */
  enabled: boolean
  hero: {
    /** `auto` = 3D on capable devices, static art everywhere else. */
    mode: HeroMode
    /** The form rendered in the hero. Must exist in `forms`. */
    active_form_id: string
    /** Static image shown for `lite`/`still` tiers and as the 3D poster. */
    fallback_image: string
    fallback_image_alt: string
    /** Ambient light motes behind the stage. */
    particles_enabled: boolean
  }
  vishwaroop: {
    /** Off by default — it is a rare, opt-in moment, never the homepage state. */
    enabled: boolean
    /** Require an explicit tap; never trigger on scroll. */
    require_explicit_consent: boolean
    max_duration_ms: number
    /**
     * Optional cinematic loop (WebM, MP4 fallback). When set, it plays *behind*
     * the real-time layer instead of replacing it, so the Dashavatar, the verse
     * and the reduced-motion path all keep working. Always muted — the app
     * never autoplays audio.
     * TODO(asset): render from Blender, ≤6MB, ≤20s, seamless loop.
     */
    video_url?: string | null
    /** First frame, shown while the video buffers and under reduced motion. */
    video_poster?: string | null
  }
  chakra: {
    launch_enabled: boolean
    /** Degrees per second at rest. Kept slow on purpose. */
    idle_rpm: number
    processing_rpm: number
    /** Particle trail during launch/major transitions only. */
    trail_enabled: boolean
  }
  quotes: {
    /** Seconds a quote is held before the next cross-fade. 0 = no rotation. */
    rotate_ms: number
    /** Restrict the hero rotation to these themes. Empty = all. */
    themes: QuoteTheme[]
    show_hindi: boolean
  }
  transitions: PageTransitionSettings
  /** Default mood when a quote or form does not specify one. */
  default_mood: VisualMoodId
  forms: AvatarForm[]
}

// ── Runtime (`user_motion_preferences`) ────────────────────────────────────

export interface UserMotionPreferences {
  preference: MotionPreference
  /** Seeker explicitly asked for no ambient audio (we never autoplay anyway). */
  mute_ambient: boolean
  updated_at: string
}
