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

`components/Hero.tsx` → `ART`: the fingertip sits at **(0.522, 0.29)** of the image
(the point just above the raised index finger). The Sudarshan Chakra is positioned
there and the dive zooms around it. If the art is replaced, re-measure that point.

Review criteria used when choosing among 16 candidates: adult and serene (not
doll-like, not stern), an anatomically correct hand with an unambiguous gesture,
open ivory space on the left for the headline. Reject any candidate whose raised
hand could be misread.
