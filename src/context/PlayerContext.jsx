import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import { doc, setDoc, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from './AuthContext'
import { bestAudioUrl, getSongById } from '../api/jiosaavn'
import { getLyrics } from '../api/lrclib'
import { stripHtml, artistNames } from '../utils/format'

export const THEMES = {
  emerald: {
    name: 'Emerald',
    desc: 'Deep rich green aesthetic with crystalline highlights',
    colors: {
      '--bg-deep': '#020503',
      '--accent-main': '#00ffa2',
      '--accent-secondary': '#00d2ff',
      '--accent-r': '0', '--accent-g': '255', '--accent-b': '162',
      '--vibe-col-1': '#0a1f11',
      '--vibe-col-2': '#020503'
    }
  },
  nebula: {
    name: 'Nebula',
    desc: 'Electric cosmic blue with sky-cyan atmosphere',
    colors: {
      '--bg-deep': '#050a1f',
      '--accent-main': '#00d2ff',
      '--accent-secondary': '#00ffff',
      '--accent-r': '0', '--accent-g': '210', '--accent-b': '255',
      '--vibe-col-1': '#0a1a3e',
      '--vibe-col-2': '#050a1f'
    }
  },
  solaris: {
    name: 'Solaris',
    desc: 'Warm golden-hour amber blending into fiery solar rays',
    colors: {
      '--bg-deep': '#1f150a',
      '--accent-main': '#ffcc33',
      '--accent-secondary': '#ff6600',
      '--accent-r': '255', '--accent-g': '204', '--accent-b': '51',
      '--vibe-col-1': '#2e1d0a',
      '--vibe-col-2': '#1f150a'
    }
  },
  midnight: {
    name: 'Midnight',
    desc: 'Deep galactic sapphire with sharp neon indigo glow',
    colors: {
      '--bg-deep': '#020208',
      '--accent-main': '#0077ff',
      '--accent-secondary': '#00ffff',
      '--accent-r': '0', '--accent-g': '119', '--accent-b': '255',
      '--vibe-col-1': '#05051a',
      '--vibe-col-2': '#020208'
    }
  },
  cyberpunk: {
    name: 'Cyberpunk',
    desc: 'High-tech magenta and cyan drenched neon darkmode',
    colors: {
      '--bg-deep': '#0a0b1e',
      '--accent-main': '#ff00ff',
      '--accent-secondary': '#00ffff',
      '--accent-r': '255', '--accent-g': '0', '--accent-b': '255',
      '--vibe-col-1': '#190a1e',
      '--vibe-col-2': '#0a0b1e'
    }
  },
  flare: {
    name: 'Flare',
    desc: 'Aggressive high-energy crimson and blazing orange',
    colors: {
      '--bg-deep': '#120505',
      '--accent-main': '#ff4d00',
      '--accent-secondary': '#ffcc00',
      '--accent-r': '255', '--accent-g': '77', '--accent-b': '0',
      '--vibe-col-1': '#2e0b0b',
      '--vibe-col-2': '#120505'
    }
  },
  hob: {
    name: 'H.O.B',
    desc: 'Minimalist monochromatic obsidian black and stark white',
    colors: {
      '--bg-deep': '#000000',
      '--accent-main': '#ffffff',
      '--accent-secondary': '#444444',
      '--accent-r': '255', '--accent-g': '255', '--accent-b': '255',
      '--vibe-col-1': '#111111',
      '--vibe-col-2': '#000000'
    }
  }
}

// Converts "#RRGGBB" to Tailwind's expected "R G B" (space-separated, no
// commas) format, so rgb(var(--x) / <alpha-value>) resolves correctly.
function hexToRgbTriplet(hex) {
  const clean = hex.replace('#', '')
  const bigint = parseInt(clean, 16)
  const r = (bigint >> 16) & 255
  const g = (bigint >> 8) & 255
  const b = bigint & 255
  return `${r} ${g} ${b}`
}

// Font family options for the Lyrics Style setting, reusing the three
// fonts already established in the app's design system rather than
// introducing new ones.
export const LYRICS_FONTS = {
  sans: { label: 'Inter', className: 'font-sans' },
  display: { label: 'Bricolage', className: 'font-display' },
  mono: { label: 'Mono', className: 'font-mono' }
}
export const LYRICS_WEIGHTS = {
  normal: { label: 'Regular', className: 'font-normal' },
  medium: { label: 'Medium', className: 'font-medium' },
  semibold: { label: 'Semibold', className: 'font-semibold' },
  bold: { label: 'Bold', className: 'font-bold' }
}

const PlayerContext = createContext(null)

// --- Settings persistence (guest = localStorage, signed-in = Firestore) ---
// Mirrors the pattern already used in LibraryContext/ProfileContext.
// Only "preference" settings live here — theme, shuffle/repeat, lyrics
// style. Sleep timer is deliberately NOT persisted: restoring a stale
// "30 min" setting on a brand new session would silently start a countdown
// the user never asked for this time around.
const SETTINGS_STORAGE_KEY = 'signaldeck.settings.v1'

const DEFAULT_SETTINGS = {
  theme: 'H.O.B', // NOTE: this doesn't match any THEMES key (keys are lowercase,
  // e.g. 'hob') — that's a pre-existing quirk from before this persistence
  // work, kept as-is so behavior doesn't silently change. It resolves to
  // the Emerald theme via the `THEMES[key] || THEMES.emerald` fallback in
  // changeTheme below. Flag if you'd rather it actually default to H.O.B.
  shuffle: false,
  repeatMode: 'off',
  lyricsFontFamily: 'sans',
  lyricsFontWeight: 'medium',
  lyricsFontSize: 18
}

function loadLocalSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY)
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
  } catch (e) {
    console.warn('Failed to load settings from storage', e)
  }
  return DEFAULT_SETTINGS
}

function saveLocalSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings))
  } catch (e) {
    console.warn('Failed to persist settings', e)
  }
}

export function PlayerProvider({ children }) {
  const { user } = useAuth()
  const audioRef = useRef(null)
  const [queue, setQueue] = useState([])
  const [queueIndex, setQueueIndex] = useState(-1)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.85)

  // --- Persisted settings state (seeded from localStorage so a guest's
  // last choices are already correct on first paint, before any Firestore
  // subscription has a chance to run) ---
  const initialSettings = useRef(loadLocalSettings()).current
  const [shuffle, setShuffle] = useState(initialSettings.shuffle)
  const [repeatMode, setRepeatMode] = useState(initialSettings.repeatMode) // off | all | one
  const [currentTheme, setCurrentTheme] = useState(initialSettings.theme)
  const [lyricsFontFamily, setLyricsFontFamily] = useState(initialSettings.lyricsFontFamily)
  const [lyricsFontWeight, setLyricsFontWeight] = useState(initialSettings.lyricsFontWeight)
  const [lyricsFontSize, setLyricsFontSize] = useState(initialSettings.lyricsFontSize)

  // Full Player & Visual Extensions State
  const [isFullPlayerOpen, setIsFullPlayerOpen] = useState(false)

  const [sleepTimerMinutes, setSleepTimerMinutes] = useState(0)
  const [sleepTimerRemaining, setSleepTimerRemaining] = useState(0)

  const currentTrack = queueIndex >= 0 ? queue[queueIndex] : null
  const [lyrics, setLyrics] = useState(null)
  const [lyricsLoading, setLyricsLoading] = useState(false)

  // Apply Theme CSS variables
  const changeTheme = useCallback((themeKey) => {
    const theme = THEMES[themeKey] || THEMES.emerald
    setCurrentTheme(themeKey)
    const root = document.documentElement
    Object.entries(theme.colors).forEach(([k, v]) => {
      root.style.setProperty(k, v)
    })
    // Derive Tailwind-consumable RGB triplets from the theme's hex colors —
    // this is what actually makes bg-signal / text-signal / bg-signal/15
    // etc. respond to theme changes app-wide, not just the components that
    // read --accent-main directly via getComputedStyle.
    root.style.setProperty('--accent-main-rgb', hexToRgbTriplet(theme.colors['--accent-main']))
    root.style.setProperty('--accent-secondary-rgb', hexToRgbTriplet(theme.colors['--accent-secondary']))
  }, [])

  useEffect(() => {
    changeTheme(currentTheme)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // only apply on mount / when currentTheme is set programmatically elsewhere via changeTheme itself

  // --- Settings sync: guest → localStorage, signed-in → Firestore ---
  // modeRef mirrors the LibraryContext/ProfileContext pattern so the
  // localStorage-write effect below doesn't fire while cloud-subscribed.
  const modeRef = useRef(user ? 'cloud' : 'guest')
  // Set to true right before we apply values that came FROM Firestore/local
  // storage, so the write-back effect below can tell "this change came from
  // a remote read" apart from "the user just touched a setting" and skip
  // writing it straight back (which would otherwise loop / thrash writes).
  const remoteApplyRef = useRef(false)
  const writeTimeoutRef = useRef(null)

  // Guards a real race that existed here before: this effect and the
  // write-back effect below are BOTH keyed on `user`, so switching accounts
  // fires them in the same pass. Without this flag, the write-back effect
  // would fire immediately on account switch — before Firestore has had a
  // chance to respond — and stamp whatever was on screen a moment ago (the
  // previous account's or guest's settings) straight into the new
  // account's doc, clobbering their real saved settings. Writes are now
  // blocked entirely until the first read for the CURRENT user completes.
  const settingsReadyRef = useRef(false)
  // Mirrors the live settings values outside React's render cycle, so the
  // "brand new account, seed the doc" branch below can read current values
  // without depending on a stale closure.
  const settingsRef = useRef({
    theme: currentTheme,
    shuffle,
    repeatMode,
    lyricsFontFamily,
    lyricsFontWeight,
    lyricsFontSize
  })
  useEffect(() => {
    settingsRef.current = {
      theme: currentTheme,
      shuffle,
      repeatMode,
      lyricsFontFamily,
      lyricsFontWeight,
      lyricsFontSize
    }
  }, [currentTheme, shuffle, repeatMode, lyricsFontFamily, lyricsFontWeight, lyricsFontSize])

  useEffect(() => {
    settingsReadyRef.current = false // block writes until this user's real data has loaded

    if (!user) {
      modeRef.current = 'guest'
      const s = loadLocalSettings()
      remoteApplyRef.current = true
      changeTheme(s.theme)
      setShuffle(s.shuffle)
      setRepeatMode(s.repeatMode)
      setLyricsFontFamily(s.lyricsFontFamily)
      setLyricsFontWeight(s.lyricsFontWeight)
      setLyricsFontSize(s.lyricsFontSize)
      settingsReadyRef.current = true // nothing async to wait for in guest mode
      return
    }

    modeRef.current = 'cloud'
    const userRef = doc(db, 'users', user.uid)

    const unsub = onSnapshot(
      userRef,
      (snap) => {
        const data = snap.data()
        if (data?.settings) {
          const s = data.settings
          remoteApplyRef.current = true
          if (s.theme) changeTheme(s.theme)
          if (typeof s.shuffle === 'boolean') setShuffle(s.shuffle)
          if (s.repeatMode) setRepeatMode(s.repeatMode)
          if (s.lyricsFontFamily) setLyricsFontFamily(s.lyricsFontFamily)
          if (s.lyricsFontWeight) setLyricsFontWeight(s.lyricsFontWeight)
          if (s.lyricsFontSize) setLyricsFontSize(s.lyricsFontSize)
        } else {
          // Brand new account, no settings doc yet — seed it directly here
          // (rather than relying on the write-back effect firing again)
          // using whatever's currently held in memory.
          setDoc(userRef, { settings: settingsRef.current }, { merge: true }).catch((e) => {
            console.warn('Failed to seed initial settings', e)
          })
        }
        settingsReadyRef.current = true // safe to allow writes for this user now
      },
      (err) => {
        console.warn('Settings listener error', err)
        settingsReadyRef.current = true // don't leave writes permanently blocked on error
      }
    )

    return unsub
  }, [user, changeTheme])

  // Write-back effect: fires on every settings change. Guest mode writes
  // to localStorage immediately; signed-in mode debounces writes to
  // Firestore (sliders like lyrics font size fire rapidly while dragging).
  useEffect(() => {
    if (remoteApplyRef.current) {
      remoteApplyRef.current = false
      if (writeTimeoutRef.current) clearTimeout(writeTimeoutRef.current)
      return
    }
    if (!settingsReadyRef.current) {
      // Still waiting on the initial read for the current user/guest —
      // never write during this window, or we risk overwriting real data
      // with stale leftovers from before the switch.
      return
    }

    const settings = {
      theme: currentTheme,
      shuffle,
      repeatMode,
      lyricsFontFamily,
      lyricsFontWeight,
      lyricsFontSize
    }

    if (modeRef.current === 'guest') {
      saveLocalSettings(settings)
      return
    }

    if (modeRef.current === 'cloud' && user) {
      if (writeTimeoutRef.current) clearTimeout(writeTimeoutRef.current)
      writeTimeoutRef.current = setTimeout(() => {
        setDoc(doc(db, 'users', user.uid), { settings }, { merge: true }).catch((e) => {
          console.warn('Failed to save settings to Firestore', e)
        })
      }, 500)
    }
  }, [currentTheme, shuffle, repeatMode, lyricsFontFamily, lyricsFontWeight, lyricsFontSize, user])

  useEffect(() => {
    return () => {
      if (writeTimeoutRef.current) clearTimeout(writeTimeoutRef.current)
    }
  }, [])

  // Audio setup
  useEffect(() => {
    const audio = new Audio()
    audio.volume = volume
    audioRef.current = audio
    const onTime = () => setProgress(audio.currentTime)
    const onLoaded = () => setDuration(audio.duration || 0)
    const onEnded = () => handleEndedRef.current?.()
    audio.addEventListener('timeupdate', onTime)
    audio.addEventListener('loadedmetadata', onLoaded)
    audio.addEventListener('ended', onEnded)
    return () => {
      audio.removeEventListener('timeupdate', onTime)
      audio.removeEventListener('loadedmetadata', onLoaded)
      audio.removeEventListener('ended', onEnded)
      audio.pause()
    }
  }, [])

  // Sleep Timer countdown
  useEffect(() => {
    if (sleepTimerMinutes <= 0) {
      setSleepTimerRemaining(0)
      return
    }
    setSleepTimerRemaining(sleepTimerMinutes * 60)
    const interval = setInterval(() => {
      setSleepTimerRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          if (audioRef.current) {
            audioRef.current.pause()
            setIsPlaying(false)
          }
          setSleepTimerMinutes(0)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [sleepTimerMinutes])

  // Auto-load lyrics from LRCLIB whenever the current track changes, so both
  // the Now Playing preview and the dedicated Lyrics page read the same
  // already-fetched data instead of each re-fetching independently.
  useEffect(() => {
    if (!currentTrack) {
      setLyrics(null)
      return
    }
    let isMounted = true
    setLyricsLoading(true)
    setLyrics(null)
    const trackName = stripHtml(currentTrack.title || currentTrack.name || '')
    const artistName = artistNames(currentTrack)
    const albumName = currentTrack.album?.name ? stripHtml(currentTrack.album.name) : undefined
    getLyrics({
      trackName,
      artistName,
      albumName,
      durationSeconds: currentTrack.duration
    })
      .then((res) => { if (isMounted) setLyrics(res) })
      .catch(() => { if (isMounted) setLyrics(null) })
      .finally(() => { if (isMounted) setLyricsLoading(false) })
    return () => { isMounted = false }
  }, [currentTrack?.id])

  const handleEndedRef = useRef(null)

  const loadAndPlay = useCallback(async (track) => {
    let playable = track
    let url = bestAudioUrl(track.downloadUrl)
    if (!url) {
      // Search/list results often omit downloadUrl — fetch the full song record.
      try {
        const result = await getSongById(track.id)
        const full = Array.isArray(result) ? result[0] : result
        if (full) {
          playable = { ...track, ...full, image: track.image || full.image }
          url = bestAudioUrl(playable.downloadUrl)
          // Without this, `playable` (which has the real downloadUrl) only
          // ever gets used for `audio.src` below and is then discarded —
          // `currentTrack` in state stays the original sparse object
          // (e.g. from Search results), so anything reading currentTrack
          // afterward, like the Download button, never sees a downloadUrl.
          setQueue((prev) => prev.map((t) => (t.id === playable.id ? { ...t, ...playable } : t)))
        }
      } catch (e) {
        console.warn('Failed to fetch full song details for playback', e)
      }
    }
    if (!url) {
      console.warn('No playable audio URL found for track', track)
      return
    }
    const audio = audioRef.current
    audio.src = url
    audio.currentTime = 0
    setProgress(0)
    audio.play().then(() => {
      setIsPlaying(true)
    }).catch((e) => {
      console.warn('Playback failed', e)
      setIsPlaying(false)
    })
  }, [])

  const playQueue = useCallback((tracks, startIndex = 0) => {
    setQueue(tracks)
    setQueueIndex(startIndex)
    loadAndPlay(tracks[startIndex])
  }, [loadAndPlay])

  const playNow = useCallback((track, contextTracks = null) => {
    if (contextTracks) {
      const idx = contextTracks.findIndex((t) => t.id === track.id)
      playQueue(contextTracks, idx >= 0 ? idx : 0)
    } else {
      setQueue((prev) => {
        const exists = prev.some((t) => t.id === track.id)
        if (exists) {
          const idx = prev.findIndex((t) => t.id === track.id)
          setQueueIndex(idx)
          return prev
        }
        setQueueIndex(prev.length)
        return [...prev, track]
      })
      loadAndPlay(track)
    }
  }, [playQueue, loadAndPlay])

  const addToQueue = useCallback((track) => {
    setQueue((prev) => [...prev, track])
  }, [])

  const removeFromQueue = useCallback((index) => {
    setQueue((prev) => prev.filter((_, i) => i !== index))
    setQueueIndex((prev) => (index < prev ? prev - 1 : prev))
  }, [])

  const clearQueue = useCallback(() => {
    setQueue([])
    setQueueIndex(-1)
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
    }
    setIsPlaying(false)
  }, [])

  const togglePlay = useCallback(() => {
    const audio = audioRef.current
    if (!audio.src) return
    if (isPlaying) {
      audio.pause()
      setIsPlaying(false)
    } else {
      audio.play().then(() => setIsPlaying(true)).catch(() => {})
    }
  }, [isPlaying])

  const goNext = useCallback(() => {
    if (!queue.length) return
    if (repeatMode === 'one') {
      loadAndPlay(queue[queueIndex])
      return
    }
    let nextIndex
    if (shuffle) {
      nextIndex = Math.floor(Math.random() * queue.length)
    } else {
      nextIndex = queueIndex + 1
      if (nextIndex >= queue.length) {
        if (repeatMode === 'all') nextIndex = 0
        else {
          setIsPlaying(false)
          return
        }
      }
    }
    setQueueIndex(nextIndex)
    loadAndPlay(queue[nextIndex])
  }, [queue, queueIndex, repeatMode, shuffle, loadAndPlay])

  const goPrev = useCallback(() => {
    const audio = audioRef.current
    if (audio.currentTime > 3) {
      audio.currentTime = 0
      return
    }
    if (!queue.length) return
    const prevIndex = queueIndex - 1 < 0 ? (repeatMode === 'all' ? queue.length - 1 : 0) : queueIndex - 1
    setQueueIndex(prevIndex)
    loadAndPlay(queue[prevIndex])
  }, [queue, queueIndex, repeatMode, loadAndPlay])

  handleEndedRef.current = goNext

  const seek = useCallback((time) => {
    const audio = audioRef.current
    audio.currentTime = time
    setProgress(time)
  }, [])

  const changeVolume = useCallback((v) => {
    setVolume(v)
    audioRef.current.volume = v
  }, [])

  const playTrackFromList = useCallback((track, list) => {
    playNow(track, list)
  }, [playNow])

  return (
    <PlayerContext.Provider
      value={{
        audioRef,
        currentTrack,
        queue,
        queueIndex,
        isPlaying,
        progress,
        duration,
        volume,
        shuffle,
        repeatMode,
        isFullPlayerOpen,
        currentTheme,

        sleepTimerMinutes,
        sleepTimerRemaining,
        lyrics,
        lyricsLoading,
        lyricsFontFamily,
        lyricsFontWeight,
        lyricsFontSize,
        setIsFullPlayerOpen,
        setShuffle,
        setRepeatMode,
        setTheme: changeTheme,

        setSleepTimerMinutes,
        setLyricsFontFamily,
        setLyricsFontWeight,
        setLyricsFontSize,
        togglePlay,
        goNext,
        goPrev,
        seek,
        changeVolume,
        addToQueue,
        removeFromQueue,
        playNow: playTrackFromList,
        clearQueue,
        playQueue
      }}
    >
      {children}
    </PlayerContext.Provider>
  )
}

export function usePlayer() {
  const ctx = useContext(PlayerContext)
  if (!ctx) throw new Error('usePlayer must be used within PlayerProvider')
  return ctx
}
