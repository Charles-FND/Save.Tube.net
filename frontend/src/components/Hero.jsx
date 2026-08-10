import { useState, useRef, useEffect } from 'react'
import { gsap } from 'gsap'
import AdSlot from './AdSlot'

const EXAMPLE_URLS = [
  'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  'https://youtu.be/jNQXAC9IVRw',
  'https://www.youtube.com/watch?v=9bZkp7q19f0',
]

export default function Hero({ onSearch, loading }) {
  const [url, setUrl] = useState('')
  const [focused, setFocused] = useState(false)
  const [placeholder, setPlaceholder] = useState(0)

  const headingRef = useRef(null)
  const subRef = useRef(null)
  const inputRef = useRef(null)
  const badgesRef = useRef(null)

  // GSAP entrance — only slide-up, no x-axis on mobile to prevent overflow
  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
    tl.fromTo(headingRef.current,
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8 }
    )
    .fromTo(subRef.current,
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6 },
      '-=0.45'
    )
    .fromTo(inputRef.current,
      { y: 16, opacity: 0, scale: 0.98 },
      { y: 0, opacity: 1, scale: 1, duration: 0.6 },
      '-=0.35'
    )
    .fromTo(badgesRef.current,
      { y: 12, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5 },
      '-=0.25'
    )
  }, [])

  // Rotate placeholder
  useEffect(() => {
    const id = setInterval(() => setPlaceholder(p => (p + 1) % EXAMPLE_URLS.length), 3500)
    return () => clearInterval(id)
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    const trimmed = url.trim()
    if (!trimmed) return
    onSearch(trimmed)
  }

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText()
      setUrl(text)
    } catch { /* denied */ }
  }

  return (
    <section
      id="hero"
      className="relative flex flex-col items-center justify-center px-4 sm:px-6 pt-14 pb-12 sm:pt-20 sm:pb-16 text-center overflow-hidden"
    >
      {/* Radial glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-64 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center top, rgba(255,0,0,0.1) 0%, transparent 70%)',
        }}
      />

      {/* Pill badge */}
      <div className="animate-fade-in-down mb-5 sm:mb-6">
        <span className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 rounded-full text-xs font-semibold tracking-wide text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/25">
          <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
            <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
          </svg>
          Supports 4K · 8K · 60fps · MP3
        </span>
      </div>

      {/* Main heading — fluid type scale */}
      <h1
        ref={headingRef}
        className="font-black leading-[1.05] tracking-tight text-gray-900 dark:text-gray-100 max-w-3xl"
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 'clamp(2rem, 8vw, 4.5rem)',
        }}
      >
        Download YouTube
        <br />
        <span className="text-gradient-red">in Ultra HD</span>
        <span> Quality</span>
      </h1>

      {/* Subtitle */}
      <p
        ref={subRef}
        className="mt-4 sm:mt-5 max-w-xl text-base sm:text-lg leading-relaxed"
        style={{ color: 'var(--text-secondary)' }}
      >
        Paste any YouTube link and download in{' '}
        <span className="text-gray-900 dark:text-gray-100 font-semibold">4K 60fps</span>,{' '}
        <span style={{ color: '#CC0000', fontWeight: 600 }}>8K</span>, or{' '}
        <span className="text-gray-900 dark:text-gray-100 font-semibold">MP3</span> — instantly &amp; free.
      </p>

      {/* ── Search box ── */}
      <div ref={inputRef} className="mt-8 sm:mt-10 w-full max-w-2xl">
        <form onSubmit={handleSubmit} id="search-form">
          <div
            className="relative flex items-center rounded-2xl transition-all duration-300"
            style={{
              background: 'var(--glass-strong-bg)',
              border: `1.5px solid ${focused ? 'rgba(255,0,0,0.45)' : 'var(--glass-strong-border)'}`,
              boxShadow: focused
                ? '0 0 0 4px rgba(255,0,0,0.08), var(--glass-shadow)'
                : 'var(--glass-shadow)',
              backdropFilter: 'blur(16px)',
            }}
          >
            {/* YT Icon */}
            <div className="flex-shrink-0 pl-3 sm:pl-4 pr-2 sm:pr-3">
              <svg className="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="#FF0000">
                <path d="M23.5 6.2a3 3 0 00-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 00.5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 002.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 002.1-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8zM9.7 15.5V8.5l6.3 3.5-6.3 3.5z" />
              </svg>
            </div>

            {/* Input — font-size 16px prevents iOS zoom */}
            <input
              id="youtube-url-input"
              type="url"
              inputMode="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder={`e.g. ${EXAMPLE_URLS[placeholder]}`}
              className="input-glass flex-1 py-3.5 sm:py-4 pr-2 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
              autoComplete="off"
              spellCheck="false"
            />

            {/* Paste / Clear */}
            {!url && (
              <button
                type="button"
                id="paste-btn"
                onClick={handlePaste}
                className="flex-shrink-0 mr-1.5 sm:mr-2 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 text-red-600 border border-red-200 hover:bg-red-50 dark:border-red-500/30 dark:text-red-400 dark:hover:bg-red-500/10"
                style={{ minHeight: '32px', touchAction: 'manipulation' }}
              >
                Paste
              </button>
            )}
            {url && (
              <button
                type="button"
                id="clear-btn"
                onClick={() => setUrl('')}
                className="flex-shrink-0 mr-1.5 sm:mr-2 w-7 h-7 flex items-center justify-center rounded-full transition-all duration-200 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
                style={{ touchAction: 'manipulation' }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}

            {/* Analyze button */}
            <button
              id="analyze-btn"
              type="submit"
              disabled={loading || !url.trim()}
              className="flex-shrink-0 m-1.5 flex items-center gap-1.5 sm:gap-2 font-semibold text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
              style={{
                background: 'linear-gradient(135deg, #FF3333 0%, #FF0000 50%, #CC0000 100%)',
                padding: '10px 14px',
                minWidth: '80px',
                fontSize: '0.8rem',
                boxShadow: '0 4px 16px rgba(255,0,0,0.35)',
                touchAction: 'manipulation',
              }}
              onMouseEnter={e => {
                if (!loading && url.trim()) {
                  e.currentTarget.style.boxShadow = '0 6px 24px rgba(255,0,0,0.55)'
                  e.currentTarget.style.transform = 'scale(1.04)'
                }
              }}
              onMouseLeave={e => {
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(255,0,0,0.35)'
                e.currentTarget.style.transform = 'scale(1)'
              }}
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4" />
                    <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <span className="hidden sm:inline">Analyzing…</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <span>Analyze</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Feature badges */}
      <div ref={badgesRef} className="mt-6 sm:mt-8 flex flex-wrap justify-center gap-2 sm:gap-3">
        {[
          { icon: '🎬', label: '4K 60fps' },
          { icon: '✨', label: '8K Ultra HD' },
          { icon: '🎵', label: 'MP3 Audio' },
          { icon: '⚡', label: 'No signup' },
          { icon: '🔒', label: 'Private' },
          { icon: '🌐', label: 'All platforms' },
        ].map((badge, i) => (
          <div
            key={badge.label}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-medium animate-fade-in-up"
            style={{
              background: 'var(--glass-bg)',
              border: '1px solid var(--glass-border)',
              color: 'var(--text-secondary)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              animationDelay: `${i * 0.07}s`,
            }}
          >
            <span>{badge.icon}</span>
            <span>{badge.label}</span>
          </div>
        ))}
      </div>

      {/* AdSense */}
      <div className="w-full max-w-3xl mt-8 sm:mt-10">
        <AdSlot dataAdSlot="1234567890" />
      </div>

      {/* How it works */}
      <div id="how" className="mt-14 sm:mt-16 w-full max-w-3xl">
        <p className="text-xs uppercase tracking-widest mb-5 font-bold" style={{ color: 'rgba(255,0,0,0.6)' }}>
          How it works
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {[
            { step: '01', title: 'Paste URL', desc: 'Copy any YouTube video link and paste it above.', icon: '📋' },
            { step: '02', title: 'Choose Quality', desc: 'Pick from 8K, 4K 60fps, 1080p, or MP3 audio.', icon: '🎚️' },
            { step: '03', title: 'Download', desc: 'Click download and your file saves instantly.', icon: '⬇️' },
          ].map((item, i) => (
            <div
              key={item.step}
              className="glass-card p-4 sm:p-5 text-left animate-fade-in-up"
              style={{ animationDelay: `${i * 0.12}s` }}
            >
              <div className="flex items-center gap-3 mb-2.5">
                <span className="text-xs font-bold tracking-widest" style={{ color: 'rgba(255,0,0,0.7)' }}>
                  {item.step}
                </span>
                <span className="text-xl">{item.icon}</span>
              </div>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">{item.title}</p>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
