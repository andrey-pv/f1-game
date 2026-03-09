export default function BadgeGrid({ allBadges = [], earnedBadges = [] }) {
  const earnedSlugs = new Set(earnedBadges.map((b) => b.badge?.slug || b.slug))

  return (
    <div className="grid grid-cols-4 md:grid-cols-5 gap-3">
      {allBadges.map((badge) => {
        const earned = earnedSlugs.has(badge.slug)
        return (
          <div
            key={badge.slug}
            title={`${badge.name}: ${badge.description}`}
            className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition-all
              ${earned
                ? 'border-f1-gold/50 bg-f1-gold/10'
                : 'border-f1-accent/30 bg-f1-mid/50 opacity-40 grayscale'
              }`}
          >
            <span className="text-2xl">{badge.icon}</span>
            <p className="text-xs text-center leading-tight text-f1-muted font-medium line-clamp-2">
              {badge.name}
            </p>
          </div>
        )
      })}
    </div>
  )
}
