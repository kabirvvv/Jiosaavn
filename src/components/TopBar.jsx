import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { Search, Settings, Palette, Sliders, Moon, X } from 'lucide-react'
import { usePlayer, THEMES } from '../context/PlayerContext'
import { motion } from 'framer-motion'

export default function TopBar() {
  const navigate = useNavigate()
  const location = useLocation()
  const [showSettings, setShowSettings] = useState(false)

  const {
    currentTheme, eq, eqPreset, sleepTimerMinutes, sleepTimerRemaining,
    setTheme, setEq, applyEqPreset, setSleepTimerMinutes
  } = usePlayer()
  const [customTimerMin, setCustomTimerMin] = useState('')

  return (
    <div className="sticky top-0 z-20 bg-ink/90 backdrop-blur border-b border-line">
      <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3">
        <motion.button
          layoutId="search-morph"
          onClick={() => navigate('/search')}
          className="text-muted hover:text-paper flex-shrink-0 p-2 rounded-full bg-panel border border-line hover:bg-panel2 transition-colors"
          aria-label="Search"
        >
          <Search size={18} />
        </motion.button>
        <button
          onClick={() => setShowSettings(true)}
          className="text-muted hover:text-paper flex-shrink-0 p-1.5 rounded-full hover:bg-panel transition-colors"
          aria-label="Settings"
        >
          <Settings size={20} />
        </button>
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
