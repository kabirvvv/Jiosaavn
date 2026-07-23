import { useEffect, useRef, useState } from 'react'
import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Repeat1, Volume2, Volume1, VolumeX, ListMusic, Heart } from 'lucide-react'
import { usePlayer } from '../context/PlayerContext'
import { useLibrary } from '../context/LibraryContext'
import { bestImageUrl } from '../api/jiosaavn'
import { formatTime, artistNames, stripHtml } from '../utils/format'

// Simulated waveform, deliberately not wired to a real AnalyserNode: routing
// the shared <audio> element through Web Audio silences playback whenever a
// track's CDN response lacks permissive CORS headers (a hard browser
// security behavior, not a bug we can work around) — so this trades a
// "real" visualization for reliable audio.
function Waveform({ isPlaying }) {
  const canvasRef = useRef(null)
  const rafRef = useRef(null)
  const phaseRef = useRef(0)
  const seedsRef = useRef(Array.from({ length: 40 }, () => Math.random() * Math.PI * 2))

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1
    const width = canvas.clientWidth
    const height = canvas.clientHeight
    canvas.width = width * dpr
    canvas.height = height * dpr
    ctx.scale(dpr, dpr)

    const bars = 40
    const seeds = seedsRef.current

    function draw() {
      ctx.clearRect(0, 0, width, height)
      phaseRef.current += isPlaying ? 0.12 : 0.015
      const gap = 3
      const barWidth = (width - gap * (bars - 1)) / bars
      for (let i = 0; i < bars; i++) {
        const value = isPlaying
          ? 0.3 + 0.28 * Math.abs(Math.sin(phaseRef.current + seeds[i]))
          : 0.08
        const barHeight = Math.max(2, value * height)
        const x = i * (barWidth + gap)
        const y = height - barHeight
        ctx.fillStyle = i % 5 === 0 ? '#6FE7C5' : '#FF5C35'
        ctx.globalAlpha = isPlaying ? 0.9 : 0.35
        ctx.fillRect(x, y, barWidth, barHeight)
      }
      rafRef.current = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(rafRef.current)
  }, [isPlaying])

  return <canvas ref={canvasRef} className="w-full h-10" />
}

export default function SignalDeck({ onOpenQueue }) {
  const {
    currentTrack, isPlaying, progress, duration, volume, shuffle, repeatMode,
    togglePlay, goNext, goPrev, seek, changeVolume, setShuffle, setRepeatMode
  } = usePlayer()
  const { isLiked, toggleLiked } = useLibrary()
  const [showVolume, setShowVolume] = useState(false)

  if (!currentTrack) {
    return (
      <div className="fixed bottom-0 left-0 right-0 h-16 bg-chassis border-t border-line flex items-center justify-center z-40">
        <p className="text-eyebrow text-xs text-muted">Signal Deck — nothing queued</p>
      </div>
    )
  }

  const artwork = bestImageUrl(currentTrack.image)
  const title = stripHtml(currentTrack.title || currentTrack.name || '')
  const subtitle = artistNames(currentTrack)
  const liked = isLiked(currentTrack.id)

  const VolIcon = volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2
  const RepeatIcon = repeatMode === 'one' ? Repeat1 : Repeat

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-chassis border-t border-line shadow-deck">
      <div className="grain-surface">
        <div className="px-3 pt-1.5">
          <div className="flex items-center gap-2 text-[10px] text-muted font-mono">
            <span className="w-10 tabular-nums">{formatTime(progress)}</span>
            <input
              type="range"
              min={0}
              max={duration || 0}
              value={progress}
              onChange={(e) => seek(Number(e.target.value))}
              className="flex-1 h-1 bg-line rounded-full accent-signal"
              style={{
                background: `linear-gradient(to right, #FF5C35 ${(progress / (duration || 1)) * 100}%, #332C22 0)`
              }}
              aria-label="Seek"
            />
            <span className="w-10 tabular-nums text-right">{formatTime(duration)}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 md:gap-4 px-3 py-2.5">
          <div className="flex items-center gap-3 w-1/4 min-w-0">
            {artwork && (
              <img src={artwork} alt="" className="w-11 h-11 rounded object-cover flex-shrink-0 border border-line" />
            )}
            <div className="min-w-0 hidden sm:block">
              <p className="text-sm font-medium truncate">{title}</p>
              <p className="text-xs text-muted truncate">{subtitle}</p>
            </div>
            <button
              onClick={() => toggleLiked({ ...currentTrack, title, subtitle })}
              className={`flex-shrink-0 hidden sm:inline-flex ${liked ? 'text-signal' : 'text-muted hover:text-paper'}`}
              aria-label={liked ? 'Unlike' : 'Like'}
            >
              <Heart size={16} fill={liked ? 'currentColor' : 'none'} />
            </button>
          </div>

          <div className="flex flex-col items-center flex-1 max-w-xl mx-auto">
            <div className="flex items-center gap-4 mb-1">
              <button
                onClick={() => setShuffle(!shuffle)}
                className={shuffle ? 'text-signal' : 'text-muted hover:text-paper'}
                aria-label="Shuffle"
              >
                <Shuffle size={16} />
              </button>
              <button onClick={goPrev} className="text-paper hover:text-signal" aria-label="Previous">
                <SkipBack size={18} fill="currentColor" />
              </button>
              <button
                onClick={togglePlay}
                className="w-9 h-9 rounded-full bg-signal text-ink flex items-center justify-center hover:bg-signal2 shadow-knob"
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
              </button>
              <button onClick={goNext} className="text-paper hover:text-signal" aria-label="Next">
                <SkipForward size={18} fill="currentColor" />
              </button>
              <button
                onClick={() => setRepeatMode(repeatMode === 'off' ? 'all' : repeatMode === 'all' ? 'one' : 'off')}
                className={repeatMode !== 'off' ? 'text-signal' : 'text-muted hover:text-paper'}
                aria-label="Repeat"
              >
                <RepeatIcon size={16} />
              </button>
            </div>
          </div>

          <div className="w-1/4 hidden md:flex items-center justify-end gap-3">
            <div className="w-28">
              <Waveform isPlaying={isPlaying} />
            </div>
            <div
              className="relative flex items-center"
              onMouseEnter={() => setShowVolume(true)}
              onMouseLeave={() => setShowVolume(false)}
            >
              <button className="text-muted hover:text-paper" aria-label="Volume">
                <VolIcon size={16} />
              </button>
              {showVolume && (
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={volume}
                  onChange={(e) => changeVolume(Number(e.target.value))}
                  className="w-20 h-1 ml-2 accent-signal"
                />
              )}
            </div>
            <button onClick={onOpenQueue} className="text-muted hover:text-paper" aria-label="Queue">
              <ListMusic size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
