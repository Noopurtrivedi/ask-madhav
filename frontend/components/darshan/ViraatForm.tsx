'use client'

/**
 * ViraatForm — the Vishwaroop of Mahavishnu (Gita 11.7, 11.15).
 *
 * One painting, on purpose. In the traditional layout, a level row of heads runs
 * across his shoulders (Shiva, Ganesha, Brahma; Narasimha, Hanuman, Surya) under
 * the serpent canopy, and his eyes are open. It is the avatar alone, head to feet
 * with a transparent background (vishwaroop-avatar-flat2.webp), standing on the stage
 * with Arjuna at his feet, so it never reads as a framed picture.
 * It is Mahavishnu: mature and cosmic, never the youthful Krishna. The devouring
 * imagery of 11.25–30 is left out, because the app must never create fear.
 *
 * It grows as it manifests, and `ending` swells it past the frame into light.
 * At `full` tier it is a real 3D surface (three/ViraatFigure); everywhere else,
 * it is the flat avatar, which never needs WebGL.
 */

import dynamic from 'next/dynamic'
import Image from 'next/image'
import { useCallback, useEffect, useState } from 'react'

const ViraatFigure = dynamic(() => import('./three/ViraatFigure'), { ssr: false, loading: () => null })

export default function ViraatForm({ show, ending, use3D }: { show: boolean; ending: boolean; use3D: boolean }) {
  const [ready, setReady] = useState(false)
  const [late, setLate] = useState(false)
  const onReady = useCallback(() => setReady(true), [])

  // The figure loads unseen behind the ring. If it still has not arrived a few
  // seconds into the form, the flat avatar stands in rather than leave nothing.
  useEffect(() => {
    if (!show || !use3D) return
    const id = window.setTimeout(() => setLate(true), 4000)
    return () => window.clearTimeout(id)
  }, [show, use3D])

  const flat = show && (!use3D || (late && !ready))
  return (
    <>
      {show && <div className="viraat-aura" aria-hidden="true" />}
      {flat && (
        <div className={`viraat ${ending ? 'viraat-ending' : ''}`} aria-hidden="true">
          <div className="viraat-grow">
            <Image src="/art/dash/vishwaroop-avatar-flat2.webp" alt="" fill sizes="(min-width: 768px) 60vh, 100vw" className="object-contain" />
          </div>
        </div>
      )}
      {use3D && <ViraatFigure show={show} ending={ending} onReady={onReady} />}
    </>
  )
}
