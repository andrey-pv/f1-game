import { useEffect, useState } from 'react'
import { getRaces } from '../api/races'
import { getPredictionHistory } from '../api/predictions'
import RaceCard from '../components/RaceCard'
import LoadingSpinner from '../components/LoadingSpinner'
import useAuthStore from '../store/useAuthStore'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function groupByMonth(races) {
  const groups = {}
  races.forEach((race) => {
    const month = race.race_date ? new Date(race.race_date).getMonth() : 12
    const key = race.race_date ? MONTHS[month] : 'TBD'
    if (!groups[key]) groups[key] = []
    groups[key].push(race)
  })
  return groups
}

export default function RacesPage() {
  const { user } = useAuthStore()
  const [races, setRaces] = useState([])
  const [predictions, setPredictions] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const promises = [getRaces()]
    if (user) promises.push(getPredictionHistory())
    Promise.all(promises)
      .then(([{ data: racesData }, predRes]) => {
        setRaces(racesData)
        if (predRes) {
          const map = {}
          predRes.data.forEach((p) => {
            map[p.race_id] = p
          })
          setPredictions(map)
        }
      })
      .finally(() => setLoading(false))
  }, [user])

  if (loading) return <LoadingSpinner />

  const groups = groupByMonth(races)

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-24 md:pb-6">
      <h1 className="font-heading font-bold text-2xl mb-6">
        {new Date().getFullYear()} Season Calendar
      </h1>

      {Object.entries(groups).map(([month, monthRaces]) => (
        <div key={month} className="mb-6">
          <h2 className="text-f1-muted text-sm font-medium uppercase tracking-wider mb-3 border-b border-f1-accent/30 pb-2">
            {month}
          </h2>
          <div className="space-y-2">
            {monthRaces.map((race) => (
              <RaceCard
                key={race.id}
                race={race}
                hasPrediction={!!predictions[race.id]}
                hasScore={predictions[race.id]?.total_points_earned > 0}
              />
            ))}
          </div>
        </div>
      ))}

      {races.length === 0 && (
        <div className="text-center py-12">
          <p className="text-4xl mb-3">📅</p>
          <p className="text-f1-muted">No races found. Data syncing...</p>
        </div>
      )}
    </div>
  )
}
