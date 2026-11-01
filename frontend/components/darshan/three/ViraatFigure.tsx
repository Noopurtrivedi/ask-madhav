'use client'

/**
 * ViraatFigure — the avatar as a real 3D surface.
 *
 * A dense mesh is pushed forward by a depth map estimated from the avatar, so
 * the face, crowns, arms and garland have actual volume. He stands still, turns
 * only a touch with the pointer, breathes, its garments stir, and a slow light moves over the
 * relief. The colour comes straight from the sharp texture, so unlike generated
 * video, faces can never warp and detail holds when the form swells to the end.
 *
 * Only reached at `full` tier (VishwaroopDarshan); ViraatForm shows the flat
 * avatar everywhere else, and until these textures have loaded.
 */

import { Suspense, useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber'
import * as THREE from 'three'

const FIGURE_ASPECT = 1678 / 2732
const GROW_SECONDS = 18
const END_SCALE = 3.4

const vertexShader = /* glsl */ `
  uniform sampler2D uDepth;
  uniform float uTime;
  uniform float uRelief;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec3 p = position;
    float d = texture2D(uDepth, uv).r;
    p.z += (d - 0.42) * uRelief;
    // Breath, felt in the chest and shoulders.
    float chest = exp(-pow((uv.y - 0.66) / 0.14, 2.0));
    p.z += sin(uTime * 0.7) * 0.012 * chest;
    // Silk stirs from the hips down, most at the hem.
    float silk = 1.0 - smoothstep(0.08, 0.52, uv.y);
    p.x += sin(uTime * 0.7 + uv.y * 9.0 + uv.x * 3.0) * 0.006 * silk;
    p.z += sin(uTime * 0.55 + uv.y * 7.0 - uv.x * 5.0) * 0.01 * silk;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`

const fragmentShader = /* glsl */ `
  uniform sampler2D uColor;
  uniform sampler2D uDepth;
  uniform vec2 uLight;
  uniform vec2 uTexel;
  varying vec2 vUv;
  void main() {
    vec4 c = texture2D(uColor, vUv);
    if (c.a < 0.02) discard;
    // The relief catches a slow light, so the surface reads as a solid form.
    float dx = texture2D(uDepth, vUv + vec2(uTexel.x, 0.0)).r - texture2D(uDepth, vUv - vec2(uTexel.x, 0.0)).r;
    float dy = texture2D(uDepth, vUv + vec2(0.0, uTexel.y)).r - texture2D(uDepth, vUv - vec2(0.0, uTexel.y)).r;
    vec3 n = normalize(vec3(-dx * 9.0, -dy * 9.0, 1.0));
    vec3 l = normalize(vec3(uLight, 0.9));
    float shade = 0.9 + 0.2 * dot(n, l);
    float spec = pow(max(dot(n, normalize(l + vec3(0.0, 0.0, 1.0))), 0.0), 26.0);
    float gold = smoothstep(0.08, 0.4, c.r - c.b);
    vec3 col = c.rgb * shade + vec3(1.0, 0.82, 0.5) * spec * 0.2 * gold;
    gl_FragColor = vec4(col, c.a);
  }
`

function Figure({ ending, onReady }: { ending: boolean; onReady: () => void }) {
  const [color, depth] = useLoader(THREE.TextureLoader, [
    '/art/dash/vishwaroop-avatar-hd3.webp',
    '/art/dash/vishwaroop-avatar-relief2.webp',
  ])
  const gl = useThree((s) => s.gl)
  const viewport = useThree((s) => s.viewport)
  const size = useThree((s) => s.size)
  const group = useRef<THREE.Group>(null)
  const mesh = useRef<THREE.Mesh>(null)
  const pointer = useRef({ x: 0, y: 0, sx: 0, sy: 0 })
  const clock = useRef({ start: -1, endAt: -1 })

  const uniforms = useMemo(() => {
    color.colorSpace = THREE.NoColorSpace
    color.anisotropy = gl.capabilities.getMaxAnisotropy()
    return {
      uColor: { value: color },
      uDepth: { value: depth },
      uTime: { value: 0 },
      uRelief: { value: 0.46 },
      uLight: { value: new THREE.Vector2(0, 0.4) },
      uTexel: { value: new THREE.Vector2(3 / depth.image.width, 3 / depth.image.height) },
    }
  }, [color, depth, gl])

  useEffect(() => {
    onReady()
    const onMove = (e: PointerEvent) => {
      pointer.current.x = e.clientX / window.innerWidth - 0.5
      pointer.current.y = e.clientY / window.innerHeight - 0.5
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [onReady])

  // The same placement as the flat `.viraat`: feet just above Arjuna.
  const heightFrac = Math.min(0.77, (1.5 * size.width) / size.height)
  const h = viewport.height * heightFrac
  const feetY = viewport.height / 2 - viewport.height * (0.01 + heightFrac)

  useFrame((state) => {
    const t = state.clock.elapsedTime
    const c = clock.current
    if (c.start < 0) c.start = t
    if (ending && c.endAt < 0) c.endAt = t
    const p = pointer.current
    p.sx += (p.x - p.sx) * 0.018
    p.sy += (p.y - p.sy) * 0.018

    const age = Math.min(1, (t - c.start) / GROW_SECONDS)
    const eased = 1 - Math.pow(1 - age, 3)
    let scale = 0.5 + 0.5 * eased
    let lift = 0
    if (c.endAt >= 0) {
      const e = Math.min(1, (t - c.endAt) / 3.2)
      const base = scale
      scale *= 1 + (END_SCALE - 1) * e * e * (3 - 2 * e)
      // Swell from the heart, not the feet.
      lift = (scale - base) * h * 0.64
    }
    const g = group.current
    if (g) {
      g.scale.setScalar(scale)
      g.rotation.y = p.sx * 0.05
      g.rotation.x = -p.sy * 0.015
      g.position.y = feetY - lift
    }
    uniforms.uTime.value = t
    uniforms.uLight.value.set(Math.sin(t * 0.2) * 0.6, 0.45 + Math.cos(t * 0.16) * 0.25)
  })

  return (
    <group ref={group}>
      <mesh ref={mesh} position={[0, h / 2, 0]}>
        <planeGeometry args={[h * FIGURE_ASPECT, h, 260, 420]} />
        <shaderMaterial
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
          transparent
          depthWrite
        />
      </mesh>
    </group>
  )
}

export default function ViraatFigure({ ending, onReady }: { ending: boolean; onReady: () => void }) {
  return (
    <div className="viraat-3d" aria-hidden="true">
      <Canvas
        dpr={[1, 2]}
        flat
        gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
        camera={{ position: [0, 0, 8], fov: 34 }}
        style={{ width: '100%', height: '100%' }}
      >
        <Suspense fallback={null}>
          <Figure ending={ending} onReady={onReady} />
        </Suspense>
      </Canvas>
    </div>
  )
}
