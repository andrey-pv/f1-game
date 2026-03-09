import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { getUserStats, getBadges } from '../api/leaderboard'
import { getPredictionHistory } from '../api/predictions'
import BadgeGrid from '../components/BadgeGrid'
import StreakIndicator from '../components/StreakIndicator'
import LoadingSpinner from '../components/LoadingSpinner'
import useAuthStore from '../store/useAuthStore'
import { formatDate } from '../utils/formatDate'
import { getFlag } from '../assets/teamColors'

export default function ProfilePage() {
  const { user, logout } = useAuthStore()
  const [stats, setStats] = useState(null)
  const [allBadges, setAllBadges] = useState([])
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    Promise.all([
      getUserStats(user.id),
      getBadges(),
      getPredictionHistory(),
    ])
      .then(([{ data: statsData }, { data: badgesData }, { data: historyData }]) => {
        setStats(statsData)
        setAllBadges(badgesData)
        setHistory(historyData)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user])

  if (!user) return null
  if (loading) return <LoadingSpinner />

  // Build points progression chart data
  const chartData = [...history]
    .sort((a, b) => a.race_id - b.race_id)
    .reduce((acc, p) => {
      const prev = acc.length ? acc[acc.length - 1].cumulative : 0
      acc.push({ race: `R${p.race_id}`, points: p.total_points_earned, cumulative: prev + p.total_points_earned })
      return acc
    }, [])

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-24 md:pb-6 space-y-6">
      {/* User header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="card">
        <div className="flex items-center gap-4">
          {user.avatar_url ? (
            <img src={user.avatar_url} alt="" className="w-16 h-16 rounded-full" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-f1-accent flex items-center justify-center text-2xl font-bold">
              {user.display_name?.[0]?.toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="font-heading font-bold text-2xl">{user.display_name}</h1>
            <p className="text-f1-muted text-sm">{user.email}</p>
            <p className="text-f1-muted text-xs mt-1">Member since {formatDate(user.created_at)}</p>
          </div>
          <StreakIndicator streak={user.win_streak} size="lg" />
        </div>
      </motion.div>

      {/* Stats grid */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Total Points', value: stats.total_points.toLocaleString(), icon: '🏆', highlight: true },
            { label: 'Accuracy', value: `${stats.accuracy_pct}%`, icon: '🎯' },
            { label: 'Win Streak', value: stats.win_streak, icon: '🔥' },
            { label: 'Predictions', value: stats.total_predictions, icon: '📊' },
          ].map((stat) => (
            <div key={stat.label} className={`card text-center ${stat.highlight ? 'border-f1-gold/30' : ''}`}>
              <div className="text-2xl mb-1">{stat.icon}</div>
              <p className={`font-heading font-bold text-2xl tabular-nums ${stat.highlight ? 'text-f1-gold' : ''}`}>
                {stat.value}
              </p>
              <p className="text-f1-muted text-xs">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Points progression chart */}
      {chartData.length > 1 && (
        <div className="card">
          <h2 className="font-heading font-bold text-lg mb-4">Points Progression</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#0F3460" />
              <XAxis dataKey="race" tick={{ fill: '#94A3B8', fontSize: 10 }} />
              <YAxis tick={{ fill: '#94A3B8', fontSize: 10 }} />
              <Tooltip
                contentStyle={{ background: '#16213E', border: '1px solid #0F3460', borderRadius: 8 }}
                labelStyle={{ color: '#94A3B8' }}
              />
              <Line type="monotone" dataKey="cumulative" stroke="#E8001C" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Badges */}
      {allBadges.length > 0 && (
        <div className="card">
          <h2 className="font-heading font-bold text-lg mb-4">Badges</h2>
          <BadgeGrid allBadges={allBadges} earnedBadges={stats?.badges || []} />
        </div>
      )}

      {/* Prediction history */}
      {history.length > 0 && (
        <div className="card">
          <h2 className="font-heading font-bold text-lg mb-4">Prediction History</h2>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {history.map((pred) => (
              <div key={pred.id} className="flex items-center gap-3 p-3 bg-f1-accent/10 rounded-lg text-sm">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{pred.race?.name || `Race ${pred.race_id}`}</p>
                  <p className="text-f1-muted text-xs">
                    Winner: {pred.predicted_winner?.surname || '?'} · Pole: {pred.predicted_pole?.surname || '?'}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  {pred.total_points_earned > 0 ? (
                    <span className="text-f1-gold font-mono font-bold">+{pred.total_points_earned}</span>
                  ) : pred.is_locked ? (
                    <span className="text-f1-muted font-mono">0</span>
                  ) : (
                    <span className="text-blue-400 text-xs">Pending</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sign out */}
      <button
        onClick={logout}
        className="w-full py-3 text-f1-muted hover:text-red-400 transition-colors text-sm font-medium min-h-[44px]"
      >
        Sign out
      </button>
    </div>
  )
}
