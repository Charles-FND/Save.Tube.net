import { useState, useCallback, useRef, useEffect } from 'react'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import ResultCard from './components/ResultCard'
import Footer from './components/Footer'
import axios from 'axios'

function App() {
  const [videoData, setVideoData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [downloadingFormat, setDownloadingFormat] = useState(null)
  const resultRef = useRef(null)



  useEffect(() => {
    if ((loading || videoData) && resultRef.current) {
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 100)
    }
  }, [loading, videoData])

  const fetchVideoInfo = useCallback(async (url) => {
    setLoading(true)
    setError('')
    setVideoData(null)
    try {
      const API_BASE = import.meta.env.VITE_API_URL || ''
      const response = await axios.get(`${API_BASE}/api/info/`, { params: { url } })
      setVideoData(response.data)
    } catch (err) {
      const message =
        err.response?.data?.error ||
        'Failed to fetch video info. Please check the URL and try again.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleDownload = useCallback((format) => {
    if (!videoData) return

    // Mark button as active for 3 seconds (tactile feedback only)
    setDownloadingFormat(format.format_id)
    setTimeout(() => setDownloadingFormat(null), 3000)

    // Build stream URL — navigating here triggers browser's native download bar instantly.
    // Content-Disposition: attachment on the response means the page won't navigate away.
    const params = new URLSearchParams({
      url: videoData.webpage_url,
      format_id: format.format_id,
      merge_ext: format.merge_ext || format.ext || 'mp4',
      quality_label: format.quality,
      is_audio_only: String(format.is_audio_only || false),
      video_title: videoData.title || '',   // used as the downloaded filename
    })

    const API_BASE = import.meta.env.VITE_API_URL || ''
    window.location.href = `${API_BASE}/api/stream/?${params.toString()}`
  }, [videoData])

  return (
    <div className="min-h-screen flex flex-col relative bg-transparent overflow-x-hidden">
      {/* Background Wrapper */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        {/* Animated Aurora Background (Glossy Light) */}
        <div className="bg-aurora w-[80vw] h-[80vh] top-[-20%] left-[-20%]"
          style={{ background: 'rgba(255, 0, 0, 0.05)' }} />
        <div className="bg-aurora w-[60vw] h-[60vh] bottom-[-10%] right-[-10%]"
          style={{ background: 'rgba(0, 150, 255, 0.04)', animationDelay: '-5s' }} />
        <div className="bg-aurora w-[70vw] h-[70vh] top-[30%] left-[20%]"
          style={{ background: 'rgba(255, 105, 180, 0.03)', animationDelay: '-10s' }} />
      </div>

      <Navbar />

      <main className="flex-1 flex flex-col">
        <Hero onSearch={fetchVideoInfo} loading={loading} />

        {/* Error Banner */}
        {error && (
          <div className="max-w-3xl mx-auto w-full px-3 sm:px-4 mt-4 animate-fade-in-up">
            <div className="glass-card border border-red-500/25 p-3 sm:p-4 flex items-start gap-3">
              <span className="text-red-500 mt-0.5 flex-shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-red-700 font-bold text-sm">Download Error</p>
                <p className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm mt-0.5 break-words">{error}</p>
              </div>
              <button
                onClick={() => setError('')}
                className="ml-auto text-gray-400 hover:text-gray-700 transition-colors flex-shrink-0 p-1"
                style={{ touchAction: 'manipulation' }}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        <div ref={resultRef}>
          {/* Loading skeleton */}
          {loading && !videoData && (
            <div className="max-w-4xl mx-auto w-full px-3 sm:px-4 mt-6 sm:mt-8 mb-10 sm:mb-12 animate-fade-in-up">
              <LoadingSkeleton />
            </div>
          )}

          {/* Result Card */}
          {videoData && (
            <div className="max-w-4xl mx-auto w-full px-3 sm:px-4 mt-6 sm:mt-8 mb-10 sm:mb-12 animate-fade-in-up">
              <ResultCard
                video={videoData}
                onDownload={handleDownload}
                downloadingFormat={downloadingFormat}
              />
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}


function LoadingSkeleton() {
  return (
    <div className="glass-card p-4 sm:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="shimmer-loading rounded-xl w-full sm:w-52 h-44 sm:h-32 flex-shrink-0" />
        <div className="flex-1 space-y-3">
          <div className="shimmer-loading rounded-lg h-5 w-4/5" />
          <div className="shimmer-loading rounded-lg h-4 w-1/2" />
          <div className="shimmer-loading rounded-lg h-4 w-1/3" />
          <div className="shimmer-loading rounded-lg h-4 w-2/5 mt-2" />
        </div>
      </div>
      <div className="shimmer-loading rounded-lg h-3 w-full" />
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="shimmer-loading rounded-xl h-20" />
        ))}
      </div>
    </div>
  )
}

export default App
