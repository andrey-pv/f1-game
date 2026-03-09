import useCountdown from '../hooks/useCountdown'

function Digit({ value, label }) {
  return (
    <div className="flex flex-col items-center">
      <span className="font-heading font-bold text-3xl md:text-4xl tabular-nums leading-none">
        {String(value).padStart(2, '0')}
      </span>
      <span className="text-f1-muted text-xs mt-1 uppercase tracking-wider">{label}</span>
    </div>
  )
}

export default function CountdownTimer({ targetDate, label = 'Race starts in' }) {
  const time = useCountdown(targetDate)

  if (!time) return null

  if (time.expired) {
    return <p className="text-f1-muted font-mono text-sm">Session started</p>
  }

  const urgentClass = time.urgent ? 'text-f1-red animate-pulse-fast' : 'text-f1-white'

  return (
    <div>
      {label && <p className="text-f1-muted text-xs uppercase tracking-widest mb-2">{label}</p>}
      <div className={`flex gap-3 md:gap-4 ${urgentClass}`}>
        {time.days > 0 && <Digit value={time.days} label="days" />}
        <Digit value={time.hours} label="hrs" />
        <Digit value={time.minutes} label="min" />
        <Digit value={time.seconds} label="sec" />
      </div>
    </div>
  )
}
