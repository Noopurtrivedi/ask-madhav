# Commissioning the Darshan assets

Everything in the app today is drawn in code. That was deliberate — it kept the
project free of unlicensed deity artwork and let the engine ship without waiting
on an artist. But code-drawn geometry has a ceiling, and the hero avatar,
the chakra and the Vishwaroop loop will all be better as authored assets.

**This document is the brief you hand to an artist.** Every slot below is
already wired: dropping a file in and setting one config value is the whole
integration. No component changes.

> **Before anything else, read [`DARSHAN.md` § Asset licensing](./DARSHAN.md).**
> Nothing enters the app without a licence record and a cultural review — the
> database refuses it (`sacred_assets` requires `commercial_use_allowed` and an
> approved review; `avatar_forms` refuses `active_status` without a named
> reviewer and non-empty notes). That is not bureaucracy. Getting this wrong
> means shipping unlicensed religious artwork, which is not a bug you hotfix.

---

## 1. Krishna / Madhav hero avatar — GLB

**The highest-value asset.** Replaces the animated artwork in the hero.

| | |
|---|---|
| Format | `.glb` (glTF 2.0 binary), Draco or Meshopt compressed |
| Budget | **≤ 3 MB total**, ≤ 60k triangles |
| Textures | ≤ 2048², KTX2/Basis if possible; 4 maps max (base, normal, ORM, emissive) |
| Up axis | Y-up, metres, origin at the feet, facing +Z |
| Framing | Full figure; the hero crops to roughly crown-to-waist |
| Drop at | `frontend/public/models/madhav-presence.glb` |
| Enable by | `avatar_forms.model_url` (CMS) or `model_url` in `lib/darshan/config.ts` |

**Design direction** — stylised divine-realistic. Calm, luminous, graceful.
Peacock blue, deep indigo, gold, soft saffron. Crown with mor pankh. Gentle
expression. Elegant cloth. **Not** hyper-real, **not** fantasy-battle-game,
**not** aggressive.

**Animation clips** (named exactly; the engine maps states to them):

| Clip | Engine state | Notes |
|---|---|---|
| `idle` | `idle` | Breath, blink, slow cloth. Seamless loop, 6–10s. |
| `blessing` | `blessing` | Raised hand. One-shot, ~3s, returns to idle pose. |
| `flute` | — | Optional alternate idle. |
| `thinking` | `thinking` | Slight inward tilt. Loop, 4–6s. |
| `answer_reveal` | `answering` | Opening gesture. One-shot, ~2.5s. |

Every clip must start and end on the idle pose so transitions never pop.

**Blender export**: File → Export → glTF 2.0, *Format* GLB, *Include* Selected
Objects + Animations, *Compression* Draco on, *Materials* Export. Reallusion
Character Creator is fine for the rig; export FBX → Blender → GLB.

---

## 2. Vishwaroop cinematic loop — WebM

**Already wired.** `config.vishwaroop.video_url` + `video_poster`.

| | |
|---|---|
| Format | `.webm` (VP9) primary; `.mp4` (H.264) fallback for Safari |
| Budget | **≤ 6 MB**, ≤ 20s, seamless loop |
| Resolution | 1920×1080, 24–30fps |
| Audio | **None.** The app never autoplays audio; the track is muted regardless. |
| Poster | First frame as `.webp`, ≤ 120 KB — used while buffering *and* under reduced motion |
| Drop at | `frontend/public/video/vishwaroop.webm` (+ `.mp4`, `.webp`) |

It plays **behind** the real-time layer, not instead of it, so the Dashavatar
ring, the verse and the reduced-motion path keep working either way.

**Content constraints are non-negotiable** — see
[`DARSHAN.md` § What Vishwaroop must never become](./DARSHAN.md): no faces
multiplying into a crowd, no mouths or devouring imagery, no strobing, no camera
shake, no combat effects. Awe from vastness and order, never horror.

---

## 3. Sudarshan Chakra + mor pankh — Rive (optional)

**Not currently wired, and I would not wire it until the `.riv` files exist.**

The chakra today is ~3 KB of SVG driven by one rAF loop that *interpolates*
rotation speed and glow toward the target for the current state — so a state
change reads as the discus gathering or releasing momentum. It already does what
a Rive state machine would do here, and the Rive web runtime is ~150 KB. Adding
the runtime to replace working code is a straight bundle loss **unless** a
designer is producing motion that vector + rAF genuinely cannot express.

If you do commission Rive work, the case for it is:

- **Mor pankh** — per-barb secondary motion as the feather turns. Genuinely hard
  in SVG; a real win.
- **Chakra launch trail** — particle trail during the throw.

Spec: `.riv` ≤ 200 KB, one artboard per asset, a state machine with inputs named
`state` (number: 0 idle / 1 processing / 2 settling / 3 still) and `glow`
(number 0–1) so it maps onto the existing `ChakraState` without new plumbing.

Ping me when a file exists and wiring it is a small, contained change.

---

## 4. What I deliberately did *not* adopt

Recorded so the next person doesn't re-litigate it:

- **Framer Motion / GSAP.** The app animates with CSS, rAF and the Web
  Animations API, and the Darshan engine centralises the timing so the whole
  scene shares one energy level. Adding two more animation runtimes would make
  the motion language *less* coherent, not more, and neither buys anything the
  current stack can't do. Worth revisiting only for shared-element route
  transitions, which the app doesn't have.
- **Spline.** Good for prototyping; not a production layer for this.
- **GIF.** Never. Nothing in the app uses one.

---

## 5. Checklist before any asset goes live

1. Licence recorded in `asset_license_records` with a `proof_url` that resolves.
2. Asset registered in `sacred_assets`, referencing that licence record.
3. Cultural review recorded — `reviewed_by`, `reviewed_at`, and a note in
   `spiritual_content_review_notes`.
4. Config points at it (`model_url` / `video_url`).
5. Verified on a **`lite`-tier device**: the asset must not be fetched at all
   where the engine hasn't cleared it. Check the network log, not just the look.
6. Verified under **reduced motion**: the still fallback must carry the same
   meaning, not a frozen frame of something else.
