import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Repeat1,
  Heart, ChevronDown, ListMusic, Settings, Sparkles, Sliders, Moon, Palette, X, Trash2, Music, Maximize2, Download
} from 'lucide-react'
import { usePlayer, THEMES } from '../context/PlayerContext'
import { useLibrary } from '../context/LibraryContext'
import { bestImageUrl, getSongSuggestions } from '../api/jiosaavn'
import { formatTime, artistNames, stripHtml } from '../utils/format'

export default function NowPlayingPage() {
  const navigate = useNavigate()
  const {
    currentTrack, queue, queueIndex, isPlaying, progress, duration,
    shuffle, repeatMode, currentTheme, eq, eqPreset, sleepTimerMinutes,
    sleepTimerRemaining, setShuffle, setRepeatMode, setTheme,
    setEq, applyEqPreset, setSleepTimerMinutes, togglePlay, goNext, goPrev, seek,
    playNow, removeFromQueue, clearQueue, lyrics, lyricsLoading
  } = usePlayer()
  const { isLiked, toggleLiked } = useLibrary()
  const [showSettings, setShowSettings] = useState(false)
  const [customTimerMin, setCustomTimerMin] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const canvasRef = useRef(null)
  const rafRef = useRef(null)

  useEffect(() => {
    if (!currentTrack?.id) return
    let isMounted = true
    setLoadingSuggestions(true)
    getSongSuggestions(currentTrack.id)
      .then((res) => { if (isMounted) setSuggestions(Array.isArray(res) ? res : []) })
      .catch(() => { if (isMounted) setSuggestions([]) })
      .finally(() => { if (isMounted) setLoadingSuggestions(false) })
    return () => { isMounted = false }
  }, [currentTrack?.id])

  useEffect(() => {
    if (!canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1
    const styles = getComputedStyle(document.documentElement)
    const colorMain = styles.getPropertyValue('--accent-main').trim() || '#FF5C35'
    const colorSecondary = styles.getPropertyValue('--accent-secondary').trim() || '#6FE7C5'

    function resize() {
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      ctx.scale(dpr, dpr)
    }
    resize()
    window.addEventListener('resize', resize)

    const bars = 48
    // Each bar eases toward a target height that gets reshuffled on a
    // semi-randomized "beat" interval, instead of every bar moving in
    // mechanical lockstep on a single sine wave. Reads as rhythmic and
    // alive without needing real audio-frequency analysis (which is
    // intentionally avoided here — see Web Audio API CORS gotcha).
    const current = new Array(bars).fill(0.1)
    const targets = new Array(bars).fill(0.1)
    let lastBeatTime = 0
    let beatInterval = 380 + Math.random() * 260

    function render(timestamp) {
      if (!canvas) return
      const width = canvas.width / dpr
      const height = canvas.height / dpr
      ctx.clearRect(0, 0, width, height)

      if (isPlaying && timestamp - lastBeatTime > beatInterval) {
        lastBeatTime = timestamp
        beatInterval = 320 + Math.random() * 280
        for (let i = 0; i < bars; i++) {
          const wave = Math.sin((i / bars) * Math.PI * 2 + timestamp * 0.0006)
          targets[i] = 0.25 + Math.random() * 0.55 + Math.max(0, wave) * 0.3
        }
      }

      const barWidth = width / bars
      const centerY = height / 2
      for (let i = 0; i < bars; i++) {
        const easing = isPlaying ? 0.12 : 0.04
        const target = isPlaying ? targets[i] : 0.08
        current[i] += (target - current[i]) * easing
        const h = current[i] * (height * 0.5)
        const x = i * barWidth
        const y = centerY - h / 2
        const gradient = ctx.createLinearGradient(0, y, 0, y + h)
        gradient.addColorStop(0, colorMain)
        gradient.addColorStop(1, colorSecondary)
        ctx.fillStyle = gradient
        ctx.globalAlpha = isPlaying ? 0.8 : 0.25
        ctx.fillRect(x, y, barWidth - 2, Math.max(3, h))
      }
      rafRef.current = requestAnimationFrame(render)
    }
    rafRef.current = requestAnimationFrame(render)
    return () => {
      window.removeEventListener('resize', resize)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [isPlaying, currentTheme])

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') navigate(-1)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [navigate])

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
  const liked = isLiked(currentTrack.id)
  const RepeatIcon = repeatMode === 'one' ? Repeat1 : Repeat

  const activeLyricIndex = lyrics?.synced?.length
    ? lyrics.synced.reduce((acc, line, i) => (line.time <= progress ? i : acc), -1)
    : -1
  const previewLines = lyrics?.synced?.length
    ? lyrics.synced.slice(Math.max(0, activeLyricIndex - 1), activeLyricIndex + 2)
    : []

  return (
    <div className="min-h-screen w-full bg-chassis text-paper relative overflow-y-auto">
      <div
        className="fixed inset-0 z-0 bg-cover bg-center opacity-30 blur-3xl scale-125"
        style={{ backgroundImage: artwork ? `url(${artwork})` : 'none' }}
      />
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-chassis/80 via-chassis/95 to-chassis" />

      <header className="sticky top-0 z-20 flex items-center justify-between px-6 py-5 border-b border-line/40 bg-chassis/60 backdrop-blur-md">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-full border border-line bg-panel/60 hover:bg-panel hover:scale-105 transition-all"
          aria-label="Back"
        >
          <ChevronDown size={22} />
        </button>
        <span className="text-xs font-mono text-muted uppercase tracking-wider">Now Playing</span>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className={`p-2 rounded-full border border-line transition-all ${
            showSettings ? 'bg-signal text-ink border-signal' : 'bg-panel/60 text-muted hover:text-paper hover:bg-panel'
          }`}
          aria-label="Settings"
        >
          <Settings size={20} />
        </button>
      </header>

      <div className="relative z-10 max-w-2xl mx-auto w-full p-6 space-y-8 pb-24">
        <div className="flex flex-col items-center w-full space-y-6">
          <div className="relative w-64 h-64 sm:w-80 sm:h-80 aspect-square group">
            <div
              className={`absolute inset-0 rounded-3xl bg-signal opacity-30 blur-2xl transition-all duration-500 ${
                isPlaying ? 'scale-110 opacity-50' : 'scale-95 opacity-20'
              }`}
            />
            <img
              src={artwork}
              alt={title}
              className={`relative z-10 w-full h-full object-cover rounded-3xl border border-line/60 shadow-2xl transition-transform duration-700 ${
                isPlaying ? 'scale-105' : 'scale-100'
              }`}
            />
          </div>
          <div className="text-center space-y-1.5 w-full">
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-paper truncate px-2">{title}</h2>
            <p className="text-sm sm:text-base text-muted truncate px-2 font-medium">{subtitle}</p>
          </div>
          <div className="w-full flex items-center gap-3">
            <button
              onClick={() => {/* TODO: wire up download */}}
              className="w-11 h-11 shrink-0 rounded-full border border-line bg-panel/60 text-muted hover:text-signal hover:border-signal transition-all flex items-center justify-center"
              aria-label="Download"
            >
              <Download size={18} />
            </button>
            <div className="flex-1 h-16 relative overflow-hidden rounded-xl bg-panel/30 border border-line/20">
              <canvas ref={canvasRef} className="w-full h-full" />
            </div>
            <button
              onClick={() => toggleLiked({ ...currentTrack, title, subtitle })}
              className={`w-11 h-11 shrink-0 rounded-full border transition-all flex items-center justify-center ${
                liked ? 'text-signal border-signal bg-signal/10' : 'text-muted border-line bg-panel/60 hover:text-paper'
              }`}
              aria-label="Like"
            >
              <Heart size={18} fill={liked ? 'currentColor' : 'none'} />
            </button>
          </div>
          <div className="w-full space-y-2">
            <div className="flex justify-between text-xs font-mono text-muted">
              <span>{formatTime(progress)}</span>
              <span>{formatTime(duration)}</span>
            </div>
            <input
              type="range"
              min={0}
              max={duration || 0}
              value={progress}
              onChange={(e) => seek(Number(e.target.value))}
              className="theme-seek w-full h-2 bg-line rounded-full cursor-pointer"
              style={{
                background: `linear-gradient(to right, var(--accent-main, #00ff88) ${(progress / (duration || 1)) * 100}%, rgba(255,255,255,0.1) 0)`
              }}
            />
          </div>
          <div className="flex items-center justify-between w-full max-w-sm px-2">
            <button
              onClick={() => setShuffle(!shuffle)}
              className={`p-2 transition-colors ${shuffle ? 'text-signal' : 'text-muted hover:text-paper'}`}
              aria-label="Shuffle"
            >
              <Shuffle size={20} />
            </button>
            <button onClick={goPrev} className="p-2 text-paper hover:text-signal transition-colors" aria-label="Previous">
              <SkipBack size={26} fill="currentColor" />
            </button>
            <button
              onClick={togglePlay}
              className="w-16 h-16 rounded-full bg-signal text-ink flex items-center justify-center shadow-xl hover:bg-signal2 hover:scale-105 transition-all"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-1" />}
            </button>
            <button onClick={goNext} className="p-2 text-paper hover:text-signal transition-colors" aria-label="Next">
              <SkipForward size={26} fill="currentColor" />
            </button>
            <button
              onClick={() => setRepeatMode(repeatMode === 'off' ? 'all' : repeatMode === 'all' ? 'one' : 'off')}
              className={`p-2 relative transition-colors ${repeatMode !== 'off' ? 'text-signal' : 'text-muted hover:text-paper'}`}
              aria-label="Repeat"
            >
              <RepeatIcon size={20} />
              {repeatMode === 'one' && (
                <span className="absolute -bottom-1 -right-1 bg-signal text-ink text-[9px] font-bold px-1 rounded">1</span>
              )}
            </button>
          </div>
        </div>

        {/* Queue — directly below the seekbar/transport controls */}
        <section className="bg-panel/40 border border-line/40 rounded-2xl p-5 backdrop-blur-md">
          <div className="flex items-center justify-between mb-4 border-b border-line/40 pb-3">
            <div>
              <h3 className="text-base font-display font-bold text-paper flex items-center gap-2">
                <ListMusic size={16} className="text-signal" />
                <span>Up Next</span>
              </h3>
              <p className="text-xs text-muted font-mono">{queue.length} tracks in sequence</p>
            </div>
            <button
              onClick={clearQueue}
              className="px-3 py-1.5 rounded-lg border border-line bg-panel text-xs text-muted hover:text-signal hover:border-signal transition-colors flex items-center gap-1.5"
            >
              <Trash2 size={14} />
              <span>Clear</span>
            </button>
          </div>
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {queue.length === 0 ? (
              <p className="text-center py-6 text-xs text-muted">Queue is empty.</p>
            ) : (
              queue.map((track, idx) => {
                const isCurr = idx === queueIndex
                const art = bestImageUrl(track.image)
                const trTitle = stripHtml(track.title || track.name || '')
                const trArtist = artistNames(track)
                return (
                  <div
                    key={`${track.id}-${idx}`}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                      isCurr
                        ? 'bg-signal/15 border-signal/40 text-signal font-semibold'
                        : 'bg-panel/60 border-line/30 text-paper hover:bg-panel'
                    }`}
                  >
                    <div
                      onClick={() => playNow(track, queue)}
                      className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                    >
                      <span className="w-6 text-xs font-mono text-muted text-center">{idx + 1}</span>
                      {art && <img src={art} alt="" className="w-10 h-10 rounded object-cover shrink-0 border border-line/30" />}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm truncate">{trTitle}</p>
                        <p className="text-xs text-muted truncate">{trArtist}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFromQueue(idx)}
                      className="p-2 text-muted hover:text-signal transition-colors"
                      aria-label="Remove from queue"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )
              })
            )}
          </div>
        </section>

        {/* Lyrics — auto-loaded preview, Expand opens the dedicated page */}
        <section className="bg-panel/40 border border-line/40 rounded-2xl p-5 backdrop-blur-md">
          <div className="flex items-center justify-between mb-4 border-b border-line/40 pb-3">
            <h3 className="text-base font-display font-bold text-paper">Lyrics</h3>
            <button
              onClick={() => navigate('/lyrics')}
              className="px-3 py-1.5 rounded-lg border border-line bg-panel text-xs text-muted hover:text-signal hover:border-signal transition-colors flex items-center gap-1.5"
            >
              <Maximize2 size={14} />
              <span>Expand</span>
            </button>
          </div>
          {lyricsLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-4 rounded bg-panel animate-pulse border border-line/30" />
              ))}
            </div>
          ) : !lyrics || (!lyrics.plain && !lyrics.synced.length) ? (
            <p className="text-center py-6 text-xs text-muted">No lyrics found for this track.</p>
          ) : lyrics.instrumental ? (
            <p className="text-center py-6 text-xs text-muted">This track is instrumental.</p>
          ) : previewLines.length ? (
            <div className="space-y-2 text-center py-2">
              {previewLines.map((line, i) => {
                const isActive = lyrics.synced[activeLyricIndex]?.time === line.time
                return (
                  <p
                    key={i}
                    className={`text-sm transition-colors ${isActive ? 'text-signal font-semibold' : 'text-muted'}`}
                  >
                    {line.text || '···'}
                  </p>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-muted text-center line-clamp-4 px-2">{lyrics.plain}</p>
          )}
        </section>

        {/* Recommended — kept for parity, no longer tabbed */}
        <section className="bg-panel/40 border border-line/40 rounded-2xl p-5 backdrop-blur-md">
          <div className="mb-4 border-b border-line/40 pb-3">
            <h3 className="text-base font-display font-bold text-paper flex items-center gap-2">
              <Sparkles className="text-signal" size={16} />
              <span>Recommended</span>
            </h3>
          </div>
          <div className="space-y-2">
            {loadingSuggestions ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 rounded-xl bg-panel animate-pulse border border-line" />
              ))
            ) : suggestions.length === 0 ? (
              <div className="text-center py-8 text-muted text-sm">
                <Music size={28} className="mx-auto mb-2 opacity-40" />
                <p>No extra suggestions found for this song.</p>
              </div>
            ) : (
              suggestions.map((track) => {
                const art = bestImageUrl(track.image)
                const trTitle = stripHtml(track.title || track.name || '')
                const trArtist = artistNames(track)
                return (
                  <div
                    key={track.id}
                    onClick={() => playNow(track)}
                    className="flex items-center justify-between p-3 rounded-xl bg-panel/60 border border-line/30 hover:bg-panel hover:border-signal/40 cursor-pointer transition-all group"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {art && <img src={art} alt="" className="w-11 h-11 rounded object-cover shrink-0 border border-line/30" />}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-paper group-hover:text-signal truncate">{trTitle}</p>
                        <p className="text-xs text-muted truncate">{trArtist}</p>
                      </div>
                    </div>
                    <button className="w-9 h-9 rounded-full bg-signal/10 text-signal flex items-center justify-center group-hover:bg-signal group-hover:text-ink transition-all">
                      <Play size={16} fill="currentColor" className="ml-0.5" />
                    </button>
                  </div>
                )
              })
            )}
          </div>
        </section>
      </div>

      {showSettings && (
        <aside className="fixed top-0 right-0 z-30 h-full w-full sm:w-80 bg-panel/95 border-l border-line/60 p-5 overflow-y-auto space-y-6 backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-line/40 pb-3">
            <h3 className="text-base font-display font-bold text-paper flex items-center gap-2">
              <Sliders className="text-signal" size={18} />
              <span>Audio & Vibe Engine</span>
            </h3>
            <button onClick={() => setShowSettings(false)} className="text-muted hover:text-paper">
              <X size={18} />
            </button>
          </div>
          <div className="space-y-3">
            <h4 className="text-xs font-mono text-muted uppercase tracking-wider flex items-center gap-1.5">
              <Palette size={14} className="text-signal" />
              <span>App Theme</span>
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(THEMES).map(([key, t]) => (
                <button
                  key={key}
                  onClick={() => setTheme(key)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    currentTheme === key
                      ? 'border-signal bg-signal/15 text-paper font-semibold shadow-md'
                      : 'border-line/40 bg-panel/50 text-muted hover:text-paper hover:bg-panel'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-white/20 shrink-0"
                      style={{ backgroundColor: t.colors['--accent-main'] }}
                    />
                    <span className="text-xs font-bold truncate">{t.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-3 border-t border-line/40 pt-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-mono text-muted uppercase tracking-wider flex items-center gap-1.5">
                <Sliders size={14} className="text-signal" />
                <span>Equalizer</span>
              </h4>
              <span className="text-[10px] font-mono text-signal uppercase">{eqPreset}</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {['flat', 'bass', 'pop', 'chill'].map((p) => (
                <button
                  key={p}
                  onClick={() => applyEqPreset(p)}
                  className={`py-1 rounded-md text-[10px] font-mono capitalize transition-all ${
                    eqPreset === p ? 'bg-signal text-ink font-bold' : 'bg-panel border border-line/40 text-muted hover:text-paper'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            <div className="space-y-2 pt-1 text-xs font-mono text-muted">
              <div className="flex items-center justify-between">
                <span>Low Bass</span>
                <span className="text-paper">{eq.low} dB</span>
              </div>
              <input
                type="range"
                min={-12}
                max={12}
                value={eq.low}
                onChange={(e) => setEq((prev) => ({ ...prev, low: Number(e.target.value) }))}
                className="w-full h-1 bg-line rounded-full accent-signal"
              />
              <div className="flex items-center justify-between">
                <span>Mids</span>
                <span className="text-paper">{eq.mid} dB</span>
              </div>
              <input
                type="range"
                min={-12}
                max={12}
                value={eq.mid}
                onChange={(e) => setEq((prev) => ({ ...prev, mid: Number(e.target.value) }))}
                className="w-full h-1 bg-line rounded-full accent-signal"
              />
              <div className="flex items-center justify-between">
                <span>High Treble</span>
                <span className="text-paper">{eq.high} dB</span>
              </div>
              <input
                type="range"
                min={-12}
                max={12}
                value={eq.high}
                onChange={(e) => setEq((prev) => ({ ...prev, high: Number(e.target.value) }))}
                className="w-full h-1 bg-line rounded-full accent-signal"
              />
            </div>
          </div>
          <div className="space-y-3 border-t border-line/40 pt-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-mono text-muted uppercase tracking-wider flex items-center gap-1.5">
                <Moon size={14} className="text-signal" />
                <span>Sleep Timer</span>
              </h4>
              {sleepTimerRemaining > 0 && (
                <span className="text-[10px] font-mono text-signal font-bold">
                  {Math.floor(sleepTimerRemaining / 60)}m {sleepTimerRemaining % 60}s
                </span>
              )}
            </div>
            <div className="grid grid-cols-5 gap-1">
              {[0, 15, 30, 60, 120].map((mins) => (
                <button
                  key={mins}
                  onClick={() => setSleepTimerMinutes(mins)}
                  className={`py-1.5 rounded-lg text-[10px] font-mono transition-all ${
                    sleepTimerMinutes === mins
                      ? 'bg-signal text-ink font-bold'
                      : 'bg-panel border border-line/40 text-muted hover:text-paper'
                  }`}
                >
                  {mins === 0 ? 'Off' : `${mins}m`}
                </button>
              ))}
            </div>
            <div className="flex gap-2 pt-1">
              <input
                type="number"
                placeholder="Custom Mins"
                value={customTimerMin}
                onChange={(e) => setCustomTimerMin(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-panel border border-line text-xs outline-none focus:border-signal"
              />
              <button
                onClick={() => {
                  const m = parseInt(customTimerMin, 10)
                  if (m > 0) setSleepTimerMinutes(m)
                }}
                className="px-4 py-1.5 rounded-lg bg-signal text-ink text-xs font-bold hover:bg-signal2"
              >
                Set
              </button>
            </div>
          </div>
        </aside>
      )}
    </div>
  )
}
