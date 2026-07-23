'use client'

/**
 * KrishnaFigure — a stylised 3D Krishna, built from geometry.
 *
 * ── What this is, and is not ──────────────────────────────────────────────
 * This is a real figure standing in the scene — not a photograph on a plane,
 * and not an abstract orb. It is recognisably Krishna by *silhouette*: the
 * tribhanga (three-bend) stance, the mukuta crown, the mor pankh, the flute
 * held across the body, the sash. It is NOT photoreal, and it is deliberately
 * **faceless** — a smooth luminous head with no drawn features. The app's safety
 * constraint forbids depicting the divine face, and silhouette is how classical
 * iconography is read anyway.
 *
 * A photoreal, rigged Krishna is a commissioned GLB (see docs/ASSETS.md); when
 * one exists, `avatar_forms.model_url` swaps it in and this becomes the
 * placeholder it always was. Until then this is a genuine 3D presence rather
 * than an apology for the lack of one.
 *
 * ── How it reads as premium rather than as a toy ──────────────────────────
 * Three things do the work: peacock-blue skin under a proper key/rim/fill rig
 * so the form has volume; gold metallic crown/jewellery/flute that catch the
 * light; and an additive aura + halo behind, so the figure is lit *from within
 * the cosmos* rather than pasted onto it. Everything is generated in code, so
 * nothing here can be unlicensed.
 */

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { ColorPalette } from '@/lib/darshan/types'

interface Props {
  palette: ColorPalette
  energy: number
  tempo: number
}

// Krishna's traditional colouring, tuned to the app's cosmic palette.
const SKIN = '#3B6FB5' // peacock blue, lifted so it reads on a dark field
const SKIN_DEEP = '#24487F'
const GOLD = '#E8C35A'
const GOLD_DEEP = '#B8892E'
const SASH = '#E0A43C'
const FEATHER_BLUE = '#1E9BB8'
const FEATHER_GREEN = '#2F9E6A'

/** A soft radial sprite texture for the aura — smooth falloff, one draw call. */
function useGlowTexture(color: string, coreWhite = false) {
  return useMemo(() => {
    if (typeof document === 'undefined') return null
    const size = 256
    const c = document.createElement('canvas')
    c.width = c.height = size
    const ctx = c.getContext('2d')
    if (!ctx) return null
    const col = new THREE.Color(color)
    const rgb = `${(col.r * 255) | 0}, ${(col.g * 255) | 0}, ${(col.b * 255) | 0}`
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
    if (coreWhite) g.addColorStop(0, 'rgba(255,253,245,1)')
    g.addColorStop(coreWhite ? 0.14 : 0, `rgba(${rgb},${coreWhite ? 0.9 : 1})`)
    g.addColorStop(0.34, `rgba(${rgb},0.4)`)
    g.addColorStop(0.6, `rgba(${rgb},0.12)`)
    g.addColorStop(1, `rgba(${rgb},0)`)
    ctx.fillStyle = g
    ctx.fillRect(0, 0, size, size)
    const tex = new THREE.CanvasTexture(c)
    tex.colorSpace = THREE.SRGBColorSpace
    return tex
  }, [color, coreWhite])
}

function Aura({ palette, energy }: Props) {
  const bloom = useGlowTexture(palette.primary)
  const halo = useGlowTexture(palette.glow)
  const t = useRef(0)
  const ref = useRef<THREE.Group>(null)
  useFrame((_, d) => {
    t.current += d
    const g = ref.current
    if (!g) return
    const breath = Math.sin(t.current * 0.8) * 0.5 + 0.5
    g.scale.setScalar(1 + breath * (0.03 + 0.06 * energy))
  })
  if (!bloom || !halo) return null
  return (
    <group ref={ref} position={[0, 2.6, -0.9]}>
      <sprite scale={[6, 7.5, 1]}>
        <spriteMaterial map={bloom} transparent opacity={0.16 + 0.16 * energy} blending={THREE.AdditiveBlending} depthWrite={false} />
      </sprite>
      <sprite scale={[3.4, 4.2, 1]}>
        <spriteMaterial map={halo} transparent opacity={0.2 + 0.2 * energy} blending={THREE.AdditiveBlending} depthWrite={false} />
      </sprite>
    </group>
  )
}

/** The turning halo ring behind the crown. */
function Halo({ palette, tempo }: Props) {
  const ref = useRef<THREE.Mesh>(null)
  useFrame((_, d) => {
    if (ref.current) ref.current.rotation.z += (d * 0.12) / Math.max(0.2, tempo)
  })
  return (
    <mesh ref={ref} position={[0, 3.3, -0.55]} rotation={[Math.PI / 2.3, 0, 0]}>
      <torusGeometry args={[0.72, 0.018, 12, 80]} />
      <meshBasicMaterial color={palette.accent} transparent opacity={0.5} blending={THREE.AdditiveBlending} depthWrite={false} />
    </mesh>
  )
}

/**
 * A single peacock feather for the crown — a curved quill with an ocellus.
 * Built small; three of them fan from the mukuta.
 */
function CrownFeather({ rotation }: { rotation: [number, number, number] }) {
  return (
    <group rotation={rotation}>
      {/* quill */}
      <mesh position={[0, 0.45, 0]}>
        <cylinderGeometry args={[0.012, 0.02, 0.9, 6]} />
        <meshStandardMaterial color={FEATHER_GREEN} roughness={0.5} />
      </mesh>
      {/* the eye */}
      <mesh position={[0, 0.92, 0]}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial color={FEATHER_BLUE} emissive={FEATHER_BLUE} emissiveIntensity={0.35} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.92, 0.02]}>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshStandardMaterial color="#123B66" emissive="#0E2B4E" emissiveIntensity={0.4} roughness={0.3} />
      </mesh>
    </group>
  )
}

/**
 * The figure. Built as one group in the tribhanga S-curve: hips shifted one
 * way, shoulders the other, head returning to centre — the stance that makes a
 * standing Krishna read as Krishna even in silhouette.
 */
function Figure({ palette, energy, tempo }: Props) {
  const root = useRef<THREE.Group>(null)
  const t = useRef(0)

  // Body skin material, shared. Slight emissive so it glows on a dark field but
  // still takes the lighting rig (pure emissive would flatten the form).
  const skinMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: SKIN,
        emissive: new THREE.Color(SKIN_DEEP),
        emissiveIntensity: 0.25,
        roughness: 0.42,
        metalness: 0.08,
      }),
    []
  )
  const goldMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: GOLD, emissive: new THREE.Color(GOLD_DEEP), emissiveIntensity: 0.14, roughness: 0.3, metalness: 0.7 }),
    []
  )
  const clothMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#D9A43C', roughness: 0.8, metalness: 0.08, side: THREE.DoubleSide }),
    []
  )
  const sashMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: SASH, roughness: 0.5, metalness: 0.2, emissive: new THREE.Color('#7A4E12'), emissiveIntensity: 0.2 }),
    []
  )

  // The dhoti — a lathe (revolved profile). A slim column with only a modest
  // flare at the hem, not a bell: a wide flare is what made it read as a pawn.
  const dhotiGeo = useMemo(() => {
    const pts = [
      new THREE.Vector2(0.24, 0),
      new THREE.Vector2(0.27, 0.12),
      new THREE.Vector2(0.26, 0.5),
      new THREE.Vector2(0.23, 1.0),
      new THREE.Vector2(0.21, 1.6),
      new THREE.Vector2(0.2, 1.95),
      new THREE.Vector2(0.19, 2.05),
    ]
    return new THREE.LatheGeometry(pts, 40)
  }, [])

  useFrame((_, d) => {
    t.current += d / Math.max(0.2, tempo)
    const g = root.current
    if (!g) return
    // Breath + the faintest sway, so the stance lives without swinging.
    const breath = Math.sin(t.current * 0.9) * 0.5 + 0.5
    g.position.y = breath * (0.03 + 0.04 * energy)
    g.rotation.y = Math.sin(t.current * 0.2) * 0.06
    g.rotation.z = Math.sin(t.current * 0.16) * 0.012
  })

  return (
    <group ref={root} position={[0, -1.9, 0]}>
      {/* Lotus pedestal — a flat ring of petals lying open, not a blob. */}
      <mesh position={[0, 0.04, 0]}>
        <cylinderGeometry args={[0.34, 0.4, 0.06, 24]} />
        <meshStandardMaterial color={GOLD_DEEP} metalness={0.6} roughness={0.4} emissive={new THREE.Color('#5A3E12')} emissiveIntensity={0.18} />
      </mesh>
      {Array.from({ length: 14 }, (_, i) => (
        <mesh
          key={i}
          position={[Math.cos((i / 14) * Math.PI * 2) * 0.42, 0.06, Math.sin((i / 14) * Math.PI * 2) * 0.42]}
          rotation={[Math.PI / 2.6, 0, -(i / 14) * Math.PI * 2 + Math.PI / 2]}
          scale={[1, 1, 0.4]}
        >
          <coneGeometry args={[0.12, 0.34, 5]} />
          <meshStandardMaterial color="#E28FA8" roughness={0.55} emissive={new THREE.Color('#5A2038')} emissiveIntensity={0.1} />
        </mesh>
      ))}

      {/* Dhoti / lower body — slim column, with a solid capped base so the
          open lathe bottom can't pool light into a hot-spot. */}
      <mesh geometry={dhotiGeo} position={[0.03, 0.1, 0]} material={clothMat} />

      {/* Waist belt */}
      <mesh position={[0.04, 2.06, 0]} scale={[1, 0.7, 1]} material={sashMat}>
        <torusGeometry args={[0.2, 0.045, 12, 32]} />
      </mesh>

      {/* Torso — tall and slim; tribhanga leans the chest back to centre */}
      <mesh position={[0.02, 2.55, 0]} rotation={[0, 0, -0.05]} material={skinMat}>
        <capsuleGeometry args={[0.2, 0.62, 12, 24]} />
      </mesh>
      {/* chest jewel */}
      <mesh position={[0.01, 2.62, 0.18]} material={goldMat}>
        <sphereGeometry args={[0.06, 12, 12]} />
      </mesh>
      {/* vaijayanti garland down the chest */}
      {Array.from({ length: 16 }, (_, i) => {
        const a = (i / 15) * Math.PI - Math.PI / 2
        return (
          <mesh key={i} position={[Math.sin(a) * 0.2, 2.72 - i * 0.036, 0.17 + Math.cos(a) * 0.03]} material={sashMat}>
            <sphereGeometry args={[0.022, 8, 8]} />
          </mesh>
        )
      })}

      {/* Shoulders + neck */}
      <mesh position={[0, 2.94, 0]} rotation={[0, 0, Math.PI / 2]} material={skinMat}>
        <capsuleGeometry args={[0.075, 0.28, 8, 16]} />
      </mesh>
      <mesh position={[0, 3.06, 0]} material={skinMat}>
        <cylinderGeometry args={[0.07, 0.08, 0.12, 12]} />
      </mesh>

      {/* Head — smooth and faceless, the aniconic choice */}
      <mesh position={[0, 3.32, 0]} material={skinMat}>
        <sphereGeometry args={[0.23, 32, 32]} />
      </mesh>

      {/* Mukuta — the crown */}
      <mesh position={[0, 3.5, 0]} material={goldMat}>
        <cylinderGeometry args={[0.18, 0.23, 0.13, 20]} />
      </mesh>
      <mesh position={[0, 3.64, 0]} material={goldMat}>
        <coneGeometry args={[0.15, 0.26, 20]} />
      </mesh>
      <mesh position={[0, 3.8, 0]} material={goldMat}>
        <sphereGeometry args={[0.045, 12, 12]} />
      </mesh>

      {/* Mor pankh — three feathers fanning up and back from the crown */}
      <group position={[0, 3.58, -0.1]}>
        <CrownFeather rotation={[-0.28, 0, 0]} />
        <CrownFeather rotation={[-0.3, 0, 0.36]} />
        <CrownFeather rotation={[-0.3, 0, -0.36]} />
      </group>

      {/* Venugopala pose — both hands raised to a flute held across, angled up
          to the figure's left. The arms and the flute are the read: this is
          what makes the silhouette Krishna and not a generic idol. */}
      {/* left arm: shoulder → elbow (out) → hand (in at flute, high) */}
      <mesh position={[-0.3, 2.86, 0.06]} rotation={[0.3, 0, 0.7]} material={skinMat}>
        <capsuleGeometry args={[0.055, 0.32, 8, 16]} />
      </mesh>
      <mesh position={[-0.34, 3.06, 0.28]} rotation={[1.0, 0.3, 0.2]} material={skinMat}>
        <capsuleGeometry args={[0.045, 0.3, 8, 16]} />
      </mesh>
      {/* right arm: shoulder → elbow (out) → hand (in at flute, low) */}
      <mesh position={[0.3, 2.84, 0.06]} rotation={[0.3, 0, -0.6]} material={skinMat}>
        <capsuleGeometry args={[0.055, 0.32, 8, 16]} />
      </mesh>
      <mesh position={[0.16, 3.0, 0.3]} rotation={[1.05, -0.3, -0.15]} material={skinMat}>
        <capsuleGeometry args={[0.045, 0.3, 8, 16]} />
      </mesh>

      {/* The bansuri — flute — across the lower face, angled up to the left */}
      <mesh position={[-0.12, 3.12, 0.42]} rotation={[0, 0.1, 0.42]} material={goldMat}>
        <cylinderGeometry args={[0.022, 0.024, 1.0, 12]} />
      </mesh>

      {/* Armlets */}
      {[[-0.3, 2.98, 0.14], [0.3, 2.96, 0.14]].map((p, i) => (
        <mesh key={i} position={p as [number, number, number]} material={goldMat}>
          <torusGeometry args={[0.06, 0.016, 8, 16]} />
        </mesh>
      ))}
    </group>
  )
}

/** The key/rim/fill rig that gives the figure volume. */
function Rig({ palette }: { palette: ColorPalette }) {
  return (
    <>
      <ambientLight intensity={0.5} />
      {/* warm key from upper right */}
      <pointLight position={[2.6, 3.6, 4.5]} intensity={11} color="#FFE7B0" distance={15} />
      {/* peacock rim from behind-left — separates him from the cosmos */}
      <pointLight position={[-3.6, 2.2, -2.6]} intensity={11} color={palette.glow} distance={15} />
      {/* cool fill from below */}
      <pointLight position={[0, 2.2, 4]} intensity={3} color={palette.primary} distance={11} />
    </>
  )
}

export default function KrishnaFigure(props: Props) {
  // One transform for the whole avatar: 0.5 fits the ~3.4-unit figure into the
  // hero frame with headroom, and +1.0 on Y centres crown-to-lotus in view.
  return (
    <>
      <Rig palette={props.palette} />
      <group scale={0.5} position={[0, 0.1, 0]}>
        <Aura {...props} />
        <Halo {...props} />
        <Figure {...props} />
      </group>
    </>
  )
}
