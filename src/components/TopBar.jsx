import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { Search, Settings, Palette, Sliders, Moon, X } from 'lucide-react'
import { usePlayer, THEMES } from '../context/PlayerContext'

const DEBOUNCE_MS = 400

export default function TopBar() {
  const navigate = useNavigate()
  const location = useLocation()
  const [params] = useSearchParams()
  const [value, setValue] = useState(params.get('q') || '')
  const debounceRef = useRef(null)
  const isFirstRun = useRef(true)
  const [showSettings, setShowSettings] = useState(false)

  const {
    currentTheme, eq, eqPreset, sleepTimerMinutes, sleepTimerRemaining,
    setTheme, setEq, applyEqPreset, setSleepTimerMinutes
  } = usePlayer()
  const [customTimerMin, setCustomTimerMin] = useState('')

  // Keep the input in sync if the URL's ?q= changes from elsewhere (e.g.
  // clicking a "View All" link on the homepage that sets its own query).
  useEffect(() => {
    setValue(params.get('q') || '')
  }, [params])

  // Live search-as-you-type: debounce keystrokes, then navigate to /search
  // with the query. Uses { replace: true } so every keystroke doesn't push
  // a new history entry — back/forward stays clean, one step per "session"
  // of typing rather than per character.
  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false
      return
    }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    const trimmed = value.trim()
    debounceRef.current = setTimeout(() => {
      if (trimmed) {
        navigate(`/search?q=${encodeURIComponent(trimmed)}`, { replace: true })
      } else if (location.pathname === '/search') {
        navigate('/search', { replace: true })
      }
    }, DEBOUNCE_MS)
    return () => clearTimeout(debounceRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  const submit = (e) => {
    e.preventDefault()
    if (debounceRef.current) clearTimeout(debounceRef.current)
    const trimmed = value.trim()
    if (trimmed) navigate(`/search?q=${encodeURIComponent(trimmed)}`, { replace: true })
  }

  return (
    <div className="sticky top-0 z-20 bg-ink/90 backdrop-blur border-b border-line">
      <div className="flex items-center gap-3 px-4 sm:px-6 py-3">
        <form onSubmit={submit} className="flex-1 max-w-xl">
          <div className="flex items-center gap-2 bg-panel border border-line rounded-full px-4 py-2 focus-within:border-signal transition-colors">
            <Search size={16} className="text-muted flex-shrink-0" />
            <input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Search tracks, albums, artists, playlists"
              className="bg-transparent outline-none text-sm flex-1 placeholder:text-muted"
            />
          </div>
        </form>
        <button
          onClick={() => setShowSettings(true)}
          className="text-muted hover:text-paper flex-shrink-0 p-1.5 rounded-full hover:bg-panel transition-colors"
          aria-label="Settings"
        >
          <Settings size={20} />
        </button>
      </div>

      {showSettings && (
        <>
          <div
            className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowSettings(false)}
          />
          <aside className="fixed top-0 right-0 z-40 h-full w-full sm:w-80 bg-panel/95 border-l border-line/60 p-5 overflow-y-auto space-y-6 backdrop-blur-xl">
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
        </>
      )}
    </div>
  )
}
