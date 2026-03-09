import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { getRaces } from '../api/races'
import useAuthStore from '../store/useAuthStore'
import useUserRank from '../hooks/useUserRank'
import CountdownTimer from '../components/CountdownTimer'
import RaceCard from '../components/RaceCard'
import LoadingSpinner from '../components/LoadingSpinner'
import { getFlag } from '../assets/teamColors'
import { formatDate } from '../utils/formatDate'

export default function HomePage() {
  const { user } = useAuthStore()
  const myRank = useUserRank()
  const [races, setRaces] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getRaces()
      .then(({ data }) => setRaces(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const nextRace = races.find((r) => r.status === 'upcoming' || r.status === 'qualifying')
  const recentRaces = races.filter((r) => r.status === 'completed').slice(-3).reverse()

  if (loading) return <LoadingSpinner fullScreen />

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-8 pb-24 md:pb-6">

      {/* Hero — Next Race */}
      {nextRace ? (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card border-f1-red/40 bg-gradient-to-br from-f1-mid to-f1-dark"
        >
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-f1-muted text-xs uppercase tracking-widest mb-1">Next Race</p>
              <h1 className="font-heading font-bold text-2xl md:text-3xl">
                {getFlag(nextRace.country)} {nextRace.name}
              </h1>
              <p className="text-f1-muted text-sm mt-1">{nextRace.circuit}</p>
              <p className="text-f1-muted text-sm">{formatDate(nextRace.race_date)}</p>
            </div>
            <div className="shrink-0">
              <CountdownTimer targetDate={nextRace.race_date} label="Race in" />
            </div>
          </div>

          {user ? (
            <Link
              to={`/predict/${nextRace.id}`}
              className="btn-primary mt-4 w-full md:w-auto"
            >
              🎯 Place Your Prediction
            </Link>
          ) : (
            <Link to="/login" className="btn-primary mt-4 w-full md:w-auto">
              Sign in to Predict
            </Link>
          )}
        </motion.div>
      ) : (
        <div className="card text-center py-8">
          <p className="text-4xl mb-3">🏁</p>
          <h2 className="font-heading font-bold text-2xl">Season Complete</h2>
          <p className="text-f1-muted mt-1">Check back next season!</p>
        </div>
      )}

      {/* Quick stats for logged-in users */}
      {user && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-3"
        >
          {[
            { label: 'Your Points', value: user.total_points?.toLocaleString() || '0', icon: '🏆' },
            { label: 'Global Rank', value: myRank ? `#${myRank.rank}` : '—', icon: '📊' },
            { label: 'Win Streak', value: user.win_streak || 0, icon: user.win_streak >= 3 ? '🔥' : '🎯' },
          ].map((stat) => (
            <div key={stat.label} className="card text-center">
              <div className="text-2xl mb-1">{stat.icon}</div>
              <p className="font-heading font-bold text-xl tabular-nums">{stat.value}</p>
              <p className="text-f1-muted text-xs">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      )}

      {/* Season progress */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-heading font-bold text-lg">Season {new Date().getFullYear()}</h2>
          <span className="text-f1-muted text-sm">Round {races.filter(r => r.status === 'completed').length} / {races.length}</span>
        </div>
        {races.length > 0 && (
          <div className="w-full bg-f1-accent/30 rounded-full h-2">
            <div
              className="bg-f1-red h-2 rounded-full transition-all"
              style={{ width: `${(races.filter(r => r.status === 'completed').length / races.length) * 100}%` }}
            />
          </div>
        )}
      </div>

      {/* Recent results */}
      {recentRaces.length > 0 && (
        <div>
          <h2 className="font-heading font-bold text-lg mb-3">Recent Results</h2>
          <div className="space-y-2">
            {recentRaces.map((race) => (
              <RaceCard key={race.id} race={race} />
            ))}
          </div>
        </div>
      )}

      {/* CTA if not logged in */}
      {!user && (
        <div className="card text-center bg-gradient-to-br from-f1-accent to-f1-mid">
          <h2 className="font-heading font-bold text-2xl mb-2">Join the Competition</h2>
          <p className="text-f1-muted mb-4">Predict races, earn points, and see where you rank globally.</p>
          <Link to="/login" className="btn-primary">Sign in with Google</Link>
        </div>
      )}
    </div>
  )
}
