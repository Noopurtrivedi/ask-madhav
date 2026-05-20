'use client'

export default function KrishnaAvatar() {
  return (
    <div className="relative w-48 h-48 mx-auto mb-8">
      {/* Outer glow */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-saffron/20 to-gold/20 blur-2xl" />

      {/* Spinning dashed ring */}
      <div
        className="absolute inset-2 rounded-full border border-saffron/30 spin-slow"
        style={{ borderStyle: 'dashed' }}
      />

      {/* Inner solid ring */}
      <div className="absolute inset-4 rounded-full border border-saffron/20" />

      {/* Avatar circle */}
      <div
        className="absolute inset-8 rounded-full bg-gradient-to-br from-saffron/80 to-gold/60 lotus-pulse
                   flex items-center justify-center shadow-2xl shadow-saffron/20"
      >
        <span className="text-5xl select-none">🦚</span>
      </div>

      {/* Decorative orbit dots */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
        <div
          key={deg}
          className="absolute w-1.5 h-1.5 rounded-full bg-saffron/60"
          style={{
            top: `${50 - 46 * Math.cos((deg * Math.PI) / 180)}%`,
            left: `${50 + 46 * Math.sin((deg * Math.PI) / 180)}%`,
            transform: 'translate(-50%, -50%)',
          }}
        />
      ))}
    </div>
  )
}
