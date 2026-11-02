import Link from 'next/link'

/** Carries a seeker from a single verse into the whole chapter it belongs to. */
export default function ChapterBridge({ chapter }: { chapter: number }) {
  return (
    <Link href={`/gita/${chapter}`} className="text-gold-soft/75 hover:text-saffron text-xs flex items-center gap-1 transition-colors">
      Read all of Chapter {chapter}
    </Link>
  )
}
