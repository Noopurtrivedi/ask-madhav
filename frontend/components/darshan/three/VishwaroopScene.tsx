'use client'

/**
 * VishwaroopScene — the Cosmic Form.
 *
 * Chapter 11 rendered as *scale*, not as spectacle. The whole scene is four
 * things: a field of stars, concentric mandala rings that open outward, layered
 * translucent silhouettes suggesting many forms within one, and a core of light.
 *
 * What it deliberately is not — and what any future edit must preserve:
 *   · no faces, and nothing that multiplies into a crowd of them,
 *   · no mouths, teeth, blood or devouring imagery,
 *   · no strobing, no camera shake, no sudden loud motion,
 *   · no combat or game-style effects.
 * Awe here comes from vastness and order. The brief is explicit that a
 * horror-like Vishwaroop is a failure state, and the app's safety constraint
 * forbids creating fear. See docs/DARSHAN.md.
 *
 * `progress` (0→1) is driven by the parent over the configured duration, so the
 * reveal has a shape — open, hold, resolve — and always ends on its own.
 */

import { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { ColorPalette } from '@/lib/darshan/types'

interface Props {
  palette: ColorPalette
  /** 0→1 across the reveal's lifetime. */
  progress: number
}

/** Eased opening: fast at first, then settling. Never linear — linear reads mechanical. */
const easeOut = (x: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3)

/** Concentric rings that open outward as the form reveals itself. */
function MandalaRings({ palette, progress }: Props) {
  const group = useRef<THREE.Group>(null)
  const t = useRef(0)

  useFrame((_, delta) => {
    t.current += delta
    const g = group.current
    if (!g) return
    // A single slow turn for the whole mandala — felt, not watched.
    g.rotation.z = t.current * 0.05
  })

  const rings = useMemo(
    () => Array.from({ length: 7 }, (_, i) => ({ i, radius: 0.9 + i * 0.62 })),
    []
  )
  const open = easeOut(progress * 1.4)

  return (
    <group ref={group}>
      {rings.map(({ i, radius }) => {
        // Each ring opens slightly later than the one inside it.
        const stagger = Math.max(0, Math.min(1, open * 7 - i))
        return (
          <mesh key={i} rotation={[0, 0, (i * Math.PI) / 9]} scale={0.6 + stagger * 0.4}>
            <torusGeometry args={[radius, 0.006 + 0.004 * (7 - i), 8, 128]} />
            <meshBasicMaterial
              color={i % 2 ? palette.accent : palette.primary}
              transparent
              opacity={stagger * (0.5 - i * 0.045)}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        )
      })}
    </group>
  )
}

/**
 * Layered silhouettes — "many forms within one", expressed as nested
 * translucent shells rather than as figures.
 */
function LayeredForms({ palette, progress }: Props) {
  const group = useRef<THREE.Group>(null)
  const t = useRef(0)

  useFrame((_, delta) => {
    t.current += delta
    const g = group.current
    if (!g) return
    g.rotation.y = t.current * 0.08
    const breath = Math.sin(t.current * 0.6) * 0.5 + 0.5
    g.scale.setScalar(0.9 + easeOut(progress) * 0.25 + breath * 0.02)
  })

  const shells = [
    { r: 0.85, opacity: 0.2, color: palette.primary },
    { r: 1.25, opacity: 0.13, color: palette.glow },
    { r: 1.7, opacity: 0.08, color: palette.accent },
    { r: 2.2, opacity: 0.05, color: palette.primary },
  ]

  return (
    <group ref={group}>
      {shells.map((s) => (
        <mesh key={s.r}>
          <icosahedronGeometry args={[s.r, 2]} />
          <meshBasicMaterial
            color={s.color}
            transparent
            opacity={s.opacity * easeOut(progress)}
            wireframe
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  )
}

/**
 * The core of light at the centre of the form.
 *
 * Deliberately restrained: this sits directly behind the divine silhouette, and
 * an earlier, brighter version washed the figure out into a white disc. The
 * core's job is to *backlight* the form, not to compete with it.
 */
function CosmicCore({ palette, progress }: Props) {
  const mesh = useRef<THREE.Mesh>(null)
  const t = useRef(0)

  useFrame((_, delta) => {
    t.current += delta
    const m = mesh.current
    if (!m) return
    const breath = Math.sin(t.current * 0.8) * 0.5 + 0.5
    m.scale.setScalar(0.22 + easeOut(progress) * 0.2 + breath * 0.03)
  })

  return (
    <mesh ref={mesh}>
      <sphereGeometry args={[1, 32, 32]} />
      <meshBasicMaterial
        color={palette.glow}
        transparent
        opacity={0.22 + 0.2 * easeOut(progress)}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  )
}

/** A deep, quiet field of stars. Seeded, so it never flickers on remount. */
function StarField({ palette, progress }: Props) {
  const points = useRef<THREE.Points>(null)
  const t = useRef(0)

  const geometry = useMemo(() => {
    const count = 900
    const positions = new Float32Array(count * 3)
    let seed = 314159
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296
      return seed / 4294967296
    }
    for (let i = 0; i < count; i++) {
      const theta = rand() * Math.PI * 2
      const phi = Math.acos(2 * rand() - 1)
      const r = 8 + rand() * 14
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = r * Math.cos(phi)
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta)
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return geo
  }, [])

  useFrame((_, delta) => {
    t.current += delta
    const p = points.current
    if (!p) return
    p.rotation.y = t.current * 0.012
  })

  return (
    <points ref={points} geometry={geometry}>
      <pointsMaterial
        color={palette.glow}
        size={0.06}
        sizeAttenuation
        transparent
        opacity={0.35 + 0.35 * easeOut(progress)}
        depthWrite={false}
      />
    </points>
  )
}

export default function VishwaroopScene({ palette, progress }: Props) {
  return (
    <Canvas
      dpr={[1, 1.75]}
      gl={{ alpha: true, antialias: true, powerPreference: 'low-power' }}
      camera={{ position: [0, 0, 7.5], fov: 50 }}
      style={{ width: '100%', height: '100%' }}
    >
      <StarField palette={palette} progress={progress} />
      <MandalaRings palette={palette} progress={progress} />
      <LayeredForms palette={palette} progress={progress} />
      <CosmicCore palette={palette} progress={progress} />
    </Canvas>
  )
}
