import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Play, Pause, Volume2, Volume1, VolumeX, ListMusic, Heart, Maximize2 } from 'lucide-react'
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
    if (!canvas) return
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
      if (!canvas) return
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
    currentTrack, isPlaying, progress, duration, volume,
    togglePlay, goNext, goPrev, seek, changeVolume
  } = usePlayer()
  const { isLiked, toggleLiked } = useLibrary()
  const [showVolume, setShowVolume] = useState(false)
  const navigate = useNavigate()
  // Swipe-to-change-track gesture state, tracked in a ref rather than state
  // since it updates on every pointermove and shouldn't trigger re-renders.
  const swipeRef = useRef({ startX: 0, startY: 0, dragging: false, swiped: false })

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

  // Swipe on the title/artwork area changes tracks — swipe right for
  // previous, swipe left for next — replacing the old skip buttons. A tap
  // (negligible movement) still opens the full player, same as before.
  const SWIPE_THRESHOLD = 50
  function handlePointerDown(e) {
    swipeRef.current = { startX: e.clientX, startY: e.clientY, dragging: true, swiped: false }
    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
  }
  function handlePointerMove(e) {
    const s = swipeRef.current
    if (!s.dragging) return
    const dx = e.clientX - s.startX
    const dy = e.clientY - s.startY
    if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy)) {
      s.swiped = true
    }
  }
  function handlePointerUp(e) {
    const s = swipeRef.current
    window.removeEventListener('pointermove', handlePointerMove)
    window.removeEventListener('pointerup', handlePointerUp)
    if (!s.dragging) return
    const dx = e.clientX - s.startX
    s.dragging = false
    if (s.swiped && Math.abs(dx) > SWIPE_THRESHOLD) {
      if (dx > 0) goPrev()
      else goNext()
    } else if (!s.swiped) {
      navigate('/now-playing')
    }
  }

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
              className="theme-seek flex-1 h-1 bg-line rounded-full"
              style={{
                background: `linear-gradient(to right, var(--accent-main, #FF5C35) ${(progress / (duration || 1)) * 100}%, #332C22 0)`
              }}
              aria-label="Seek"
            />
            <span className="w-10 tabular-nums text-right">{formatTime(duration)}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 md:gap-4 px-3 py-2.5">
          {/* Swipeable title/artwork area — swipe to change tracks, tap to expand */}
          <div
            onPointerDown={handlePointerDown}
            className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer select-none touch-pan-y"
            style={{ touchAction: 'pan-y' }}
          >
            {artwork && (
              <img
                src={artwork}
                alt=""
                className="w-11 h-11 rounded object-cover flex-shrink-0 border border-line"
              />
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{title}</p>
              <p className="text-xs text-muted truncate">{subtitle}</p>
            </div>
          </div>

          {/* Play/pause + Like — grouped together near the title, replacing
              the old shuffle/prev/next/repeat cluster entirely. */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => toggleLiked({ ...currentTrack, title, subtitle })}
              className={liked ? 'text-signal' : 'text-muted hover:text-paper'}
              aria-label={liked ? 'Unlike' : 'Like'}
            >
              <Heart size={18} fill={liked ? 'currentColor' : 'none'} />
            </button>
            <button
              onClick={togglePlay}
              className="w-9 h-9 rounded-full bg-signal text-ink flex items-center justify-center hover:bg-signal2 shadow-knob shrink-0"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
            </button>
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
            <button
              onClick={() => navigate('/now-playing')}
              className="text-muted hover:text-signal p-1 transition-colors"
              aria-label="Expand player"
              title="Expand Full Player"
            >
              <Maximize2 size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
