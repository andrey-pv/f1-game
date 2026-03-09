import { useMemo } from 'react'
import { isLocked } from '../utils/raceStatus'

export default function useRaceStatus(race) {
  return useMemo(() => {
    if (!race) return { locked: false, upcoming: false, completed: false }
    return {
      locked: isLocked(race),
      upcoming: race.status === 'upcoming',
      completed: race.status === 'completed',
      racing: race.status === 'racing',
    }
  }, [race?.status, race?.qualifying_date])
}
