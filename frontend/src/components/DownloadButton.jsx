import { useRef, useEffect } from 'react'
import { gsap } from 'gsap'

const BADGE_LABELS = { '8K': '8K', '4K': '4K', '60fps': '60fps', 'MP3': 'MP3' }

function getBadge(quality, isVideoOnly) {
  if (isVideoOnly) return { text: 'No Audio', bg: 'rgba(234,179,8,0.2)', color: '#92400E' }
  if (quality.includes('8K')) return { text: '8K', bg: 'rgba(255,215,0,0.25)', color: '#B8860B' }
  if (quality.includes('4K')) return { text: '4K', bg: 'rgba(255,0,0,0.15)', color: '#CC0000' }
  if (quality.includes('60fps')) return { text: '60fps', bg: 'rgba(255,150,0,0.2)', color: '#C2410C' }
  if (quality.includes('MP3')) return { text: 'MP3', bg: 'rgba(16,185,129,0.2)', color: '#047857' }
  return null
}

export default function DownloadButton({ format, style, isDownloading, disabled, onDownload, index }) {
  const ref = useRef(null)

  useEffect(() => {
    if (!ref.current) return
    gsap.fromTo(ref.current,
      { opacity: 0, x: -30, scale: 0.95 },
      { opacity: 1, x: 0, scale: 1, duration: 0.4, ease: 'power3.out', delay: index * 0.06 }
    )
  }, [index])

  const badge = getBadge(format.quality, format.is_video_only)

  return (
    <button
      ref={ref}
      id={`download-btn-${format.quality.replace(/\s+/g, '-').toLowerCase()}`}
      onClick={() => !disabled && !isDownloading && onDownload(format)}
      disabled={disabled || isDownloading}
      className="relative group flex flex-col gap-2.5 p-4 rounded-xl text-left transition-all duration-300 overflow-hidden"
      style={{
        background: style.bg,
        border: `1px solid ${style.border}`,
        opacity: disabled && !isDownloading ? 0.4 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
      onMouseEnter={e => {
        if (!disabled && !isDownloading) {
          e.currentTarget.style.transform = 'translateY(-3px)'
          e.currentTarget.style.boxShadow = `0 8px 28px ${style.glow}`
          e.currentTarget.style.borderColor = style.text
        }
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = 'none'
        e.currentTarget.style.borderColor = style.border
      }}
    >
      {/* Shimmer hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 100%)' }} />

      {/* Top row: quality + badge */}
      <div className="flex items-start justify-between gap-1">
        <span className="text-sm font-bold leading-tight" style={{ color: style.text }}>
          {format.quality}
        </span>
        {badge && (
          <span className="text-xs font-bold px-1.5 py-0.5 rounded flex-shrink-0"
            style={{ background: badge.bg, color: badge.color }}>
            {badge.text}
          </span>
        )}
      </div>

      {/* Extension + size */}
      <div className="flex items-center justify-between gap-1">
        <span className="text-xs font-mono uppercase px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 text-black/60 dark:text-white/60">
          .{format.ext}
        </span>
        <span className="text-xs text-black/45 dark:text-white/45">
          {format.filesize}
        </span>
      </div>

      {/* Download / spinner row */}
      <div className="flex items-center gap-1.5 mt-auto">
        {isDownloading ? (
          <>
            <svg className="animate-spin w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24"
              style={{ color: style.text }}>
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            <span className="text-xs font-medium" style={{ color: style.text }}>Processing…</span>
          </>
        ) : (
          <>
            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"
              style={{ color: style.text }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span className="text-xs font-semibold" style={{ color: style.text }}>
              {format.is_video_only ? 'Video Only' : format.is_audio_only ? 'Save Audio' : 'Download'}
            </span>
          </>
        )}
      </div>
    </button>
  )
}
