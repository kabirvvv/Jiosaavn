import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { Search, Settings, Palette, Moon, Type, X, Disc3, User } from 'lucide-react'
import { usePlayer, THEMES, LYRICS_FONTS, LYRICS_WEIGHTS } from '../context/PlayerContext'
import { motion } from 'framer-motion'

const DEBOUNCE_MS = 400

export default function TopBar() {
  const navigate = useNavigate()
  const location = useLocation()
  const isSearch = location.pathname === '/search'
  const [params] = useSearchParams()
  const [value, setValue] = useState(params.get('q') || '')
  const debounceRef = useRef(null)
  const isFirstRun = useRef(true)
  const [showSettings, setShowSettings] = useState(false)

  const {
    currentTheme, sleepTimerMinutes, sleepTimerRemaining,
    lyricsFontFamily, lyricsFontWeight, lyricsFontSize,
    setTheme, setSleepTimerMinutes,
    setLyricsFontFamily, setLyricsFontWeight, setLyricsFontSize
  } = usePlayer()
  const [customTimerMin, setCustomTimerMin] = useState('')

  useEffect(() => {
    setValue(params.get('q') || '')
  }, [params])

  useEffect(() => {
    if (!isSearch) return
    if (isFirstRun.current) {
      isFirstRun.current = false
      return
    }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    const trimmed = value.trim()
    debounceRef.current = setTimeout(() => {
      if (trimmed) navigate(`/search?q=${encodeURIComponent(trimmed)}`, { replace: true })
      else navigate('/search', { replace: true })
    }, DEBOUNCE_MS)
    return () => clearTimeout(debounceRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, isSearch])

  function submit(e) {
    e.preventDefault()
    if (debounceRef.current) clearTimeout(debounceRef.current)
    const trimmed = value.trim()
    if (trimmed) navigate(`/search?q=${encodeURIComponent(trimmed)}`, { replace: true })
  }

  return (
    <div className="sticky top-0 z-20 bg-ink/90 backdrop-blur border-b border-line">
      <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3">
        {/* Brand mark — occupies the left space vacated by the search bar */}
        {location.pathname === '/' ? (
  <div className="flex items-center gap-2 flex-shrink-0 min-w-0">
    <Disc3 className="text-signal flex-shrink-0" size={20} />
    <span className="font-display font-bold text-base tracking-tight truncate">Wavelength</span>
  </div>
) : (
  <div />
)}

        {/* Right-hand cluster: search (icon or expanded input) + profile + settings.
            When isSearch, this group grows to take the remaining row width so the
            input has room, while the brand mark on the left stays fixed-size. */}
        <div className={`flex items-center gap-2 ${isSearch ? 'flex-1 justify-end min-w-0' : 'flex-shrink-0'}`}>
          <motion.div
            layout
            transition={{ type: 'spring', stiffness: 400, damping: 32 }}
            className={isSearch ? 'flex-1 max-w-xl min-w-0' : ''}
          >
            {isSearch ? (
              <form onSubmit={submit}>
                <motion.div
                  layout
                  className="flex items-center gap-2 bg-panel border border-line rounded-full px-4 py-2.5 focus-within:border-signal focus-within:ring-1 focus-within:ring-signal/40 transition-colors"
                >
                  <Search size={16} className="text-muted flex-shrink-0" />
                  <input
                    autoFocus
                    name="signal-deck-search"
                    id="signal-deck-search"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="Search tracks, albums, artists, playlists"
                    className="bg-transparent outline-none focus-visible:outline-none text-sm flex-1 placeholder:text-muted"
                  />
                </motion.div>
              </form>
            ) : (
              <motion.button
                layout
                onClick={() => navigate('/search')}
                className="text-muted hover:text-paper flex-shrink-0 p-2 rounded-full bg-panel border border-line hover:bg-panel2 transition-colors"
                aria-label="Search"
              >
                <Search size={18} />
              </motion.button>
            )}
          </motion.div>

          <button
            onClick={() => navigate('/profile')}
            className="text-muted hover:text-paper flex-shrink-0 p-2 rounded-full bg-panel border border-line hover:bg-panel2 transition-colors"
            aria-label="Profile"
          >
            <User size={18} />
          </button>

          <button
            onClick={() => setShowSettings(true)}
            className="text-muted hover:text-paper flex-shrink-0 p-1.5 rounded-full hover:bg-panel transition-colors"
            aria-label="Settings"
          >
            <Settings size={20} />
          </button>
        </div>
      </div>

      {/* Rendered via portal directly to document.body — this panel must
          NOT be a DOM descendant of this component's root div. That root
          div has `backdrop-blur` (backdrop-filter), which per the CSS spec
          establishes a containing block for any `position: fixed`
          descendant. Without the portal, the "fixed" backdrop/aside below
          would anchor to THIS div's small height (~60px) instead of the
          full viewport — meaning `h-full` resolves to "100% of the topbar",
          clipping everything except the header out of view even though
          it's correctly present in the DOM. */}
      {showSettings && createPortal(
        <>
          <div
            className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
            onClick={() => setShowSettings(false)}
          />
          <aside className="fixed top-0 right-0 z-[110] h-screen w-full sm:w-80 bg-panel/95 border-l border-line/60 p-5 overflow-y-auto space-y-6 backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-line/40 pb-3">
              <h3 className="text-base font-display font-bold text-paper flex items-center gap-2">
                <Settings className="text-signal" size={18} />
                <span>App Settings</span>
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
              <h4 className="text-xs font-mono text-muted uppercase tracking-wider flex items-center gap-1.5">
                <Type size={14} className="text-signal" />
                <span>Lyrics Style</span>
              </h4>

              <div className="space-y-1.5">
                <span className="text-[10px] font-mono text-muted">Font</span>
                <div className="grid grid-cols-3 gap-1.5">
                  {Object.entries(LYRICS_FONTS).map(([key, f]) => (
                    <button
                      key={key}
                      onClick={() => setLyricsFontFamily(key)}
                      className={`py-1.5 rounded-md text-[11px] transition-all ${f.className} ${
                        lyricsFontFamily === key
                          ? 'bg-signal text-ink font-bold'
                          : 'bg-panel border border-line/40 text-muted hover:text-paper'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] font-mono text-muted">Weight</span>
                <div className="grid grid-cols-4 gap-1.5">
                  {Object.entries(LYRICS_WEIGHTS).map(([key, w]) => (
                    <button
                      key={key}
                      onClick={() => setLyricsFontWeight(key)}
                      className={`py-1.5 rounded-md text-[10px] transition-all ${w.className} ${
                        lyricsFontWeight === key
                          ? 'bg-signal text-ink font-bold'
                          : 'bg-panel border border-line/40 text-muted hover:text-paper'
                      }`}
                    >
                      {w.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-muted">Size</span>
                  <span className="text-[10px] font-mono text-paper">{lyricsFontSize}px</span>
                </div>
                <input
                  type="range"
                  min={14}
                  max={28}
                  step={1}
                  value={lyricsFontSize}
                  onChange={(e) => setLyricsFontSize(Number(e.target.value))}
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
        </>,
        document.body
      )}
    </div>
  )
}
