import { useEffect, useRef, useState } from 'react'
import {
  Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Repeat1, Volume2, Volume1, VolumeX,
  Heart, ChevronDown, ListMusic, Settings, Sparkles, Sliders, Moon, Palette, X, Trash2, Music
} from 'lucide-react'
import { usePlayer, THEMES } from '../context/PlayerContext'
import { useLibrary } from '../context/LibraryContext'
import { bestImageUrl, getSongSuggestions } from '../api/jiosaavn'
import { formatTime, artistNames, stripHtml } from '../utils/format'
export default function FullPlayerModal() {
  const {
    audioRef, currentTrack, queue, queueIndex, isPlaying, progress, duration, volume,
    shuffle, repeatMode, isFullPlayerOpen, currentTheme, eq, eqPreset, sleepTimerMinutes,
    sleepTimerRemaining, setIsFullPlayerOpen, setShuffle, setRepeatMode, setTheme,
    setEq, applyEqPreset, setSleepTimerMinutes, togglePlay, goNext, goPrev, seek,
    changeVolume, playNow, removeFromQueue, clearQueue
  } = usePlayer()
  const { isLiked, toggleLiked } = useLibrary()
  const [activeTab, setActiveTab] = useState('player') // 'player' | 'queue' | 'recommendations'
  const [showSettings, setShowSettings] = useState(false)
  const [customTimerMin, setCustomTimerMin] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const canvasRef = useRef(null)
  const rafRef = useRef(null)
  const phaseRef = useRef(0)
  // Fetch song suggestions when current track changes
  useEffect(() => {
    if (!currentTrack?.id) return
    let isMounted = true
    setLoadingSuggestions(true)
    getSongSuggestions(currentTrack.id)
      .then((res) => {
        if (isMounted) {
          setSuggestions(Array.isArray(res) ? res : [])
        }
      })
      .catch(() => {
        if (isMounted) setSuggestions([])
      })
      .finally(() => {
        if (isMounted) setLoadingSuggestions(false)
      })
    return () => { isMounted = false }
  }, [currentTrack?.id])
  // Dynamic Full Canvas Audio Visualizer
  useEffect(() => {
    if (!isFullPlayerOpen || !canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1
    function resize() {
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      ctx.scale(dpr, dpr)
    }
    resize()
    window.addEventListener('resize', resize)
    const bars = 60
    const seeds = Array.from({ length: bars }, () => Math.random() * Math.PI * 2)
    function render() {
      if (!canvas) return
      const width = canvas.width / dpr
      const height = canvas.height / dpr
      ctx.clearRect(0, 0, width, height)
      phaseRef.current += isPlaying ? 0.08 : 0.01
      const barWidth = width / bars
      const centerY = height / 2
      for (let i = 0; i < bars; i++) {
        const amp = isPlaying
          ? 0.35 + 0.5 * Math.abs(Math.sin(phaseRef.current * 1.5 + seeds[i]))
          : 0.08
        const h = amp * (height * 0.45)
        const x = i * barWidth
        const y = centerY - h / 2
        const gradient = ctx.createLinearGradient(0, y, 0, y + h)
        gradient.addColorStop(0, 'var(--accent-main, #00ff88)')
        gradient.addColorStop(1, 'var(--accent-secondary, #00d2ff)')
        ctx.fillStyle = gradient
        ctx.globalAlpha = isPlaying ? 0.75 : 0.25
        ctx.fillRect(x, y, barWidth - 2, Math.max(3, h))
      }
      rafRef.current = requestAnimationFrame(render)
    }
    render()
    return () => {
      window.removeEventListener('resize', resize)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [isFullPlayerOpen, isPlaying])
  // ESC key listener to close modal
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isFullPlayerOpen) {
        setIsFullPlayerOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isFullPlayerOpen, setIsFullPlayerOpen])
  if (!isFullPlayerOpen || !currentTrack) return null
  const artwork = bestImageUrl(currentTrack.image)
  const title = stripHtml(currentTrack.title || currentTrack.name || '')
  const subtitle = artistNames(currentTrack)
  const liked = isLiked(currentTrack.id)
  const VolIcon = volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2
  const RepeatIcon = repeatMode === 'one' ? Repeat1 : Repeat
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-chassis text-paper overflow-hidden animate-in fade-in duration-300">
      {/* Background Animated Vibe Gradient */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center opacity-30 blur-3xl scale-125 transition-all duration-1000"
        style={{ backgroundImage: artwork ? `url(${artwork})` : 'none' }}
      />
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-chassis/80 via-chassis/95 to-chassis" />
      {/* Top Header Navigation */}
      <header className="relative z-20 flex items-center justify-between px-6 py-5 border-b border-line/40 bg-chassis/40 backdrop-blur-md">
        <button
          onClick={() => setIsFullPlayerOpen(false)}
          className="p-2 rounded-full border border-line bg-panel/60 hover:bg-panel hover:scale-105 transition-all"
          aria-label="Collapse Full Player"
        >
          <ChevronDown size={22} />
        </button>
        {/* Section Tabs */}
        <div className="flex items-center gap-1 bg-panel/80 border border-line/60 rounded-full p-1 shadow-inner">
          <button
            onClick={() => setActiveTab('player')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeTab === 'player' ? 'bg-signal text-ink shadow-md' : 'text-muted hover:text-paper'
            }`}
          >
            Now Playing
          </button>
          <button
            onClick={() => setActiveTab('queue')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'queue' ? 'bg-signal text-ink shadow-md' : 'text-muted hover:text-paper'
            }`}
          >
            <ListMusic size={14} />
            <span>Queue ({queue.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('recommendations')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'recommendations' ? 'bg-signal text-ink shadow-md' : 'text-muted hover:text-paper'
            }`}
          >
            <Sparkles size={14} />
            <span>Recommended</span>
          </button>
        </div>
        {/* Settings Toggle */}
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
      {/* Main View Body */}
      <div className="relative z-10 flex-1 flex flex-col md:flex-row overflow-hidden max-w-6xl mx-auto w-full p-6 gap-8">
        {/* Left / Center View Switcher */}
        {activeTab === 'player' && (
          <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto w-full space-y-6">
            {/* Glowing Album Artwork Shell */}
            <div className="relative w-64 h-64 sm:w-80 sm:h-80 aspect-square group">
              {/* Art Glow */}
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
              {/* Quality & Year Badges */}
              <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 px-3 py-1 rounded-full bg-chassis/80 border border-line/60 backdrop-blur-md text-[10px] font-mono text-signal font-bold">
                <span>320 KBPS</span>
                <span>•</span>
                <span>HD AUDIO</span>
              </div>
            </div>
            {/* Song Title & Artist */}
            <div className="text-center space-y-1.5 w-full">
              <h2 className="text-2xl sm:text-3xl font-display font-bold text-paper truncate px-2">{title}</h2>
              <p className="text-sm sm:text-base text-muted truncate px-2 font-medium">{subtitle}</p>
            </div>
            {/* Interactive Visualizer Canvas */}
            <div className="w-full h-16 relative overflow-hidden rounded-xl bg-panel/30 border border-line/20">
              <canvas ref={canvasRef} className="w-full h-full" />
            </div>
            {/* Scrubber Progress Bar */}
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
                className="w-full h-2 bg-line rounded-full accent-signal cursor-pointer"
                style={{
                  background: `linear-gradient(to right, var(--accent-main, #00ff88) ${(progress / (duration || 1)) * 100}%, rgba(255,255,255,0.1) 0)`
                }}
              />
            </div>
            {/* Control Deck */}
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
            {/* Bottom Actions: Volume & Like */}
            <div className="flex items-center justify-between w-full max-w-sm px-4 pt-2">
              <button
                onClick={() => toggleLiked({ ...currentTrack, title, subtitle })}
                className={`p-2 flex items-center gap-2 text-xs font-semibold transition-colors ${
                  liked ? 'text-signal' : 'text-muted hover:text-paper'
                }`}
              >
                <Heart size={20} fill={liked ? 'currentColor' : 'none'} />
                <span>{liked ? 'Liked' : 'Like'}</span>
              </button>
              <div className="flex items-center gap-3 w-40">
                <VolIcon size={18} className="text-muted shrink-0" />
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={volume}
                  onChange={(e) => changeVolume(Number(e.target.value))}
                  className="w-full h-1.5 bg-line rounded-full accent-signal"
                />
              </div>
            </div>
          </div>
        )}
        {/* Tab 2: Queue */}
        {activeTab === 'queue' && (
          <div className="flex-1 flex flex-col h-full overflow-hidden bg-panel/40 border border-line/40 rounded-2xl p-6 backdrop-blur-md">
            <div className="flex items-center justify-between mb-4 border-b border-line/40 pb-3">
              <div>
                <h3 className="text-lg font-display font-bold text-paper">Up Next Queue</h3>
                <p className="text-xs text-muted font-mono">{queue.length} Tracks in sequence</p>
              </div>
              <button
                onClick={clearQueue}
                className="px-3 py-1.5 rounded-lg border border-line bg-panel text-xs text-muted hover:text-signal hover:border-signal transition-colors flex items-center gap-1.5"
              >
                <Trash2 size={14} />
                <span>Clear Queue</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {queue.map((track, idx) => {
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
              })}
            </div>
          </div>
        )}
        {/* Tab 3: Recommendations */}
        {activeTab === 'recommendations' && (
          <div className="flex-1 flex flex-col h-full overflow-hidden bg-panel/40 border border-line/40 rounded-2xl p-6 backdrop-blur-md">
            <div className="mb-4 border-b border-line/40 pb-3">
              <h3 className="text-lg font-display font-bold text-paper flex items-center gap-2">
                <Sparkles className="text-signal" size={18} />
                <span>Recommended Signals</span>
              </h3>
              <p className="text-xs text-muted">Similar tracks selected for this frequency</p>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {loadingSuggestions ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-16 rounded-xl bg-panel animate-pulse border border-line" />
                  ))}
                </div>
              ) : suggestions.length === 0 ? (
                <div className="text-center py-12 text-muted text-sm">
                  <Music size={32} className="mx-auto mb-2 opacity-40" />
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
          </div>
        )}
        {/* Right Drawer: Settings Panel */}
        {showSettings && (
          <aside className="w-full md:w-80 bg-panel/90 border border-line/60 rounded-2xl p-5 overflow-y-auto space-y-6 backdrop-blur-xl animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between border-b border-line/40 pb-3">
              <h3 className="text-base font-display font-bold text-paper flex items-center gap-2">
                <Sliders className="text-signal" size={18} />
                <span>Audio & Vibe Engine</span>
              </h3>
              <button onClick={() => setShowSettings(false)} className="text-muted hover:text-paper">
                <X size={18} />
              </button>
            </div>
            {/* Theme Selector */}
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
            {/* Equalizer */}
            <div className="space-y-3 border-t border-line/40 pt-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-mono text-muted uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders size={14} className="text-signal" />
                  <span>Equalizer</span>
                </h4>
                <span className="text-[10px] font-mono text-signal uppercase">{eqPreset}</span>
              </div>
              {/* EQ Presets */}
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
              {/* EQ Sliders */}
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
            {/* Sleep Timer */}
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
    </div>
  )
}
