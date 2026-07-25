import { Link } from 'react-router-dom'
import { Play, Pause } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { bestImageUrl } from '../api/jiosaavn'
import { stripHtml, artistNames } from '../utils/format'

function MarqueeText({ text, className = '', direction = 'left' }) {
  const containerRef = useRef(null)
  const textRef = useRef(null)
  const [overflowing, setOverflowing] = useState(false)

  useEffect(() => {
    const measure = () => {
      if (!containerRef.current || !textRef.current) return
      setOverflowing(textRef.current.scrollWidth - containerRef.current.clientWidth > 2)
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [text])

  if (!overflowing) {
    return (
      <div ref={containerRef} className={`overflow-hidden whitespace-nowrap ${className}`}>
        <span ref={textRef} className="inline-block">{text}</span>
      </div>
    )
  }

  const animationName = direction === 'right' ? 'card-marquee-right' : 'card-marquee-left'

  return (
    <div ref={containerRef} className={`overflow-hidden whitespace-nowrap ${className}`}>
      <div className="inline-flex" style={{ animation: `${animationName} 8s linear infinite` }}>
        <span ref={textRef} className="inline-block pr-8">{text}</span>
        <span className="inline-block pr-8" aria-hidden="true">{text}</span>
      </div>
    </div>
  )
}

export default function ShelfCard({ item, kind, onPlay, isCurrent = false, isPlaying = false }) {
  const title = stripHtml(item.title || item.name || '')
  const artwork = bestImageUrl(item.image)
  const isArtist = kind === 'artist'
  const isSong = kind === 'song'

  const to =
    kind === 'album' ? `/album/${item.id}` :
    kind === 'artist' ? `/artist/${item.id}` :
    kind === 'playlist' ? `/playlist/${item.id}` : '#'

  const subtitle =
    kind === 'album' ? stripHtml(item.artist || item.subtitle || item.year || '') :
    kind === 'artist' ? 'Artist' :
    kind === 'playlist' ? stripHtml(item.subtitle || item.language || 'Playlist') :
    isSong ? artistNames(item) : ''

  const artworkBlock = (
    <div className={`relative w-36 h-36 sm:w-40 sm:h-40 overflow-hidden border border-line bg-panel2 ${isArtist ? 'rounded-full' : 'rounded-lg'}`}>
      {artwork && (
        <img src={artwork} alt="" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
      )}
      {!isArtist && (
        <span
          onClick={isSong ? (e) => { e.preventDefault(); onPlay?.() } : undefined}
          className={`absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center ${
            isSong && isCurrent ? 'opacity-100 bg-black/30' : 'opacity-0 group-hover:opacity-100'
          }`}
        >
          <span className="w-9 h-9 rounded-full bg-signal flex items-center justify-center shadow-knob">
            {isSong && isPlaying ? (
              <Pause size={14} className="text-ink" fill="currentColor" />
            ) : (
              <Play size={14} className="text-ink ml-0.5" fill="currentColor" />
            )}
          </span>
        </span>
      )}
    </div>
  )

  const textBlock = (
    <>
      <MarqueeText text={title} direction="left" className={`mt-2 text-sm ${isSong && isCurrent ? 'text-signal' : 'text-paper'}`} />
      <MarqueeText text={subtitle} direction="right" className="text-xs text-muted" />
    </>
  )

  if (isSong) {
    return (
      <div className="group flex-shrink-0 w-36 sm:w-40 cursor-pointer" onClick={onPlay}>
        {artworkBlock}
        {textBlock}
      </div>
    )
  }

  return (
    <Link to={to} className="group flex-shrink-0 w-36 sm:w-40">
      {artworkBlock}
      {textBlock}
    </Link>
  )
      }
