'use client'

/**
 * MadhavAvatarScene — the hero's 3D presence.
 *
 * ── Why this is abstract ──────────────────────────────────────────────────
 * There is no Krishna model here, and that is a design decision, not a
 * placeholder apology. The app's safety constraint forbids representing the
 * divine Krishna, and `MadhavLight` already established the answer: Madhav as
 * *jyotiṣām api taj jyotiḥ* — light, not likeness. So the scene renders a
 * luminous standing presence, an aura, a crown ring and a drift of light motes.
 * Peacock blue, deep indigo, gold and soft saffron, exactly as briefed —
 * expressed as light rather than as a face.
 *
 * Every vertex is generated in code. Nothing is downloaded, so nothing here can
 * be unlicensed. When a commissioned GLB exists, set `modelUrl` (from
 * `avatar_forms.model_url`) and it replaces the procedural core while keeping
 * the same aura, crown, motes and lighting rig.
 *
 * ── Performance ───────────────────────────────────────────────────────────
 * This module is only ever reached through a dynamic import from
 * `MadhavPresence`, and only when the engine has already decided the device is
 * `full` tier with working WebGL. `dpr` is capped at 1.75, the frameloop is
 * demand-free but every animation is delta-timed, and the whole scene is a
 * few hundred triangles plus one points cloud.
 */

import { Suspense, useMemo, useRef } from 'react'
import { Canvas, useFrame, useLoader } from '@react-three/fiber'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import type { ColorPalette } from '@/lib/darshan/types'

interface SceneProps {
  palette: ColorPalette
  /** 0..1 — the engine's permitted energy. Scales every amplitude. */
  energy: number
  /** Slower when the engine wants calm. */
  tempo: number
  /** Optional commissioned GLB. Null → the procedural presence. */
  modelUrl?: string | null
}

/**
 * A soft radial-falloff texture, drawn on a canvas at module scope.
 *
 * Nested transparent spheres cannot express a glow: each one has a hard
 * silhouette, so stacking them produces visible onion-rings rather than a
 * falloff. A radial gradient on a billboarded sprite gives a genuinely smooth
 * falloff in a single draw call — and, being generated in code, keeps the "no
 * downloaded assets" guarantee intact.
 *
 * Cached per colour: the hero uses three or four at most.
 */
const glowTextureCache = new Map<string, THREE.CanvasTexture>()

function glowTexture(color: string, coreWhite: boolean): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null
  const key = `${color}|${coreWhite}`
  const cached = glowTextureCache.get(key)
  if (cached) return cached

  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  const c = new THREE.Color(color)
  const rgb = `${Math.round(c.r * 255)}, ${Math.round(c.g * 255)}, ${Math.round(c.b * 255)}`
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  // A steep-then-long tail reads as light; a linear ramp reads as a flat disc.
  if (coreWhite) g.addColorStop(0, 'rgba(255, 253, 245, 1)')
  g.addColorStop(coreWhite ? 0.12 : 0, `rgba(${rgb}, ${coreWhite ? 0.92 : 1})`)
  g.addColorStop(0.3, `rgba(${rgb}, 0.42)`)
  g.addColorStop(0.55, `rgba(${rgb}, 0.14)`)
  g.addColorStop(0.78, `rgba(${rgb}, 0.04)`)
  g.addColorStop(1, `rgba(${rgb}, 0)`)
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  glowTextureCache.set(key, texture)
  return texture
}

/** One billboarded glow layer. Always faces the camera, so it never shows an edge. */
function GlowSprite({
  color,
  coreWhite = false,
  scale,
  opacity,
  stretchY = 1,
}: {
  color: string
  coreWhite?: boolean
  scale: number
  opacity: number
  stretchY?: number
}) {
  const texture = useMemo(() => glowTexture(color, coreWhite), [color, coreWhite])
  if (!texture) return null
  return (
    <sprite scale={[scale, scale * stretchY, 1]}>
      <spriteMaterial
        map={texture}
        transparent
        opacity={opacity}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        depthTest={false}
      />
    </sprite>
  )
}

/**
 * Breathing, luminous core. A presence, deliberately faceless.
 *
 * Three billboarded glows — a wide bloom, a mid body and a bright heart —
 * gently elongated on Y so it reads as a presence standing rather than a ball
 * floating. No lit solid anywhere: a `meshStandardMaterial` body, however
 * emissive, catches speculars and reads as a *plastic object*, and light has no
 * surface. Same visual language as `MadhavLight` elsewhere in the app, at hero
 * scale.
 */
function PresenceCore({ palette, energy, tempo }: SceneProps) {
  const group = useRef<THREE.Group>(null)
  const t = useRef(0)

  useFrame((_, delta) => {
    t.current += delta / Math.max(0.2, tempo)
    const g = group.current
    if (!g) return
    // Breath: a slow swell with a barely-there rise. ~4.5s per cycle.
    const breath = Math.sin(t.current * 1.4) * 0.5 + 0.5
    const amp = 0.03 + 0.05 * energy
    const s = 1 + breath * amp
    g.scale.setScalar(s)
    g.position.y = 0.1 + breath * amp * 1.4
  })

  const lift = 0.72 + 0.28 * energy

  return (
    <group ref={group}>
      <GlowSprite color={palette.accent} scale={4.6} opacity={0.3 * lift} stretchY={1.18} />
      <GlowSprite color={palette.primary} scale={2.9} opacity={0.5 * lift} stretchY={1.24} />
      <GlowSprite color={palette.glow} scale={1.7} opacity={0.62 * lift} stretchY={1.3} />
      <GlowSprite color={palette.glow} coreWhite scale={0.9} opacity={0.9 * lift} stretchY={1.35} />
    </group>
  )
}

/**
 * The commissioned-model slot.
 *
 * TODO(asset): drop the licensed GLB at `public/models/…` and set
 * `avatar_forms.model_url`. Register it in `sacred_assets` first — the docs
 * require commercial_use_allowed + an approved cultural review before a model
 * may be referenced. Suspense keeps the aura visible while it streams.
 */
function PresenceModel({ url, energy }: { url: string; energy: number }) {
  const gltf = useLoader(GLTFLoader, url)
  const group = useRef<THREE.Group>(null)
  const t = useRef(0)

  useFrame((_, delta) => {
    t.current += delta
    const g = group.current
    if (!g) return
    const breath = Math.sin(t.current * 1.4) * 0.5 + 0.5
    g.position.y = -0.15 + breath * (0.02 + 0.03 * energy)
  })

  const scene = useMemo(() => gltf.scene.clone(true), [gltf])
  return (
    <group ref={group}>
      <primitive object={scene} />
    </group>
  )
}

/** Three nested additive shells — the aura, opening slightly with energy. */
function Aura({ palette, energy, tempo }: SceneProps) {
  const shells = useRef<THREE.Group>(null)
  const t = useRef(0)

  useFrame((_, delta) => {
    t.current += delta / Math.max(0.2, tempo)
    const g = shells.current
    if (!g) return
    const pulse = Math.sin(t.current * 0.9) * 0.5 + 0.5
    const s = 1 + pulse * (0.03 + 0.12 * energy)
    g.scale.setScalar(s)
  })

  const layers = [
    { r: 1.35, color: palette.primary, opacity: 0.16 },
    { r: 1.75, color: palette.glow, opacity: 0.1 },
    { r: 2.3, color: palette.accent, opacity: 0.06 },
  ]

  return (
    <group ref={shells} position={[0, 0.1, 0]}>
      {layers.map((l) => (
        <mesh key={l.r}>
          <sphereGeometry args={[l.r, 32, 32]} />
          <meshBasicMaterial
            color={l.color}
            transparent
            opacity={l.opacity * (0.5 + 0.5 * energy)}
            side={THREE.BackSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  )
}

/**
 * A slowly turning gold ring above the presence — the crown, suggested.
 * Kept thin and near-edge-on: a bold hoop reads as a cartoon halo, which is
 * exactly the register this product must avoid.
 */
function CrownRing({ palette, tempo }: SceneProps) {
  const ring = useRef<THREE.Mesh>(null)
  useFrame((_, delta) => {
    const r = ring.current
    if (!r) return
    r.rotation.z += (delta * 0.15) / Math.max(0.2, tempo)
  })
  return (
    <mesh ref={ring} position={[0, 1.12, 0]} rotation={[Math.PI / 2.1, 0, 0]}>
      <torusGeometry args={[0.46, 0.009, 10, 64]} />
      <meshBasicMaterial
        color={palette.accent}
        transparent
        opacity={0.5}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  )
}

/**
 * Light motes drifting around the presence.
 *
 * Positions are generated once from a fixed seed, so the cloud is identical on
 * every mount — no flicker if the component remounts, and no `Math.random()`
 * during render.
 */
function Motes({ palette, energy, tempo }: SceneProps) {
  const points = useRef<THREE.Points>(null)
  const t = useRef(0)

  const geometry = useMemo(() => {
    const count = 140
    const positions = new Float32Array(count * 3)
    let seed = 9741
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296
      return seed / 4294967296
    }
    for (let i = 0; i < count; i++) {
      // Spherical shell around the presence, biased upward.
      const theta = rand() * Math.PI * 2
      const phi = Math.acos(2 * rand() - 1)
      const r = 1.6 + rand() * 1.5
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = r * Math.cos(phi) * 0.75 + 0.2
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta)
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return geo
  }, [])

  useFrame((_, delta) => {
    t.current += delta / Math.max(0.2, tempo)
    const p = points.current
    if (!p) return
    p.rotation.y = t.current * 0.06
    p.rotation.x = Math.sin(t.current * 0.15) * 0.08
  })

  return (
    <points ref={points} geometry={geometry}>
      <pointsMaterial
        color={palette.glow}
        size={0.035}
        sizeAttenuation
        transparent
        opacity={0.35 + 0.45 * energy}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}

/**
 * The lighting rig: warm key, peacock rim, cool fill.
 *
 * The procedural presence is built from unlit additive materials and ignores
 * these entirely. They exist for the commissioned-GLB path (`PresenceModel`),
 * whose PBR materials do need lighting — so the rig is already in place the day
 * a model is dropped in, and the palette drives it.
 */
function Rig({ palette }: { palette: ColorPalette }) {
  return (
    <>
      <ambientLight intensity={0.35} />
      <pointLight position={[2.4, 2.2, 2.6]} intensity={18} color={palette.primary} distance={12} />
      <pointLight position={[-2.6, 0.6, -1.8]} intensity={14} color={palette.glow} distance={12} />
      <pointLight position={[0, -1.8, 2]} intensity={6} color={palette.accent} distance={9} />
    </>
  )
}

export default function MadhavAvatarScene({ palette, energy, tempo, modelUrl }: SceneProps) {
  const scene = { palette, energy, tempo }
  return (
    <Canvas
      // Cap DPR: a 3× retina phone gains nothing visible here and pays ~2.2×
      // the fill cost. `alpha` lets the cosmic backdrop show through.
      dpr={[1, 1.75]}
      gl={{ alpha: true, antialias: true, powerPreference: 'low-power' }}
      camera={{ position: [0, 0.35, 5.2], fov: 42 }}
      style={{ width: '100%', height: '100%' }}
    >
      <Rig palette={palette} />
      <Aura {...scene} />
      <Suspense fallback={<PresenceCore {...scene} />}>
        {modelUrl ? <PresenceModel url={modelUrl} energy={energy} /> : <PresenceCore {...scene} />}
      </Suspense>
      <CrownRing {...scene} />
      <Motes {...scene} />
    </Canvas>
  )
}
