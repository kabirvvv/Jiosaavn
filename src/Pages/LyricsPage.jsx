import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, Music } from 'lucide-react'
import { usePlayer } from '../context/PlayerContext'
import { bestImageUrl } from '../api/jiosaavn'
import { artistNames, stripHtml } from '../utils/format'

export default function LyricsPage() {
  const navigate = useNavigate()
  const { currentTrack, progress, lyrics, lyricsLoading, seek } = usePlayer()
  const lineRefs = useRef([])

  const activeIndex = lyrics?.synced?.length
    ? lyrics.synced.reduce((acc, line, i) => (line.time <= progress ? i : acc), -1)
    : -1

  useEffect(() => {
    const el = lineRefs.current[activeIndex]
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [activeIndex])

  if (!currentTrack) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-chassis text-paper gap-4">
        <p className="text-muted text-sm">Nothing is playing right now.</p>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 rounded-full bg-signal text-ink text-sm font-semibold hover:bg-signal2"
        >
          Back to Home
        </button>
      </div>
    )
  }

  const artwork = bestImageUrl(currentTrack.image)
  const title = stripHtml(currentTrack.title || currentTrack.name || '')
  const subtitle = artistNames(currentTrack)

  return (
    <div className="min-h-screen w-full bg-chassis text-paper relative overflow-y-auto">
      <div
        className="fixed inset-0 z-0 bg-cover bg-center opacity-20 blur-3xl scale-125"
        style={{ backgroundImage: artwork ? `url(${artwork})` : 'none' }}
      />
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-chassis/85 via-chassis/95 to-chassis" />

      <header className="sticky top-0 z-20 flex items-center justify-between px-6 py-5 border-b border-line/40 bg-chassis/60 backdrop-blur-md">
        <button
          onClick={() => navigate('/now-playing')}
          className="p-2 rounded-full border border-line bg-panel/60 hover:bg-panel hover:scale-105 transition-all"
          aria-label="Back to player"
        >
          <ChevronDown size={22} className="rotate-90" />
        </button>
        <div className="text-center">
          <p className="text-sm font-display font-bold text-paper truncate max-w-xs">{title}</p>
          <p className="text-xs text-muted truncate max-w-xs">{subtitle}</p>
        </div>
        <div className="w-9" />
      </header>

      <div className="relative z-10 max-w-xl mx-auto w-full px-6 py-10">
        {lyricsLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-5 rounded bg-panel animate-pulse border border-line/30 mx-auto"
                style={{ width: `${60 + (i % 3) * 15}%` }}
              />
            ))}
          </div>
        ) : !lyrics || (!lyrics.plain && !lyrics.synced.length) ? (
          <div className="text-center py-24 text-muted">
            <Music size={36} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm">No lyrics found for this track.</p>
          </div>
        ) : lyrics.instrumental ? (
          <div className="text-center py-24 text-muted text-sm">This track is instrumental.</div>
        ) : lyrics.synced.length ? (
          <div className="space-y-6 text-center pb-40">
            {lyrics.synced.map((line, i) => (
              <p
                key={i}
                ref={(el) => (lineRefs.current[i] = el)}
                onClick={() => seek(line.time)}
                className={`text-lg font-medium cursor-pointer transition-all duration-300 ${
                  i === activeIndex ? 'text-signal scale-105' : 'text-muted hover:text-paper'
                }`}
              >
                {line.text || '···'}
              </p>
            ))}
          </div>
        ) : (
          <p className="text-base text-paper leading-relaxed whitespace-pre-line text-center">
            {lyrics.plain}
          </p>
        )}
      </div>
    </div>
  )
}
