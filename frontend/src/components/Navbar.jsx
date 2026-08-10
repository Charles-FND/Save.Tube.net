import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'

export default function Navbar() {
  const navRef = useRef(null)

  useEffect(() => {
    gsap.fromTo(
      navRef.current,
      { y: -80, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out' }
    )
  }, [])

  return (
    <nav
      ref={navRef}
      className="sticky top-0 z-50 w-full"
      style={{
        background: 'var(--glass-strong-bg)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottom: '1px solid var(--glass-strong-border-light)',
      }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a href="/" id="nav-logo" className="flex items-center gap-3 group">
            {/* YouTube-style play icon */}
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:scale-110"
              style={{
                background: 'linear-gradient(135deg, #FF3333 0%, #CC0000 100%)',
                boxShadow: '0 0 16px rgba(255,0,0,0.4)',
              }}
            >
              <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
            <div className="flex flex-col leading-none">
              <span
                className="font-display font-bold text-lg tracking-tight"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                <span className="text-gradient-red">Save</span>
                <span className="text-gray-900 dark:text-gray-100">.Tube</span>
                <span className="text-gray-600 dark:text-gray-400">.net</span>
              </span>
            </div>
          </a>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {[
              { label: 'Home', href: '#', id: 'nav-home' },
              { label: 'How it works', href: '#how', id: 'nav-how' },
              { label: 'History', href: '#history', id: 'nav-history' },
            ].map(link => (
              <a
                key={link.id}
                id={link.id}
                href={link.href}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                style={{ color: 'var(--text-secondary)' }}
                onMouseEnter={e => {
                  e.currentTarget.style.color = 'var(--text-primary)'
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.color = 'var(--text-secondary)'
                  e.currentTarget.style.background = 'transparent'
                }}
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* CTA Badge and Theme Toggle */}
          <div className="flex items-center gap-3">

            <div
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{
                background: 'rgba(255,0,0,0.1)',
                border: '1px solid rgba(255,0,0,0.2)',
                color: '#CC0000',
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-yt-red animate-pulse" />
              Free &amp; Fast
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
