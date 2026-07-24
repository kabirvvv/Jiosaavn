import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
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
const PlayerContext = createContext(null)
export function PlayerProvider({ children }) {
  const audioRef = useRef(null)
  const [queue, setQueue] = useState([])
  const [queueIndex, setQueueIndex] = useState(-1)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.85)
  const [shuffle, setShuffle] = useState(false)
  const [repeatMode, setRepeatMode] = useState('off') // off | all | one
  // Full Player & Visual Extensions State
  const [isFullPlayerOpen, setIsFullPlayerOpen] = useState(false)
  const [currentTheme, setCurrentTheme] = useState('emerald')
  const [eq, setEq] = useState({ low: 0, mid: 0, high: 0 })
  const [eqPreset, setEqPreset] = useState('flat')
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
  }, [currentTheme, changeTheme])
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
  const applyEqPreset = useCallback((name) => {
    setEqPreset(name)
    switch (name) {
      case 'bass':
        setEq({ low: 6, mid: 0, high: -2 })
        break
      case 'pop':
        setEq({ low: 2, mid: 4, high: 3 })
        break
      case 'chill':
        setEq({ low: 3, mid: 1, high: -1 })
        break
      case 'flat':
      default:
        setEq({ low: 0, mid: 0, high: 0 })
        break
    }
  }, [])
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
        eq,
        eqPreset,
        sleepTimerMinutes,
        sleepTimerRemaining,
        lyrics,
        lyricsLoading,
        setIsFullPlayerOpen,
        setShuffle,
        setRepeatMode,
        setTheme: changeTheme,
        setEq,
        applyEqPreset,
        setSleepTimerMinutes,
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
