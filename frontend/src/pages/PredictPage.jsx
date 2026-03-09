import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getRaces, getRace, getDrivers } from '../api/races'
import { getPrediction } from '../api/predictions'
import PredictionForm from '../components/PredictionForm'
import LoadingSpinner from '../components/LoadingSpinner'
import useAuthStore from '../store/useAuthStore'
import { getFlag } from '../assets/teamColors'
import { isLocked } from '../utils/raceStatus'

export default function PredictPage() {
  const { race_id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [race, setRace] = useState(null)
  const [drivers, setDrivers] = useState([])
  const [prediction, setPrediction] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadRace = async () => {
      try {
        let raceId = race_id
        if (!raceId) {
          // Find next upcoming race
          const { data: races } = await getRaces()
          const next = races.find((r) => r.status === 'upcoming' || r.status === 'qualifying')
          if (!next) { setLoading(false); return }
          raceId = next.id
          navigate(`/predict/${raceId}`, { replace: true })
          return
        }
        const [{ data: raceData }, { data: driversData }] = await Promise.all([getRace(raceId), getDrivers()])
        setRace(raceData)
        setDrivers(driversData)
        if (user) {
          const predRes = await getPrediction(raceId).catch(() => null)
          if (predRes) setPrediction(predRes.data)
        }
      } finally {
        setLoading(false)
      }
    }
    loadRace()
  }, [race_id, user])

  if (loading) return <LoadingSpinner />
  if (!race) return (
    <div className="text-center py-16 px-4">
      <p className="text-4xl mb-3">🏁</p>
      <p className="font-heading font-bold text-xl">No upcoming races</p>
      <p className="text-f1-muted mt-1">Check back before the next race weekend.</p>
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-6">
      <div className="mb-6">
        <h1 className="font-heading font-bold text-2xl">
          {getFlag(race.country)} {race.name}
        </h1>
        <p className="text-f1-muted text-sm mt-1">{race.circuit} · Round {race.round}</p>
      </div>

      <PredictionForm
        race={race}
        drivers={drivers}
        existingPrediction={prediction}
        locked={isLocked(race)}
      />
    </div>
  )
}
