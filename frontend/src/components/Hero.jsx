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

  const heroRef = useRef(null)
  const headingRef = useRef(null)
  const subRef = useRef(null)
  const inputRef = useRef(null)
  const badgesRef = useRef(null)

  // GSAP entrance
  useEffect(() => {
    const tl = gsap.timeline()
    tl.fromTo(headingRef.current,
      { x: -50, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.9, ease: 'power4.out' }
    )
      .fromTo(subRef.current,
        { x: -40, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.7, ease: 'power3.out' },
        '-=0.5'
      )
      .fromTo(inputRef.current,
        { x: -30, opacity: 0, scale: 0.97 },
        { x: 0, opacity: 1, scale: 1, duration: 0.7, ease: 'power3.out' },
        '-=0.4'
      )
      .fromTo(badgesRef.current,
        { x: -20, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.6, ease: 'power3.out' },
        '-=0.3'
      )
  }, [])

  // Rotate placeholder example URLs
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholder(p => (p + 1) % EXAMPLE_URLS.length)
    }, 3500)
    return () => clearInterval(interval)
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
    } catch {
      // Clipboard access denied — ignore
    }
  }

  return (
    <section
      ref={heroRef}
      id="hero"
      className="relative flex flex-col items-center justify-center pt-20 pb-16 px-4 text-center"
    >
      {/* Radial hero glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(255,0,0,0.08) 0%, transparent 70%)',
          filter: 'blur(1px)',
        }}
      />

      {/* "New" pill */}
      <div className="animate-fade-in-down mb-6">
        <span
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/25"
        >
          <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
            <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
          </svg>
          Supports 4K · 8K · 60fps · MP3
        </span>
      </div>

      {/* Main heading */}
      <h1
        ref={headingRef}
        className="font-display font-black text-5xl sm:text-6xl lg:text-7xl leading-[1.05] tracking-tight max-w-4xl text-gray-900 dark:text-gray-100"
        style={{ fontFamily: "'Space Grotesk', sans-serif" }}
      >
        Download YouTube
        <br />
        <span className="text-gradient-red">in Ultra HD</span>
        <span> Quality</span>
      </h1>

      {/* Subtitle */}
      <p
        ref={subRef}
        className="mt-5 text-lg sm:text-xl max-w-2xl leading-relaxed text-gray-700 dark:text-gray-400"
      >
        Paste any YouTube link below and download in{' '}
        <span className="text-gray-900 dark:text-gray-100 font-medium">4K 60fps</span>,{' '}
        <span style={{ color: '#CC0000', fontWeight: 500 }}>8K</span>, or{' '}
        <span className="text-gray-900 dark:text-gray-100 font-medium">MP3</span> — instantly and for free.
      </p>

      {/* Search Input */}
      <div ref={inputRef} className="mt-10 w-full max-w-2xl">
        <form onSubmit={handleSubmit} id="search-form">
          <div
            className="relative flex items-center rounded-2xl transition-all duration-300"
            style={{
              background: 'var(--glass-strong-bg)',
              border: `1px solid ${focused ? 'rgba(255,0,0,0.4)' : 'var(--glass-strong-border)'}`,
              boxShadow: focused
                ? '0 0 0 3px rgba(255,0,0,0.1), var(--glass-shadow)'
                : 'var(--glass-shadow)',
              backdropFilter: 'blur(20px)',
            }}
          >
            {/* YouTube icon */}
            <div className="flex-shrink-0 pl-4 pr-3">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#FF0000">
                <path d="M23.5 6.2a3 3 0 00-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 00.5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 002.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 002.1-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8zM9.7 15.5V8.5l6.3 3.5-6.3 3.5z" />
              </svg>
            </div>

            {/* Text input */}
            <input
              id="youtube-url-input"
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder={`e.g. ${EXAMPLE_URLS[placeholder]}`}
              className="input-glass flex-1 py-4 pr-2 text-sm sm:text-base text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
              autoComplete="off"
              spellCheck="false"
            />

            {/* Paste button */}
            {!url && (
              <button
                type="button"
                id="paste-btn"
                onClick={handlePaste}
                className="flex-shrink-0 mr-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 text-red-500 bg-white border border-red-500/15 shadow-[0_2px_8px_rgba(255,0,0,0.05)] hover:bg-red-50 dark:bg-gray-800 dark:border-red-500/30 dark:hover:bg-gray-700"
              >
                Paste
              </button>
            )}

            {/* Clear button */}
            {url && (
              <button
                type="button"
                id="clear-btn"
                onClick={() => setUrl('')}
                className="flex-shrink-0 mr-2 w-7 h-7 flex items-center justify-center rounded-full transition-all duration-200 text-gray-500 dark:text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}

            {/* Submit button */}
            <button
              id="analyze-btn"
              type="submit"
              disabled={loading || !url.trim()}
              className="flex-shrink-0 m-1.5 px-5 py-3 rounded-xl font-semibold text-sm transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              style={{
                background: 'linear-gradient(135deg, #FF3333 0%, #FF0000 50%, #CC0000 100%)',
                color: '#fff',
                boxShadow: '0 0 16px rgba(255,0,0,0.35)',
              }}
              onMouseEnter={e => {
                if (!loading) {
                  e.currentTarget.style.boxShadow = '0 0 28px rgba(255,0,0,0.55)'
                  e.currentTarget.style.transform = 'scale(1.03)'
                }
              }}
              onMouseLeave={e => {
                e.currentTarget.style.boxShadow = '0 0 16px rgba(255,0,0,0.35)'
                e.currentTarget.style.transform = 'scale(1)'
              }}
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4" />
                    <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Analyzing…
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Analyze
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Feature badges */}
      <div ref={badgesRef} className="mt-8 flex flex-wrap justify-center gap-3">
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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
            style={{
              background: 'var(--glass-bg)',
              border: '1px solid var(--glass-border)',
              color: 'var(--text-secondary)',
              boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
              animationDelay: `${i * 0.08}s`,
            }}
          >
            <span>{badge.icon}</span>
            <span>{badge.label}</span>
          </div>
        ))}
      </div>

      {/* AdSense Slot */}
      <div className="w-full max-w-3xl mt-8">
        <AdSlot dataAdSlot="1234567890" />
      </div>

      {/* How it works (anchor target) */}
      <div id="how" className="mt-16 w-full max-w-3xl">
        <p className="text-xs uppercase tracking-widest mb-6 font-semibold text-red-500/80">
          How it works
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { step: '01', title: 'Paste URL', desc: 'Copy any YouTube video link and paste it above.', icon: '📋' },
            { step: '02', title: 'Choose Quality', desc: 'Pick from 8K, 4K 60fps, 1080p, or MP3 audio.', icon: '🎚️' },
            { step: '03', title: 'Download', desc: 'Click download and your file is saved instantly.', icon: '⬇️' },
          ].map((item, i) => (
            <div
              key={item.step}
              className="glass-card p-5 text-left animate-fade-in-right"
              style={{ animationDelay: `${i * 0.15}s` }}
            >
              <div className="flex items-center gap-3 mb-3">
                <span
                  className="text-xs font-bold tracking-wider"
                  style={{ color: 'rgba(255,0,0,0.8)' }}
                >
                  {item.step}
                </span>
                <span className="text-xl">{item.icon}</span>
              </div>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">{item.title}</p>
              <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-400">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
