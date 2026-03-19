import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getUserPredictions } from '../api/leaderboard'

const backdrop = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
}

const panel = {
  hidden: { y: '100%', opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: 'spring', damping: 28, stiffness: 300 } },
  exit: { y: '100%', opacity: 0, transition: { duration: 0.2 } },
}

export default function UserPredictionsModal({ user, onClose }) {
  const [predictions, setPredictions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!user) return
    setLoading(true)
    setError(null)
    getUserPredictions(user.user_id)
      .then(({ data }) => setPredictions(data))
      .catch(() => setError('Could not load predictions'))
      .finally(() => setLoading(false))
  }, [user?.user_id])

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  if (!user) return null

  const driverLabel = (driver) => {
    if (!driver) return '—'
    return `${driver.forename} ${driver.surname}`
  }

  const teamColor = (driver) =>
    driver?.current_team?.primary_color_hex || '#E8001C'

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
        variants={backdrop}
        initial="hidden"
        animate="visible"
        exit="hidden"
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

        <motion.div
          className="relative w-full max-w-lg max-h-[85vh] bg-f1-dark border border-f1-accent rounded-t-2xl md:rounded-2xl overflow-hidden flex flex-col"
          variants={panel}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-f1-accent/30 shrink-0">
            {user.avatar_url ? (
              <img src={user.avatar_url} alt="" className="w-10 h-10 rounded-full" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-f1-accent flex items-center justify-center text-sm font-bold">
                {user.display_name?.[0]?.toUpperCase() || '?'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h2 className="font-heading font-bold text-lg truncate">{user.display_name || 'Anonymous'}</h2>
              <p className="text-f1-muted text-xs">{user.total_points.toLocaleString()} pts — #{user.rank}</p>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-f1-mid hover:bg-f1-accent flex items-center justify-center text-f1-muted hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
            {loading && (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-24 rounded-xl bg-f1-accent/20 animate-pulse" />
                ))}
              </div>
            )}

            {error && (
              <p className="text-center text-f1-muted py-8">{error}</p>
            )}

            {!loading && !error && predictions.length === 0 && (
              <p className="text-center text-f1-muted py-8">No scored predictions yet.</p>
            )}

            {!loading && !error && predictions.map((pred) => {
              const winnerCorrect = pred.winner_points > 0
              const poleCorrect = pred.pole_points > 0
              return (
                <motion.div
                  key={pred.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-f1-mid rounded-xl p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-heading font-bold text-sm">{pred.race?.name || 'Race'}</p>
                      <p className="text-f1-muted text-xs">
                        {pred.race?.country}
                        {pred.race?.race_date && ` — ${new Date(pred.race.race_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`}
                      </p>
                    </div>
                    <span className={`font-mono font-bold text-sm px-2 py-0.5 rounded ${pred.total_points_earned > 0 ? 'bg-green-500/15 text-green-400' : 'bg-f1-accent/30 text-f1-muted'}`}>
                      {pred.total_points_earned > 0 ? `+${pred.total_points_earned}` : '0'} pts
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Winner pick */}
                    <div className={`rounded-lg p-2.5 border ${winnerCorrect ? 'border-green-500/30 bg-green-500/5' : 'border-f1-accent/30 bg-f1-dark/50'}`}>
                      <p className="text-[10px] uppercase tracking-wider text-f1-muted mb-1">Winner Pick</p>
                      <div className="flex items-center gap-1.5">
                        <div
                          className="w-1 h-6 rounded-full shrink-0"
                          style={{ backgroundColor: teamColor(pred.predicted_winner) }}
                        />
                        <span className="text-sm font-medium truncate">{driverLabel(pred.predicted_winner)}</span>
                        <span className="ml-auto shrink-0">{winnerCorrect ? '✓' : '✗'}</span>
                      </div>
                    </div>

                    {/* Pole pick */}
                    <div className={`rounded-lg p-2.5 border ${poleCorrect ? 'border-green-500/30 bg-green-500/5' : 'border-f1-accent/30 bg-f1-dark/50'}`}>
                      <p className="text-[10px] uppercase tracking-wider text-f1-muted mb-1">Pole Pick</p>
                      <div className="flex items-center gap-1.5">
                        <div
                          className="w-1 h-6 rounded-full shrink-0"
                          style={{ backgroundColor: teamColor(pred.predicted_pole) }}
                        />
                        <span className="text-sm font-medium truncate">{driverLabel(pred.predicted_pole)}</span>
                        <span className="ml-auto shrink-0">{poleCorrect ? '✓' : '✗'}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
