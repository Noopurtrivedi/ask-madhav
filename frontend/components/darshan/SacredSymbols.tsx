'use client'

/**
 * SacredSymbols — the vector motifs a visual mood can call for.
 *
 * `SYMBOL_REGISTRY` maps an id to *this file*, never to an image URL. That is
 * deliberate and it is the licensing guarantee: a mood cannot accidentally
 * reference downloaded deity art, because the only thing it can reference is a
 * path drawn here. Everything is monochrome and takes its colour from the mood,
 * so one drawing serves all seven palettes.
 *
 * Three motifs already exist in `components/SacredArt.tsx` (sun rays, lotus
 * mandala, peacock feather) and are reused rather than redrawn.
 */

import { LotusMandala, PeacockFeather, SunRays } from '../SacredArt'
import type { SacredSymbolId } from '@/lib/darshan/types'

interface SymbolProps {
  className?: string
  color?: string
}

/** Concentric ripples on still water — the sea of 2.70. */
export function StillWater({ className = '', color = '#8FB8C9' }: SymbolProps) {
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden="true">
      {[26, 46, 66, 86].map((r, i) => (
        <ellipse
          key={r}
          cx="100"
          cy="120"
          rx={r}
          ry={r * 0.3}
          fill="none"
          stroke={color}
          strokeOpacity={0.55 - i * 0.1}
          strokeWidth="1.6"
        />
      ))}
      <circle cx="100" cy="120" r="5" fill={color} fillOpacity="0.5" />
    </svg>
  )
}

/** The unflickering lamp of 6.19 — a diya with a steady flame. */
export function LampFlame({ className = '', color = '#D4A017' }: SymbolProps) {
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden="true">
      {/* flame */}
      <path
        d="M100 44 C114 70 122 84 122 98 C122 116 112 128 100 128 C88 128 78 116 78 98 C78 84 86 70 100 44 Z"
        fill={color}
        fillOpacity="0.5"
      />
      <path
        d="M100 70 C107 86 111 94 111 102 C111 112 106 118 100 118 C94 118 89 112 89 102 C89 94 93 86 100 70 Z"
        fill={color}
        fillOpacity="0.85"
      />
      {/* diya bowl */}
      <path d="M52 136 C52 156 74 168 100 168 C126 168 148 156 148 136 Z" fill={color} fillOpacity="0.35" />
      <path d="M46 136 H154" stroke={color} strokeOpacity="0.6" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

/**
 * A cosmic mandala — nested rotations of sacred geometry.
 *
 * Used for the Vishwaroop mood. Abstract on purpose: vastness expressed as
 * order and scale, never as multiplied faces or anything that could read as
 * horror. See docs/DARSHAN.md § What Vishwaroop must never become.
 */
export function CosmicMandala({ className = '', color = '#6C63C4' }: SymbolProps) {
  const rings = [88, 70, 52, 34]
  const spokes = Array.from({ length: 24 }, (_, i) => (i * 360) / 24)
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden="true">
      {rings.map((r, i) => (
        <circle
          key={r}
          cx="100"
          cy="100"
          r={r}
          fill="none"
          stroke={color}
          strokeOpacity={0.5 - i * 0.07}
          strokeWidth="1"
          strokeDasharray={i % 2 ? '3 7' : undefined}
        />
      ))}
      <g stroke={color} strokeOpacity="0.28" strokeWidth="0.8">
        {spokes.map((deg) => (
          <line key={deg} x1="100" y1="12" x2="100" y2="34" transform={`rotate(${deg} 100 100)`} />
        ))}
      </g>
      {/* twelve-petal heart */}
      <g fill={color} fillOpacity="0.22">
        {Array.from({ length: 12 }, (_, i) => (
          <ellipse key={i} cx="100" cy="76" rx="6" ry="22" transform={`rotate(${i * 30} 100 100)`} />
        ))}
      </g>
      <circle cx="100" cy="100" r="8" fill={color} fillOpacity="0.5" />
    </svg>
  )
}

/** A still, schematic chakra for use as a background motif (not the brand mark). */
export function ChakraGlyph({ className = '', color = '#D4A017' }: SymbolProps) {
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden="true">
      <circle cx="100" cy="100" r="78" fill="none" stroke={color} strokeOpacity="0.5" strokeWidth="3" />
      <circle cx="100" cy="100" r="60" fill="none" stroke={color} strokeOpacity="0.3" strokeWidth="1" />
      <g stroke={color} strokeOpacity="0.4" strokeWidth="2.4" strokeLinecap="round">
        {Array.from({ length: 16 }, (_, i) => (
          <line key={i} x1="100" y1="26" x2="100" y2="44" transform={`rotate(${(i * 360) / 16} 100 100)`} />
        ))}
      </g>
      <circle cx="100" cy="100" r="14" fill={color} fillOpacity="0.4" />
    </svg>
  )
}

/**
 * Render whichever symbol a mood asks for. Unknown ids fall back to the lotus
 * mandala rather than rendering nothing — a missing motif must never leave a
 * hole in the card.
 */
export function MoodSymbol({
  symbol,
  className = '',
  color,
}: {
  symbol: SacredSymbolId
  className?: string
  color?: string
}) {
  switch (symbol) {
    case 'sun_rays':
      return <SunRays className={className} />
    case 'peacock_feather':
      return <PeacockFeather className={className} />
    case 'still_water':
      return <StillWater className={className} color={color} />
    case 'lamp_flame':
      return <LampFlame className={className} color={color} />
    case 'cosmic_mandala':
      return <CosmicMandala className={className} color={color} />
    case 'sudarshan_chakra':
      return <ChakraGlyph className={className} color={color} />
    case 'lotus_mandala':
    default:
      return <LotusMandala className={className} />
  }
}
