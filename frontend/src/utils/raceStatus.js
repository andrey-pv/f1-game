export function getRaceStatusLabel(status) {
  const labels = {
    upcoming: 'Upcoming',
    qualifying: 'Qualifying',
    racing: 'Race Weekend',
    completed: 'Completed',
  }
  return labels[status] || status
}

export function getRaceStatusColor(status) {
  const colors = {
    upcoming: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    qualifying: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    racing: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    completed: 'bg-green-500/20 text-green-300 border-green-500/30',
  }
  return colors[status] || 'bg-gray-500/20 text-gray-300'
}

export function isLocked(race) {
  if (!race) return false
  if (race.status === 'completed' || race.status === 'racing') return true
  if (race.qualifying_date) {
    const lockTime = new Date(race.qualifying_date).getTime() - 15 * 60 * 1000
    return Date.now() >= lockTime
  }
  return false
}
