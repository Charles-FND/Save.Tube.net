export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer
      id="footer"
      className="relative mt-auto"
      style={{
        borderTop: '1px solid rgba(0,0,0,0.05)',
        background: 'rgba(255,255,255,0.7)',
        backdropFilter: 'blur(20px)',
      }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{
                  background: 'linear-gradient(135deg, #FF3333 0%, #CC0000 100%)',
                  boxShadow: '0 0 12px rgba(255,0,0,0.35)',
                }}
              >
                <svg className="w-3.5 h-3.5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
              <span
                className="font-bold text-base"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                <span className="text-gradient-red">Save</span>
                <span className="text-gray-700">.Tube.net</span>
              </span>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: 'rgba(0,0,0,0.5)' }}>
              The fastest free YouTube downloader supporting 4K 60fps, 8K Ultra HD, and MP3 extraction.
            </p>
          </div>

          {/* Links */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'rgba(0,0,0,0.3)' }}>
              Features
            </p>
            <ul className="space-y-2">
              {['4K 60fps Download', '8K Ultra HD', 'MP3 Audio', 'Fast Streaming', 'No Signup Required'].map(item => (
                <li key={item}>
                  <a
                    href="#"
                    className="text-xs transition-colors duration-200"
                    style={{ color: 'rgba(0,0,0,0.45)' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#FF0000'}
                    onMouseLeave={e => e.currentTarget.style.color = 'rgba(0,0,0,0.45)'}
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'rgba(0,0,0,0.3)' }}>
              Legal
            </p>
            <ul className="space-y-2">
              {['Terms of Service', 'Privacy Policy', 'DMCA', 'Contact'].map(item => (
                <li key={item}>
                  <a
                    href="#"
                    className="text-xs transition-colors duration-200"
                    style={{ color: 'rgba(0,0,0,0.45)' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#FF0000'}
                    onMouseLeave={e => e.currentTarget.style.color = 'rgba(0,0,0,0.45)'}
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6"
          style={{ borderTop: '1px solid rgba(0,0,0,0.08)' }}
        >
          <p className="text-xs" style={{ color: 'rgba(0,0,0,0.4)' }}>
            © {currentYear} Save.Tube.net — All rights reserved.
          </p>
          <p className="text-xs" style={{ color: 'rgba(0,0,0,0.35)' }}>
            Not affiliated with YouTube or Google LLC. For personal use only.
          </p>
          <div className="flex items-center gap-1 text-xs" style={{ color: 'rgba(0,0,0,0.35)' }}>
            <span>Powered by</span>
            <span
              className="font-semibold"
              style={{ color: '#CC0000' }}
            >
              yt-dlp
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
