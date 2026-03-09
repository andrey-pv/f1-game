import StreakIndicator from './StreakIndicator'
import useAuthStore from '../store/useAuthStore'

const RANK_ICONS = { 1: '🥇', 2: '🥈', 3: '🥉' }

export default function LeaderboardTable({ entries = [], loading }) {
  const user = useAuthStore((s) => s.user)

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="card h-14 animate-pulse bg-f1-accent/20" />
        ))}
      </div>
    )
  }

  if (!entries.length) {
    return <p className="text-center text-f1-muted py-12">No entries yet. Be the first to predict!</p>
  }

  return (
    <div className="overflow-x-auto -mx-4 md:mx-0">
      <table className="w-full min-w-[520px]">
        <thead>
          <tr className="text-f1-muted text-xs uppercase tracking-wider">
            <th className="sticky left-0 bg-f1-dark px-4 py-2 text-left w-12">Rank</th>
            <th className="px-3 py-2 text-left">Player</th>
            <th className="px-3 py-2 text-right font-mono">Points</th>
            <th className="px-3 py-2 text-center">Streak</th>
            <th className="px-3 py-2 text-right font-mono">Predictions</th>
            <th className="px-3 py-2 text-right font-mono">Accuracy</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-f1-accent/20">
          {entries.map((entry) => {
            const isMe = user && entry.user_id === user.id
            return (
              <tr
                key={entry.user_id}
                className={`transition-colors ${isMe ? 'bg-f1-gold/5 border border-f1-gold/30 rounded-lg' : 'hover:bg-f1-mid/50'}`}
              >
                <td className="sticky left-0 bg-inherit px-4 py-3 font-heading font-bold text-lg">
                  {RANK_ICONS[entry.rank] || (
                    <span className="font-mono text-f1-muted text-sm">#{entry.rank}</span>
                  )}
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    {entry.avatar_url ? (
                      <img src={entry.avatar_url} alt="" className="w-7 h-7 rounded-full shrink-0" loading="lazy" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-f1-accent flex items-center justify-center text-xs shrink-0">
                        {entry.display_name?.[0]?.toUpperCase() || '?'}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="font-medium text-sm truncate">{entry.display_name || 'Anonymous'}</span>
                        {isMe && <span className="text-xs bg-f1-gold/20 text-f1-gold px-1 rounded shrink-0">YOU</span>}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3 text-right font-mono font-bold text-f1-gold tabular-nums">
                  {entry.total_points.toLocaleString()}
                </td>
                <td className="px-3 py-3 text-center">
                  <StreakIndicator streak={entry.win_streak} />
                </td>
                <td className="px-3 py-3 text-right font-mono text-f1-muted tabular-nums">
                  {entry.predictions_made}
                </td>
                <td className="px-3 py-3 text-right font-mono tabular-nums">
                  <span className={entry.accuracy_pct >= 50 ? 'text-green-400' : 'text-f1-muted'}>
                    {entry.accuracy_pct}%
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
