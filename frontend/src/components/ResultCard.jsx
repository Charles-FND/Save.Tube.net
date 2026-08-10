import { useState, useRef, useEffect } from 'react'
import { gsap } from 'gsap'
import DownloadButton from './DownloadButton'
import AdSlot from './AdSlot'

function formatViews(n) {
  if (!n) return '0'
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toLocaleString()
}

// Quality badge colours
function qualityStyle(quality) {
  if (quality.includes('8K')) return { bg: 'rgba(255,215,0,0.15)', border: 'rgba(255,215,0,0.3)', text: '#B8860B', glow: 'rgba(255,215,0,0.1)' }
  if (quality.includes('4K')) return { bg: 'rgba(255,0,0,0.1)', border: 'rgba(255,0,0,0.2)', text: '#CC0000', glow: 'rgba(255,0,0,0.05)' }
  if (quality.includes('1440')) return { bg: 'rgba(139,92,246,0.1)', border: 'rgba(139,92,246,0.2)', text: '#6D28D9', glow: 'rgba(139,92,246,0.05)' }
  if (quality.includes('1080')) return { bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.2)', text: '#1D4ED8', glow: 'rgba(59,130,246,0.05)' }
  if (quality.includes('720')) return { bg: 'rgba(14,165,233,0.1)', border: 'rgba(14,165,233,0.2)', text: '#0369A1', glow: 'rgba(14,165,233,0.05)' }
  if (quality.includes('480')) return { bg: 'rgba(249,115,22,0.1)', border: 'rgba(249,115,22,0.2)', text: '#C2410C', glow: 'rgba(249,115,22,0.05)' }
  if (quality.includes('360')) return { bg: 'rgba(244,63,94,0.1)', border: 'rgba(244,63,94,0.2)', text: '#BE123C', glow: 'rgba(244,63,94,0.05)' }
  if (quality.includes('240')) return { bg: 'rgba(217,70,239,0.1)', border: 'rgba(217,70,239,0.2)', text: '#A21CAF', glow: 'rgba(217,70,239,0.05)' }
  if (quality.includes('144')) return { bg: 'rgba(132,204,22,0.1)', border: 'rgba(132,204,22,0.2)', text: '#4D7C0F', glow: 'rgba(132,204,22,0.05)' }
  if (quality.includes('MP3')) return { bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.2)', text: '#047857', glow: 'rgba(16,185,129,0.05)' }
  if (quality.includes('Audio') ||
    quality.includes('M4A') ||
    quality.includes('WebM')) return { bg: 'rgba(20,184,166,0.1)', border: 'rgba(20,184,166,0.2)', text: '#0F766E', glow: 'rgba(20,184,166,0.05)' }
  return { bg: 'rgba(0,0,0,0.03)', border: 'rgba(0,0,0,0.06)', text: '#4b5563', glow: 'transparent' }
}

export default function ResultCard({ video, onDownload, downloadingFormat }) {
  const [tab, setTab] = useState('video')
  const cardRef = useRef(null)

  useEffect(() => {
    if (!cardRef.current) return
    gsap.fromTo(
      cardRef.current,
      { x: 50, opacity: 0, scale: 0.97 },
      { x: 0, opacity: 1, scale: 1, duration: 0.7, ease: 'power3.out' }
    )
  }, [video])

  const videoFmts = (video.formats || []).filter(f => !f.is_audio_only && !f.is_video_only)
  const videoOnlyFmts = (video.formats || []).filter(f => f.is_video_only)
  const audioFmts = (video.formats || []).filter(f => f.is_audio_only)
  const displayed = tab === 'video' ? videoFmts : tab === 'videoonly' ? videoOnlyFmts : audioFmts

  return (
    <div ref={cardRef} id="result-card" className="glass-card-strong overflow-hidden">

      {/* ── Thumbnail + Meta ── */}
      <div className="flex flex-col sm:flex-row">
        {/* Thumbnail */}
        <div className="relative flex-shrink-0 sm:w-56 h-44 sm:h-auto overflow-hidden">
          {video.thumbnail_url && (
            <div className="absolute inset-0"
              style={{
                backgroundImage: `url(${video.thumbnail_url})`,
                backgroundSize: 'cover', backgroundPosition: 'center',
                filter: 'blur(8px) brightness(0.4)', transform: 'scale(1.1)'
              }} />
          )}
          {video.thumbnail_url
            ? <img src={video.thumbnail_url} alt={video.title}
              className="relative z-10 w-full h-full object-contain" />
            : <div className="w-full h-full flex items-center justify-center bg-black/5 dark:bg-white/5">
              <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
          }
          {video.duration_string && (
            <div className="absolute bottom-2 right-2 z-20 px-2 py-0.5 rounded text-xs font-bold text-white"
              style={{ background: 'rgba(0,0,0,0.85)' }}>
              {video.duration_string}
            </div>
          )}
        </div>

        {/* Meta */}
        <div className="flex-1 p-5 sm:p-6 flex flex-col justify-between min-w-0">
          <div>
            <h2 id="video-title"
              className="font-bold text-base sm:text-lg leading-snug text-gray-900 dark:text-gray-100 line-clamp-2 mb-2"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {video.title}
            </h2>
            <a href={video.channel_url || '#'} target="_blank" rel="noopener noreferrer"
              id="video-channel"
              className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors"
              style={{ color: '#CC0000' }}
              onMouseEnter={e => e.currentTarget.style.color = '#FF0000'}
              onMouseLeave={e => e.currentTarget.style.color = '#CC0000'}>
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
              </svg>
              {video.channel}
            </a>
          </div>

          {/* Stats */}
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
            {[
              { icon: '👁', v: video.view_count ? `${formatViews(video.view_count)} views` : null },
              { icon: '❤️', v: video.like_count ? `${formatViews(video.like_count)} likes` : null },
              { icon: '📅', v: video.upload_date ? video.upload_date.slice(0, 4) : null },
              { icon: '⏱', v: video.duration_string !== 'N/A' ? video.duration_string : null },
            ].filter(s => s.v).map(s => (
              <div key={s.v} className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                <span>{s.icon}</span><span>{s.v}</span>
              </div>
            ))}
          </div>

          {/* Quality summary badges */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {videoFmts.slice(0, 4).map(f => (
              <span key={f.format_id}
                className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{
                  ...qualityStyle(f.quality), background: qualityStyle(f.quality).bg,
                  border: `1px solid ${qualityStyle(f.quality).border}`,
                  color: qualityStyle(f.quality).text
                }}>
                {f.quality}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Divider ── */}
      <div style={{ borderTop: '1px solid var(--glass-strong-border-light)' }} />

      {/* ── Format selector ── */}
      <div className="p-5 sm:p-6">

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-5 flex-wrap">
          {[
            { key: 'video', label: `🎬 Video + Audio (${videoFmts.length})` },
            { key: 'videoonly', label: `⚡ Video Only (${videoOnlyFmts.length})` },
            { key: 'audio', label: `🎵 Audio (${audioFmts.length})` },
          ].map(t => (
            <button key={t.key} id={`tab-${t.key}`}
              onClick={() => setTab(t.key)}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200"
              style={tab === t.key
                ? {
                  background: t.key === 'videoonly' ? 'rgba(234,179,8,0.1)' : 'rgba(255,0,0,0.08)',
                  border: `1px solid ${t.key === 'videoonly' ? 'rgba(234,179,8,0.3)' : 'rgba(255,0,0,0.2)'}`,
                  color: t.key === 'videoonly' ? '#B45309' : '#CC0000',
                  boxShadow: `0 0 12px ${t.key === 'videoonly' ? 'rgba(234,179,8,0.05)' : 'rgba(255,0,0,0.05)'}, inset 0 2px 4px rgba(255,255,255,1)`,
                }
                : {
                  background: 'var(--glass-bg)', border: '1px solid var(--glass-border-light)',
                  color: 'var(--text-secondary)',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.02)'
                }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Info note per tab */}
        {tab === 'video' && (
          <div className="mb-4 flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{ background: 'var(--glass-border-light)', border: '1px solid var(--glass-border)' }}>
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"
              style={{ color: '#EAB308' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Video + Audio included — one complete file ready to play.
            </p>
          </div>
        )}
        {tab === 'videoonly' && (
          <div className="mb-4 flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{ background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.2)' }}>
            <svg className="w-4 h-4 flex-shrink-0 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            <p className="text-xs text-amber-900 dark:text-amber-500">
              <strong>No audio</strong> — instant direct download, single stream, no processing.
              Add audio separately if needed.
            </p>
          </div>
        )}

        {/* AdSense Slot */}
        <AdSlot dataAdSlot="0987654321" />

        {/* Format grid */}
        {displayed.length === 0 ? (
          <p className="text-center py-8 text-sm text-gray-700 dark:text-gray-400">
            No formats available.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {displayed.map((fmt, i) => (
              <DownloadButton
                key={fmt.format_id}
                format={fmt}
                style={qualityStyle(fmt.quality)}
                isDownloading={downloadingFormat === fmt.format_id}
                disabled={!!downloadingFormat && downloadingFormat !== fmt.format_id}
                onDownload={onDownload}
                index={i}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
