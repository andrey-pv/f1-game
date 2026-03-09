import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { getRace, getDrivers } from '../api/races'
import { getPrediction } from '../api/predictions'
import PredictionForm from '../components/PredictionForm'
import LoadingSpinner from '../components/LoadingSpinner'
import useAuthStore from '../store/useAuthStore'
import { formatDateTime } from '../utils/formatDate'
import { getFlag } from '../assets/teamColors'
import { getRaceStatusLabel, getRaceStatusColor, isLocked } from '../utils/raceStatus'

const TABS = ['Overview', 'Qualifying', 'Race Results', 'Predict']

export default function RaceDetailPage() {
  const { id } = useParams()
  const { user } = useAuthStore()
  const [race, setRace] = useState(null)
  const [drivers, setDrivers] = useState([])
  const [prediction, setPrediction] = useState(null)
  const [tab, setTab] = useState('Overview')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const promises = [getRace(id), getDrivers()]
    if (user) promises.push(getPrediction(id).catch(() => null))
    Promise.all(promises)
      .then(([{ data: raceData }, { data: driversData }, predRes]) => {
        setRace(raceData)
        setDrivers(driversData)
        if (predRes) setPrediction(predRes?.data)
      })
      .finally(() => setLoading(false))
  }, [id, user])

  if (loading) return <LoadingSpinner />
  if (!race) return <div className="text-center py-12 text-f1-muted">Race not found.</div>

  const locked = isLocked(race)
  const availableTabs = user ? TABS : TABS.filter((t) => t !== 'Predict')

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-24 md:pb-6">
      {/* Header */}
      <div className="card mb-6">
        <div className="flex items-start gap-4 flex-wrap">
          <div className="text-5xl">{getFlag(race.country)}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-f1-muted text-xs font-mono">Round {race.round}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full border ${getRaceStatusColor(race.status)}`}>
                {getRaceStatusLabel(race.status)}
              </span>
            </div>
            <h1 className="font-heading font-bold text-2xl md:text-3xl">{race.name}</h1>
            <p className="text-f1-muted">{race.circuit}</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
          {race.qualifying_date && (
            <div>
              <p className="text-f1-muted text-xs">Qualifying</p>
              <p className="font-medium">{formatDateTime(race.qualifying_date)}</p>
            </div>
          )}
          {race.race_date && (
            <div>
              <p className="text-f1-muted text-xs">Race</p>
              <p className="font-medium">{formatDateTime(race.race_date)}</p>
            </div>
          )}
          {race.sprint_date && (
            <div>
              <p className="text-f1-muted text-xs">Sprint</p>
              <p className="font-medium">{formatDateTime(race.sprint_date)}</p>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto">
        {availableTabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors min-h-[44px]
              ${tab === t ? 'bg-f1-red text-white' : 'bg-f1-mid text-f1-muted hover:text-white'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <motion.div key={tab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
        {tab === 'Overview' && (
          <div className="card">
            <h2 className="font-heading font-bold text-lg mb-3">Race Information</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-f1-muted">Circuit</dt><dd>{race.circuit}</dd></div>
              <div className="flex justify-between"><dt className="text-f1-muted">Country</dt><dd>{getFlag(race.country)} {race.country}</dd></div>
              {race.qualifying_date && <div className="flex justify-between"><dt className="text-f1-muted">Qualifying</dt><dd>{formatDateTime(race.qualifying_date)}</dd></div>}
              {race.race_date && <div className="flex justify-between"><dt className="text-f1-muted">Race</dt><dd>{formatDateTime(race.race_date)}</dd></div>}
            </dl>
          </div>
        )}

        {tab === 'Qualifying' && (
          <div>
            {race.qualifying_results?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-f1-muted text-xs uppercase border-b border-f1-accent/30">
                      <th className="text-left py-2 pr-3">Pos</th>
                      <th className="text-left py-2 pr-3">Driver</th>
                      <th className="text-right py-2 font-mono">Q3</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-f1-accent/10">
                    {race.qualifying_results.sort((a, b) => (a.position || 99) - (b.position || 99)).map((r) => (
                      <tr key={r.id}>
                        <td className="py-2 pr-3 font-mono font-bold">{r.position || '—'}</td>
                        <td className="py-2 pr-3">
                          <div className="font-medium">{r.driver?.forename} {r.driver?.surname}</div>
                          <div className="text-f1-muted text-xs">{r.team?.name}</div>
                        </td>
                        <td className="py-2 text-right font-mono text-f1-muted">{r.q3_time || r.q2_time || r.q1_time || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-f1-muted text-center py-8">Qualifying results not yet available.</p>
            )}
          </div>
        )}

        {tab === 'Race Results' && (
          <div>
            {race.race_results?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-f1-muted text-xs uppercase border-b border-f1-accent/30">
                      <th className="text-left py-2 pr-3">Pos</th>
                      <th className="text-left py-2 pr-3">Driver</th>
                      <th className="text-right py-2 font-mono">Pts</th>
                      <th className="text-right py-2 font-mono pr-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-f1-accent/10">
                    {race.race_results.sort((a, b) => (a.position || 99) - (b.position || 99)).map((r) => (
                      <tr key={r.id} className={r.position <= 3 ? 'bg-f1-gold/5' : ''}>
                        <td className="py-2 pr-3 font-mono font-bold">
                          {r.position === 1 ? '🥇' : r.position === 2 ? '🥈' : r.position === 3 ? '🥉' : r.position || 'DNF'}
                        </td>
                        <td className="py-2 pr-3">
                          <div className="font-medium">{r.driver?.forename} {r.driver?.surname}</div>
                          <div className="text-f1-muted text-xs">{r.team?.name}</div>
                        </td>
                        <td className="py-2 text-right font-mono tabular-nums">{r.points || 0}</td>
                        <td className="py-2 text-right font-mono text-f1-muted text-xs pr-2">
                          {r.fastest_lap ? '⚡ ' : ''}{r.status}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-f1-muted text-center py-8">Race results not yet available.</p>
            )}
          </div>
        )}

        {tab === 'Predict' && user && (
          <PredictionForm
            race={race}
            drivers={drivers}
            existingPrediction={prediction}
            locked={locked}
          />
        )}
      </motion.div>
    </div>
  )
}
