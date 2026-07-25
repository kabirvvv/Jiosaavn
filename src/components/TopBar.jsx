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

      {/* ...settings portal block stays exactly as it was, unchanged... */}
    </div>
  )
}
