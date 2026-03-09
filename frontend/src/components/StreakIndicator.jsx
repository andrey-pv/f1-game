export default function StreakIndicator({ streak, size = 'sm' }) {
  if (!streak || streak < 3) return null

  const sizeClass = size === 'lg' ? 'text-xl' : 'text-sm'

  return (
    <span title={`${streak} race win streak`} className={`${sizeClass} inline-flex items-center gap-0.5`}>
      🔥<span className="font-mono font-bold text-orange-400">{streak}</span>
    </span>
  )
}
