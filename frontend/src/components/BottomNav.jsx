import { Link, useLocation } from 'react-router-dom'
import useAuthStore from '../store/useAuthStore'

const NAV_ITEMS = [
  { to: '/', icon: '🏠', label: 'Home' },
  { to: '/races', icon: '📅', label: 'Races' },
  { to: '/predict', icon: '🎯', label: 'Predict', authRequired: true },
  { to: '/leaderboard', icon: '🏆', label: 'Board' },
  { to: '/profile', icon: '👤', label: 'Profile', authRequired: true },
]

export default function BottomNav() {
  const location = useLocation()
  const { user } = useAuthStore()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-f1-dark border-t border-f1-accent z-40"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="flex">
        {NAV_ITEMS.filter((item) => !item.authRequired || user).map((item) => {
          const active = location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to))
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex-1 flex flex-col items-center justify-center py-3 min-h-[56px] transition-colors
                ${active ? 'text-f1-red' : 'text-f1-muted'}`}
            >
              <span className="text-xl leading-none">{item.icon}</span>
              <span className="text-xs mt-1 font-medium">{item.label}</span>
            </Link>
          )
        })}
        {!user && (
          <Link to="/login" className="flex-1 flex flex-col items-center justify-center py-3 min-h-[56px] text-f1-muted">
            <span className="text-xl leading-none">🔑</span>
            <span className="text-xs mt-1 font-medium">Sign in</span>
          </Link>
        )}
      </div>
    </nav>
  )
}
