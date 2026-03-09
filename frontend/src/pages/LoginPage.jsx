import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import useAuthStore from '../store/useAuthStore'

export default function LoginPage() {
  const { user, login, loading, error } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (user) navigate('/', { replace: true })
  }, [user])

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        {/* Header */}
        <div className="text-center mb-10">
          <div className="text-6xl mb-4">🏎</div>
          <h1 className="font-heading font-bold text-4xl tracking-widest">
            <span className="text-f1-red">F1</span> PREDICTOR
          </h1>
          <p className="text-f1-muted mt-2 text-sm">
            Predict race winners. Earn points. Dominate the leaderboard.
          </p>
        </div>

        {/* Sign in card */}
        <div className="card space-y-6">
          <div className="text-center">
            <h2 className="font-heading font-bold text-xl">Get Started</h2>
            <p className="text-f1-muted text-sm mt-1">Sign in with your Google account</p>
          </div>

          <button
            onClick={login}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white text-gray-900 font-bold py-3 px-6 rounded-lg
                       hover:bg-gray-100 active:scale-95 transition-all min-h-[44px] disabled:opacity-50"
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {loading ? 'Signing in...' : 'Sign in with Google'}
          </button>

          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}

          <p className="text-f1-muted text-xs text-center">
            By signing in, you agree to our terms and privacy policy.
          </p>
        </div>

        {/* Features */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          {[
            { icon: '🎯', text: 'Predict races' },
            { icon: '🏆', text: 'Earn points' },
            { icon: '📊', text: 'Compete globally' },
          ].map((f) => (
            <div key={f.text}>
              <div className="text-2xl mb-1">{f.icon}</div>
              <p className="text-f1-muted text-xs">{f.text}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
