import { Link, useLocation } from 'react-router-dom'
import { useState } from 'react'
import useAuthStore from '../store/useAuthStore'

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { user, logout } = useAuthStore()
  const location = useLocation()

  const links = [
    { to: '/', label: 'Home' },
    { to: '/races', label: 'Races' },
    { to: '/leaderboard', label: 'Leaderboard' },
  ]

  return (
    <nav className="bg-f1-dark border-b border-f1-accent sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="font-heading font-bold text-xl tracking-widest">
          <span className="text-f1-red">F1</span> PREDICTOR
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={`text-sm font-medium transition-colors ${
                location.pathname === l.to ? 'text-f1-red' : 'text-f1-muted hover:text-white'
              }`}
            >
              {l.label}
            </Link>
          ))}
          {user ? (
            <div className="flex items-center gap-3">
              <Link to="/profile" className="flex items-center gap-2 text-sm text-f1-muted hover:text-white">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt="" className="w-7 h-7 rounded-full" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-f1-accent flex items-center justify-center text-xs">
                    {user.display_name?.[0]?.toUpperCase()}
                  </div>
                )}
                <span className="font-medium">{user.display_name?.split(' ')[0]}</span>
              </Link>
              <button onClick={logout} className="text-xs text-f1-muted hover:text-white transition-colors">
                Sign out
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn-primary text-sm py-2 px-4">Sign in</Link>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <div className="space-y-1.5">
            <span className={`block w-6 h-0.5 bg-white transition-transform ${menuOpen ? 'rotate-45 translate-y-2' : ''}`} />
            <span className={`block w-6 h-0.5 bg-white transition-opacity ${menuOpen ? 'opacity-0' : ''}`} />
            <span className={`block w-6 h-0.5 bg-white transition-transform ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
          </div>
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="md:hidden bg-f1-mid border-t border-f1-accent px-4 py-3 space-y-3">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setMenuOpen(false)}
              className={`block py-2 text-sm font-medium ${
                location.pathname === l.to ? 'text-f1-red' : 'text-f1-muted'
              }`}
            >
              {l.label}
            </Link>
          ))}
          {user ? (
            <>
              <Link to="/profile" onClick={() => setMenuOpen(false)} className="block py-2 text-sm text-f1-muted">Profile</Link>
              <button onClick={() => { logout(); setMenuOpen(false) }} className="block py-2 text-sm text-f1-muted">Sign out</button>
            </>
          ) : (
            <Link to="/login" onClick={() => setMenuOpen(false)} className="block py-2 text-sm text-f1-red font-bold">Sign in</Link>
          )}
        </div>
      )}
    </nav>
  )
}
