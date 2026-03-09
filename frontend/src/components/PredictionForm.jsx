import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import DriverCard from './DriverCard'
import CountdownTimer from './CountdownTimer'
import usePredictionsStore from '../store/usePredictionsStore'

export default function PredictionForm({ race, drivers, existingPrediction, locked }) {
  const [step, setStep] = useState(1)
  const [winnerId, setWinnerId] = useState(existingPrediction?.predicted_winner_id || null)
  const [poleId, setPoleId] = useState(existingPrediction?.predicted_pole_id || null)
  const [search, setSearch] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const { submitPrediction, loading, error } = usePredictionsStore()

  useEffect(() => {
    if (existingPrediction) {
      setWinnerId(existingPrediction.predicted_winner_id)
      setPoleId(existingPrediction.predicted_pole_id)
    }
  }, [existingPrediction])

  const filtered = drivers.filter((d) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      d.surname?.toLowerCase().includes(q) ||
      d.forename?.toLowerCase().includes(q) ||
      d.code?.toLowerCase().includes(q) ||
      d.current_team?.name?.toLowerCase().includes(q)
    )
  })

  const winnerDriver = drivers.find((d) => d.id === winnerId)
  const poleDriver = drivers.find((d) => d.id === poleId)

  const handleSubmit = async () => {
    try {
      await submitPrediction(race.id, winnerId, poleId)
      setSubmitted(true)
      setShowConfirm(false)
    } catch (e) {
      // error handled in store
    }
  }

  if (locked) {
    return (
      <div className="card border-orange-500/30 text-center py-8">
        <p className="text-2xl mb-2">🔒</p>
        <p className="font-heading font-bold text-lg">Predictions Locked</p>
        <p className="text-f1-muted text-sm mt-1">Qualifying has started or is imminent.</p>
        {existingPrediction && (
          <div className="mt-4 p-3 bg-f1-accent/20 rounded-lg text-sm">
            <p className="text-f1-muted">Your prediction:</p>
            <p className="font-bold mt-1">
              Winner: {existingPrediction.predicted_winner?.forename} {existingPrediction.predicted_winner?.surname}
            </p>
            <p className="font-bold">
              Pole: {existingPrediction.predicted_pole?.forename} {existingPrediction.predicted_pole?.surname}
            </p>
          </div>
        )}
      </div>
    )
  }

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="card border-green-500/30 text-center py-8"
      >
        <p className="text-4xl mb-3">🎯</p>
        <p className="font-heading font-bold text-xl text-green-400">Prediction Submitted!</p>
        <div className="mt-4 space-y-2 text-sm">
          <p>Race Winner: <strong>{winnerDriver?.forename} {winnerDriver?.surname}</strong></p>
          <p>Pole Sitter: <strong>{poleDriver?.forename} {poleDriver?.surname}</strong></p>
        </div>
        <p className="text-f1-muted text-xs mt-4">Good luck! Results after the race.</p>
      </motion.div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Countdown to lock */}
      {race.qualifying_date && (
        <div className="card">
          <CountdownTimer
            targetDate={new Date(new Date(race.qualifying_date).getTime() - 15 * 60 * 1000)}
            label="Predictions lock in"
          />
        </div>
      )}

      {/* Step indicator */}
      <div className="flex gap-2">
        {[1, 2].map((s) => (
          <button
            key={s}
            onClick={() => s < step || (s === 2 && winnerId) ? setStep(s) : null}
            className={`flex-1 py-2 rounded-lg font-heading font-bold text-sm transition-colors ${
              step === s ? 'bg-f1-red text-white' : winnerId && s === 2 ? 'bg-f1-accent text-white' : 'bg-f1-mid text-f1-muted'
            }`}
          >
            {s === 1 ? '1. Race Winner' : '2. Pole Sitter'}
          </button>
        ))}
      </div>

      {/* Current selection display */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className={`p-3 rounded-lg border ${winnerId ? 'border-f1-red/50 bg-f1-red/5' : 'border-f1-accent/30 bg-f1-mid'}`}>
          <p className="text-f1-muted text-xs mb-1">Race Winner</p>
          <p className="font-bold truncate">
            {winnerDriver ? `${winnerDriver.forename} ${winnerDriver.surname}` : 'Not selected'}
          </p>
        </div>
        <div className={`p-3 rounded-lg border ${poleId ? 'border-blue-500/50 bg-blue-500/5' : 'border-f1-accent/30 bg-f1-mid'}`}>
          <p className="text-f1-muted text-xs mb-1">Pole Sitter</p>
          <p className="font-bold truncate">
            {poleDriver ? `${poleDriver.forename} ${poleDriver.surname}` : 'Not selected'}
          </p>
        </div>
      </div>

      {/* Search */}
      <input
        className="input"
        placeholder="Search drivers..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Driver grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.15 }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-80 overflow-y-auto pr-1"
        >
          {filtered.map((driver) => (
            <DriverCard
              key={driver.id}
              driver={driver}
              selected={step === 1 ? winnerId === driver.id : poleId === driver.id}
              onClick={() => {
                if (step === 1) {
                  setWinnerId(driver.id)
                  setStep(2)
                } else {
                  setPoleId(driver.id)
                }
              }}
            />
          ))}
        </motion.div>
      </AnimatePresence>

      {/* Submit */}
      {winnerId && poleId && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="btn-primary w-full"
          onClick={() => setShowConfirm(true)}
        >
          {existingPrediction ? 'Update Prediction' : 'Submit Prediction'}
        </motion.button>
      )}

      {error && <p className="text-red-400 text-sm text-center">{error}</p>}

      {/* Confirmation modal */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-end md:items-center justify-center z-50 p-4"
            onClick={() => setShowConfirm(false)}
          >
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              className="card w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-heading font-bold text-xl mb-4">Confirm Prediction</h3>
              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between p-3 bg-f1-accent/20 rounded-lg">
                  <span className="text-f1-muted">Race Winner</span>
                  <span className="font-bold">{winnerDriver?.forename} {winnerDriver?.surname}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-f1-accent/20 rounded-lg">
                  <span className="text-f1-muted">Pole Sitter</span>
                  <span className="font-bold">{poleDriver?.forename} {poleDriver?.surname}</span>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowConfirm(false)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={handleSubmit} disabled={loading} className="btn-primary flex-1">
                  {loading ? 'Submitting...' : 'Confirm'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
