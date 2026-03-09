import { getTeamColor } from '../assets/teamColors'

export default function DriverCard({ driver, selected, onClick, compact = false }) {
  const teamRef = driver.current_team?.team_ref
  const teamColor = driver.current_team?.primary_color_hex || getTeamColor(teamRef) || '#E8001C'
  const teamName = driver.current_team?.name || 'Unknown'

  if (compact) {
    return (
      <button
        onClick={onClick}
        className={`relative flex items-center gap-3 p-3 rounded-lg border-2 transition-all min-h-[44px] w-full text-left
          ${selected
            ? 'border-f1-red bg-f1-red/10'
            : 'border-f1-accent bg-f1-mid hover:border-f1-muted'
          }`}
        style={{ borderLeftColor: selected ? undefined : teamColor, borderLeftWidth: '4px' }}
      >
        <div className="flex-1 min-w-0">
          <p className="font-heading font-bold text-sm leading-tight">
            {driver.forename} {driver.surname}
          </p>
          <p className="text-f1-muted text-xs">{teamName}</p>
        </div>
        <span className="font-mono text-xs text-f1-muted shrink-0">{driver.code}</span>
        {selected && <span className="text-f1-red text-sm shrink-0">✓</span>}
      </button>
    )
  }

  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col items-center p-4 rounded-xl border-2 transition-all min-h-[44px]
        ${selected
          ? 'border-f1-red bg-f1-red/10 scale-105'
          : 'border-transparent bg-f1-mid hover:border-f1-accent'
        }`}
    >
      {/* Team color accent */}
      <div className="w-full h-1 rounded-full mb-3" style={{ backgroundColor: teamColor }} />
      <div className="w-12 h-12 rounded-full bg-f1-accent flex items-center justify-center mb-2 text-lg font-mono font-bold">
        {driver.code?.slice(0, 3) || '?'}
      </div>
      <p className="font-heading font-bold text-sm text-center leading-tight">
        {driver.forename}<br />{driver.surname}
      </p>
      <p className="text-f1-muted text-xs mt-1 text-center">{teamName}</p>
      {selected && (
        <div className="absolute top-2 right-2 w-5 h-5 bg-f1-red rounded-full flex items-center justify-center text-white text-xs">✓</div>
      )}
    </button>
  )
}
