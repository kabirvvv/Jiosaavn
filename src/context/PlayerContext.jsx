import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import { bestAudioUrl } from '../api/jiosaavn'

const PlayerContext = createContext(null)

export function PlayerProvider({ children }) {
  const audioRef = useRef(null)
  const audioCtxRef = useRef(null)
  const analyserRef = useRef(null)
  const sourceRef = useRef(null)
  const sourceReadyRef = useRef(false)

  const [queue, setQueue] = useState([])
  const [queueIndex, setQueueIndex] = useState(-1)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.85)
  const [shuffle, setShuffle] = useState(false)
  const [repeatMode, setRepeatMode] = useState('off') // off | all | one
  const [analyserReady, setAnalyserReady] = useState(false)

  const currentTrack = queueIndex >= 0 ? queue[queueIndex] : null

  useEffect(() => {
    const audio = new Audio()
    audio.crossOrigin = 'anonymous'
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

  const handleEndedRef = useRef(null)

  const setupAnalyser = useCallback(() => {
    if (sourceReadyRef.current) return
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext
      if (!audioCtxRef.current) audioCtxRef.current = new AudioCtx()
      const ctx = audioCtxRef.current
      const source = ctx.createMediaElementSource(audioRef.current)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 128
      source.connect(analyser)
      analyser.connect(ctx.destination)
      analyserRef.current = analyser
      sourceRef.current = source
      sourceReadyRef.current = true
      setAnalyserReady(true)
    } catch (e) {
      // Some CDN responses don't send permissive CORS headers — playback
      // still works, we just fall back to an ambient idle visualization.
      console.warn('Analyser unavailable, falling back to ambient visual', e)
      setAnalyserReady(false)
    }
  }, [])

  const loadAndPlay = useCallback((track) => {
    const url = bestAudioUrl(track.downloadUrl)
    if (!url) return
    const audio = audioRef.current
    audio.src = url
    audio.currentTime = 0
    setProgress(0)
    audio.play().then(() => {
      setIsPlaying(true)
      const ctx = audioCtxRef.current
      if (ctx && ctx.state === 'suspended') ctx.resume()
      setupAnalyser()
    }).catch((e) => {
      console.warn('Playback failed', e)
      setIsPlaying(false)
    })
  }, [setupAnalyser])

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

  const togglePlay = useCallback(() => {
    const audio = audioRef.current
    if (!audio.src) return
    if (isPlaying) {
      audio.pause()
      setIsPlaying(false)
    } else {
      audio.play().then(() => setIsPlaying(true)).catch(() => {})
      const ctx = audioCtxRef.current
      if (ctx && ctx.state === 'suspended') ctx.resume()
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
        currentTrack,
        queue,
        queueIndex,
        isPlaying,
        progress,
        duration,
        volume,
        shuffle,
        repeatMode,
        analyserNode: analyserRef.current,
        analyserReady,
        setShuffle,
        setRepeatMode,
        togglePlay,
        goNext,
        goPrev,
        seek,
        changeVolume,
        addToQueue,
        removeFromQueue,
        playNow: playTrackFromList,
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
