import { useEffect } from 'react'

export default function AdSlot({ dataAdSlot }) {
  useEffect(() => {
    try {
      if (window.adsbygoogle && typeof window !== 'undefined') {
        window.adsbygoogle.push({})
      }
    } catch (err) {
      console.error('AdSense push error:', err)
    }
  }, [])

  return (
    <div className="w-full flex justify-center overflow-hidden my-4">
      {/* 
        Replace data-ad-client with your real Google AdSense Publisher ID
        e.g., ca-pub-1234567890123456 
      */}
      <ins
        className="adsbygoogle"
        style={{ display: 'block', minWidth: '300px', width: '100%', height: '100px' }}
        data-ad-client="ca-pub-7277512024058589"
        data-ad-slot={dataAdSlot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      ></ins>
    </div>
  )
}
