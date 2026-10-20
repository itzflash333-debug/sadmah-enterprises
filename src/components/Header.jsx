import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import './Header.css'

export function Header({ isDark, onToggleTheme }) {
  const [menuOpen, setMenuOpen] = useState(false)

  function closeMenu() {
    setMenuOpen(false)
  }

  return (
    <header className="site-header">
      <Link className="wordmark" to="/" onClick={closeMenu} aria-label="Sadmah Enterprises home">
        SADMAH<span>®</span>
      </Link>
      <nav className={`main-nav${menuOpen ? ' is-open' : ''}`} aria-label="Main navigation">
        <Link to="/" onClick={closeMenu}>Home</Link>
        <Link to="/about" onClick={closeMenu}>The story</Link>
        <Link to="/catalog" onClick={closeMenu}>Collections</Link>
        <Link to="/testimonials" onClick={closeMenu}>Kind words</Link>
        <Link to="/contact" onClick={closeMenu}>Get in touch</Link>
      </nav>
      <div className="header-tools">
        <HeaderClock />
        <button
          className="theme-toggle"
          type="button"
          onClick={onToggleTheme}
          aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
          title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        >
          {isDark ? (
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M20.2 15.1A8.5 8.5 0 0 1 8.9 3.8 8.5 8.5 0 1 0 20.2 15.1Z" />
            </svg>
          )}
        </button>
      </div>
      <button
        className="mobile-menu-toggle"
        type="button"
        onClick={() => setMenuOpen((open) => !open)}
        aria-expanded={menuOpen}
        aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          {menuOpen ? (
            <path d="m6 6 12 12M18 6 6 18" />
          ) : (
            <path d="M3 6h18M3 12h18M3 18h18" />
          )}
        </svg>
      </button>
    </header>
  )
}

function HeaderClock() {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(intervalId)
  }, [])

  return (
    <div
      className="header-clock"
      aria-label={`Current local time ${now.toLocaleTimeString()}, ${now.toLocaleDateString()}`}
    >
      <div className="header-clock-details">
        <time className="header-clock-time" dateTime={now.toISOString()}>
          {now.toLocaleTimeString(undefined, {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })}
        </time>
        <time className="header-clock-time-compact" dateTime={now.toISOString()}>
          {now.toLocaleTimeString(undefined, {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </time>
        <span className="header-clock-date">
          {now.toLocaleDateString(undefined, {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </span>
        <span className="header-clock-date-compact">
          {now.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
        </span>
      </div>
    </div>
  )
}
