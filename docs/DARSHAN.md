# The Darshan Experience Engine

How Ask Madhav's visual identity is built, and how to extend it without breaking
the things that must not break.

> **The principle everything below serves:** wisdom entering through beauty. The
> animation supports devotion, clarity and understanding. The moment it competes
> with them, it is wrong — however impressive it looks.

---

## 1. What the engine is

A small state machine plus a device-capability probe, wrapped around every page.
Visual subsystems — the chakra, the aura, the 3D presence, the quote card, the
particles — do not run on their own schedules. They read the engine's current
state and render accordingly. That single fact is what keeps the motion coherent:
when the engine is calm, *everything* is calm, at once.

```
lib/darshan/
  types.ts      shared types; 1:1 with the CMS tables
  states.ts     the 12 states, the transition table, the tuning profiles
  tier.ts       device + preference → motion tier (full / lite / still)
  registry.ts   visual moods, quote categories, sacred symbols
  config.ts     DarshanConfig defaults + the nine-form architecture
  quotes.ts     the Gita quote source (reads data/quotes.json)
  events.ts     the window event bus — `darshan.thinking()` etc.

components/darshan/
  DarshanProvider.tsx   the runtime; owns state, tier, config, active quote
  MadhavPresence.tsx    picks 3D vs static artwork for the hero window
  three/…               the lazily-imported WebGL scenes
  QuoteReflection.tsx   the Gita Quote Reflection module
  SudarshanChakra.tsx   the brand mark (pure SVG, its own easing)
  EngineChakra.tsx      that mark, bound to engine state; + ChakraLoader
  ChakraLaunch.tsx      the once-per-session arrival ritual
  MorPankh.tsx          the peacock-feather drift
  CosmicBackdrop.tsx    the sky
  VishwaroopDarshan.tsx the opt-in Cosmic Form
  SacredSymbols.tsx     vector motifs a mood can call for
  MotionPreferenceToggle.tsx  the seeker's own motion control
  DarshanDebugPanel.tsx `?darshan=debug` — drive all 12 states by hand
```

### The twelve states

| State | What it means | Auto-advances |
|---|---|---|
| `loading` | First paint. The chakra holds the centre. | — |
| `entering` | The chakra landed in the logo; the scene blooms. | → `idle` (2.2s) |
| `idle` | Rest. Breathing, drifting, undemanding. | — |
| `quote_reveal` | A shloka surfaces; the scene quietens to be read. | → `idle` (2.6s) |
| `thinking` | A question was asked. Inward, unhurried. | — |
| `answering` | The answer arrives; the aura opens. | → `idle` (2.8s) |
| `blessing` | A benedictory beat after a grounded answer. | → `idle` (3.2s) |
| `chakra_processing` | Generic async work. Only the chakra moves. | — |
| `vishwaroop_reveal` | The Cosmic Form. Rare, consented, bounded. | — |
| `page_transition` | A route change. A soft cross-fade. | → `idle` (0.7s) |
| `error` | Something failed. Slower and dimmer — never a flash. | → `idle` (2.6s) |
| `reduced_motion` | Motion is off by preference. **Terminal.** | — |

Two rules make this safe:

1. **Every transition is explicit.** `TRANSITIONS` in `states.ts` lists the legal
   edges. An illegal request is *ignored*, not thrown — a mis-wired component can
   never take a page down. (This is why `blessing` is only reachable from
   `answering`: see how `ChatInterface` emits both in order.)
2. **`reduced_motion` is terminal.** Only an explicit preference change escapes
   it. An accessibility choice that a stray transition could override is not a
   choice.

### Driving the engine

From anywhere, without importing the provider or threading props:

```ts
import { darshan } from '@/lib/darshan/events'

darshan.thinking('chat')     // question in flight
darshan.answering('chat')    // answer arriving
darshan.blessing('chat')     // deeper moment; only legal after `answering`
darshan.error('chat')        // failed; the scene calms
darshan.quote('2.47')        // reveal a specific shloka
```

This mirrors the app's existing `madhav:prefill` / `madhav:voice` idiom. It is
also why `ChatInterface` (687 lines) gained four lines rather than a refactor.

Inside a component that needs to *read* the engine:

```tsx
const engine = useDarshanOptional()   // null outside a provider — handle it
const engine = useDarshan()           // throws; use only where a provider is certain
```

`useDarshanOptional` returning `null` is not an error state. It means the engine
is off for that subtree, and the component should render its static form.

---

## 2. Motion tiers, and why the 3D is not always there

`lib/darshan/tier.ts` resolves one of three tiers, in this order of precedence:

1. the seeker's explicit choice (`MotionPreferenceToggle`, persisted),
2. `prefers-reduced-motion`,
3. Data Saver, `deviceMemory ≤ 4GB`, `hardwareConcurrency ≤ 4`, 2G, no WebGL,
4. otherwise `full`.

| Tier | What runs |
|---|---|
| `full` | WebGL scenes, particles, the whole darshan. |
| `lite` | CSS/SVG only. No WebGL downloaded at all. |
| `still` | Static. Reduced motion or text-only. |

**The 3D bundle is behind a dynamic import that is only reached at `full` tier.**
Verified against the production build: three.js lands in an 874KB chunk that is
*not* in the home page's initial JS. A phone on Data Saver never fetches it.

The probe runs in an effect, never during render, so the server and the first
client paint agree (`SERVER_CAPABILITY` = `lite`, no WebGL). The 3D layer
therefore always mounts *after* hydration. That is deliberate, not a bug.

---

## 3. Adding things

### A new quote

Edit `frontend/scripts/gen_quotes.js` — add a `{ ref, theme, mood, english,
priority }` entry — then:

```bash
cd frontend && node scripts/gen_quotes.js
```

Sanskrit, transliteration and Hindi are copied verbatim from `data/verses.json`,
so they cannot drift from the corpus. Only `english_meaning` is authored, and it
is deliberately plain-language rather than scholarly — which is exactly why
`reviewer_notes` exists on the table. A new quote appears in the hero rotation
immediately, styled by its mood.

> **Known corpus issue:** `data/verses.json` transliterates inconsistently — the
> 30 hand-curated verses use plain ASCII (`yada yada hi dharmasya`) while scraped
> verses use proper IAST (`yogasthaḥ kuru karmāṇi`). `gen_quotes.js` carries an
> `IAST_OVERRIDES` map for the quotes it uses. Fixing this upstream in
> `build_verses.py` would let the overrides go away.

### A new visual mood

Add it to `VISUAL_MOODS` in `lib/darshan/registry.ts` and to the seed in
`supabase/darshan-schema.sql`. A mood is a palette plus a background symbol plus
a particle density; everything that reads a quote picks its colours up from
there, so nothing else needs editing.

### A new sacred symbol

Draw it in `components/darshan/SacredSymbols.tsx` and add the id to
`SacredSymbolId` + `SYMBOL_REGISTRY`. **Symbols are drawn in code, never loaded
from a URL.** That is not a style preference — it is the licensing guarantee. A
mood physically cannot reference downloaded deity artwork, because the only
thing it can reference is a path in that file.

### A new animation state

Add it to `DarshanState`, give it a profile in `DARSHAN_STATES`, and — this is
the part that is easy to forget — add its legal edges to `TRANSITIONS` **in both
directions**. A state with no inbound edge is unreachable; the debug panel's
forced transitions will still get you there, which is how you notice.

---

## 4. The nine forms

The engine supports up to nine sacred forms. **One ships active**
(`madhav_presence`), plus `vishwaroop_darshan` as a scene. Seven slots are
reserved, inactive, and deliberately *unnamed*.

That is not laziness. Naming a sacred form is a theological act, and the codebase
asserts nothing about what these are. Each must be authored by the founder and
cleared by a reviewer before `active_status` is flipped — the database enforces
it (`avatar_forms_reviewed_before_active` requires `reviewed_by`, `reviewed_at`
*and* non-empty `reviewer_notes`).

To define one: fill in the row, attach a licensed model (§5), record a review in
`spiritual_content_review_notes`, then activate. No deploy required.

### Why Madhav has no face

`MadhavLight` established it and the 3D scene continues it: Madhav is rendered as
*light, not likeness* — "the light of all lights, beyond all darkness" (13.17).
A face invites idol-dependency, which the app's safety constraint forbids, and it
would imply the app represents the divine Krishna, which it explicitly does not.

The hero's 3D presence is therefore a luminous standing form, an aura, a crown
ring and a drift of light motes — peacock blue, deep indigo, gold and soft
saffron, as briefed, expressed as light rather than as a person. **Every vertex
is generated in code**, so there is nothing in it that could be unlicensed.

---

## 5. Replacing the placeholder with commissioned assets

The procedural presence is a deliberate design, not a stand-in to be embarrassed
about — but a commissioned GLB can replace it without touching the scene.

1. **Commission or license the model.** Stylised divine-realistic; calm,
   luminous, graceful. Not hyper-real, not fantasy-battle-game.
2. **Record the licence first.** Insert into `asset_license_records` with
   `commercial_use_allowed`, `modification_allowed`, `ai_usage_allowed` and a
   `proof_url` that actually resolves. A licence you cannot produce on demand is
   not a licence you have.
3. **Register the asset** in `sacred_assets`, referencing that licence record.
4. **Get a cultural review** and record it (`reviewed_by`, `reviewed_at`,
   `spiritual_content_review_notes`). The table refuses `approved` without
   attribution.
5. **Point the form at it**: set `avatar_forms.model_url` (or drop the file at
   `public/models/madhav-presence.glb` and set `model_url` in
   `lib/darshan/config.ts`).

`MadhavAvatarScene` then loads it through `PresenceModel` and keeps the same
aura, crown, motes and lighting rig. Suspense shows the procedural core while it
streams; a failure drops to the static artwork via `PresenceBoundary`.

**Budget:** keep the GLB under ~3MB, Draco- or Meshopt-compressed, textures
≤2048px. It is fetched only at `full` tier, but a seeker on `full` tier still
deserves a fast hero.

### The asset rule, stated plainly

No deity artwork, no marketplace grabs, no unlicensed religious visuals — ever.
Everything currently in the engine is either drawn in code or already in the
repo. The two locks on new assets (a licence FK and an approved review) exist
because getting this wrong is not a bug you can hotfix; it is a harm to people
whose tradition this is.

---

## 6. What Vishwaroop must never become

`VishwaroopDarshan` is the product's one moment of spectacle, which makes it the
one most likely to go wrong. The scene is abstract on purpose:

- **no faces**, and nothing that multiplies into a crowd of them,
- **no mouths, teeth, blood or devouring imagery**,
- **no strobing, no camera shake, no sudden loud motion**,
- **no combat or game-style effects**.

Awe here comes from vastness and order — rings opening, shells nesting, a field
of stars — not from horror. The app's safety constraint forbids creating fear,
and a frightening Vishwaroop would break it.

Structurally it is also bounded: it is an *invitation card* until tapped, nothing
loads before consent, it ends itself after `max_duration_ms`, and Escape always
returns the gentle form. That is Arjuna's own arc in 11.45–11.46, used as an
interaction model.

---

## 7. Accessibility

Non-negotiable, and cheaper to keep than to retrofit:

- **Reduced motion** is honoured from the OS *and* offered in-product
  (`MotionPreferenceToggle`), because most people have never found the OS
  setting. The in-product choice outranks everything.
- **Text-only mode** drops decorative imagery entirely.
- **The static hero always renders** and always carries the alt text. The canvas
  is layered over it as `aria-hidden` decoration, so the accessible experience is
  identical whether WebGL ran or not — and a screen reader never hears about it.
- **Quote text is real text** in the DOM, with `lang="sa"` / `lang="hi"`, never
  baked into an image.
- **Rotation stops under reduced motion.** A shloka that swaps itself out from
  under a slow reader is an accessibility failure, not a flourish.
- **The launch ritual is skippable** by click, button or Escape, plays once per
  session, and never plays under reduced motion.
- **No autoplaying audio**, ever. Recitation is opt-in.
- **The chakra loader announces once** via `aria-live="polite"`; the chakra
  itself stays `aria-hidden` because it carries no information.

Everything fails open. A blocked animation, a lost WebGL context, a corrupt
`localStorage` — none of it can leave a blank page. The hero even self-reveals on
a 3.5s failsafe if the launch ritual never reports back.

---

## 8. The sacred motion language

The rules the whole system is tuned against:

- Slow, graceful, intentional. The chakra idles at ~3rpm — barely perceptible.
- No aggressive camera shakes. No distracting loops.
- Sacred objects move with purpose. If a thing moves, it should be answerable
  why.
- Aura, particles, mandalas and light used **carefully** — the reading experience
  is peaceful first.
- Clarity and devotion over spectacle, every time.
- **Motion is spent, not sprayed.** The launch plays once per session; the
  feathers drift once per load; nothing loops on interaction.

The tell that something has gone wrong: you notice the animation instead of the
verse.

---

## 9. Verifying a change

```bash
cd frontend
npm run dev
open 'http://localhost:3000/?darshan=debug'   # drive all 12 states by hand
npm run build                                  # confirm three.js stays code-split
npx tsc --noEmit && npx eslint .
```

The debug panel is the only practical way to reach `blessing`, `error` and
`vishwaroop_reveal` — flip through every state and watch whether anything ever
becomes aggressive. It is stripped from production builds.

Then check the two fallbacks that matter most, because they are the ones real
users will hit:

1. macOS **System Settings → Accessibility → Display → Reduce motion** — the
   ritual must not play, the sky must still, the reflection must vanish.
2. DevTools → **Network → Slow 3G** with Data Saver — the tier must drop to
   `lite` and three.js must never appear in the network log.

---

## 10. Not built, and why

- **Voice / lip-sync avatar.** The architecture is ready — `MadhavLight` already
  reacts to voice amplitude over the `madhav:voice` bus, and the engine has
  `answering`/`blessing` states to hang it on — but there is no face to sync, by
  design (§4).
- **Rive / Lottie.** CSS, SVG and WebGL cover everything currently needed;
  neither runtime earns its bundle yet. The engine does not care which renders a
  symbol, so adding one later is additive.
- **Framer Motion.** Skipped deliberately. The codebase animates with CSS and
  rAF, the chakra needs interpolated rotation *speed* (which CSS cannot express
  and Framer would not improve), and adding a second animation paradigm would
  make the motion language less coherent, not more.
- **An admin UI.** The schema, the constraints and the seed exist; the CRUD
  screens do not. `resolveDarshanConfig()` is the single seam — point it at
  Supabase and every setting becomes editable without touching a component.
- **Unreal.** Correctly out of scope for the app. If a cinematic trailer is ever
  wanted, it renders to video and never enters this bundle.
