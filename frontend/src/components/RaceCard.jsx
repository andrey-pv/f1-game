import { Link } from 'react-router-dom'
import { formatDate } from '../utils/formatDate'
import { getRaceStatusLabel, getRaceStatusColor } from '../utils/raceStatus'
import { getFlag } from '../assets/teamColors'

export default function RaceCard({ race, hasPrediction, hasScore }) {
  return (
    <Link to={`/races/${race.id}`} className="block">
      <div className="card hover:border-f1-red transition-colors duration-200 flex items-center gap-4">
        <div className="text-3xl shrink-0">{getFlag(race.country)}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-f1-muted text-xs font-mono">R{race.round}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full border ${getRaceStatusColor(race.status)}`}>
              {getRaceStatusLabel(race.status)}
            </span>
          </div>
          <h3 className="font-heading font-bold text-lg leading-tight truncate">{race.name}</h3>
          <p className="text-f1-muted text-sm truncate">{race.circuit}</p>
          <p className="text-f1-muted text-xs mt-1">{formatDate(race.race_date)}</p>
        </div>
        <div className="shrink-0 flex flex-col items-end gap-1">
          {hasPrediction && (
            <span title="Prediction submitted" className="text-lg">✅</span>
          )}
          {hasScore && (
            <span title="Points earned" className="text-lg">🏆</span>
          )}
        </div>
      </div>
    </Link>
  )
}
