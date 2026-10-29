# The Shree Krishna avatar (`public/art/krishna-avatar.jpg`)

The hero film opens on an original avatar of Shree Krishna generated locally — no
stock art, no third-party likeness.

## Provenance & licence

| Step | Tool | Licence |
|---|---|---|
| Image | [ComfyUI](https://github.com/comfyanonymous/ComfyUI) (GPL-3.0, the tool only) running **FLUX.1 [schnell]** fp8 (`Comfy-Org/flux1-schnell`) | Model: **Apache-2.0** — outputs free for commercial use |
| Upscale 1536×864 → 2560×1440 | **Real-ESRGAN x4plus** | BSD-3-Clause |
| Animation (when present) | **Wan 2.2 TI2V 5B** (`Comfy-Org/Wan_2.2_ComfyUI_Repackaged`) | **Apache-2.0** |

Settings: 1536×864, 4 steps, cfg 1.0, euler / simple, **seed 7777**. Prompt below.

> Cinematic film still, photorealistic, shot on ARRI Alexa with a 50mm lens, epic mythological film, Denis Villeneuve style cinematography. Wide composition: the left sixty percent of the frame is empty, soft warm ivory and pale sand mist with gentle haze. On the right side of the frame stands Lord Krishna, a graceful youthful adult man, seen from the waist up in three-quarter view facing slightly left, with a serene, compassionate gentle half-smile and soft kind eyes, dusky blue-grey skin with realistic texture, long dark flowing wavy hair. He wears a tall ornate antique-gold crown with one real peacock feather, layered ivory and gold silk garments with fine embroidery, antique gold jewellery and a long flowing deep navy-blue silk shawl drifting in the breeze. His right hand is raised gracefully at shoulder height with the index finger pointing upward, an elegant natural hand with five fingers, and a tiny soft golden glow just above the fingertip. Muted elegant colour grade, soft diffused natural light, warm golden rim light on his shoulders and crown, shallow depth of field, ultra detailed, divine, calm, reverent, majestic.

## How the film uses it

`components/Hero.tsx` → `ART`: the chakra's centre sits at **(0.5242, 0.3444)** of
the image — on the index finger a little below the tip (tip at y ≈ 455/1440), so the
fingertip rises through the flat-lying disc. The take-off arc and the dive zoom are
measured from that point. If the art is replaced, re-measure it and re-cut the tip.

Review criteria used when choosing among 16 candidates: adult and serene (not
doll-like, not stern), an anatomically correct hand with an unambiguous gesture,
open ivory space on the left for the headline. Reject any candidate whose raised
hand could be misread.

## The living portrait (`public/art/krishna-avatar.{webm,mp4}`)

Wan 2.2 TI2V 5B (Apache-2.0) via local ComfyUI, image-to-video from the avatar
(centre-cropped 1536×845 → 1280×704, i.e. image rows 15..1423 of 1440), 81 frames,
20 steps, cfg 5, uni_pc, shift 8, seed 4242 — about 73 min on an M4 Max. Motion
prompt: breeze in the hair and navy shawl, light on the crown, a slow blink, the
raised hand still, locked-off camera. Encoded as a **ping-pong loop** (frames
0..80 then 79..1 = 160 frames @ 24 fps, 6.7 s, seamless): VP9/WebM ~1.1 MB and
H.264/MP4 ~1.3 MB; `krishna-avatar-poster.jpg` is frame 1.

**Fingertip match-move.** The model let the hand drift ~6 px over the clip. The
fingertip was tracked in all 81 frames (colour-distance silhouette, top-24-row
centroid, 5-frame smoothing) into `lib/darshan/avatarTrack.ts`; Hero moves the
chakra, its rings and the fingertip cut-out by that offset per decoded frame
(`requestVideoFrameCallback`), so the disc never slips off the finger. If the clip
is re-rendered, re-run the tracker and regenerate that file.

**When it plays.** Full tier only — never under reduced motion, the `still`/`lite`
tiers or data-saver. It fades to the 2560px still as the dive begins (sharper for
the zoom) and pauses itself once hidden or off-screen.

## Fingertip cut-out (`public/art/krishna-fingertip.png`)

Image px (1300, 440)–(1386, 496): the index fingertip above the disc's centre
line, alpha from colour distance to the ivory backdrop. Layered over the
flat-lying chakra so the finger passes through its hole. **Regenerate it if the
avatar's background changes** (e.g. the planned dark theme).
