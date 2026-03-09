import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import LeaderboardTable from '../components/LeaderboardTable'
import useLeaderboardStore from '../store/useLeaderboardStore'
import useAuthStore from '../store/useAuthStore'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const TABS = ['Global', 'Season']

export default function LeaderboardPage() {
  const { entries, total, myRank, loading, fetchLeaderboard, fetchMyRank } = useLeaderboardStore()
  const { user } = useAuthStore()
  const [tab, setTab] = useState('Global')

  useEffect(() => {
    fetchLeaderboard()
    if (user) fetchMyRank()
  }, [user])

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-24 md:pb-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading font-bold text-2xl">Leaderboard</h1>
        <span className="text-f1-muted text-sm">{total.toLocaleString()} players</span>
      </div>

      {/* My rank bar */}
      {user && myRank && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="card border-f1-gold/30 bg-f1-gold/5 flex items-center gap-4 mb-6"
        >
          <div className="text-2xl">📊</div>
          <div>
            <p className="font-heading font-bold text-lg">Your Rank: #{myRank.rank}</p>
            <p className="text-f1-muted text-sm">{myRank.total_points.toLocaleString()} points</p>
          </div>
        </motion.div>
      )}

      {/* Tab switcher */}
      <div className="flex gap-1 mb-4">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg font-medium text-sm min-h-[44px] transition-colors
              ${tab === t ? 'bg-f1-red text-white' : 'bg-f1-mid text-f1-muted hover:text-white'}`}
          >
            {t}
          </button>
        ))}
      </div>

      <LeaderboardTable entries={entries} loading={loading} />
    </div>
  )
}
