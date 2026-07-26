import { useEffect, useState, useCallback } from 'react'
import { Play, Pause, Sparkles } from 'lucide-react'
import { searchSongs, getSongSuggestions, bestImageUrl } from '../api/jiosaavn'
import { useProfile } from '../context/ProfileContext'
import { usePlayer } from '../context/PlayerContext'
import { artistNames, stripHtml } from '../utils/format'

const TARGET_COUNT = 12
const MAX_CALLS = 6
const SEEDS_PER_ROUND = 4

export default function QuickPicks() {
  const { profile } = useProfile()
  const { currentTrack, isPlaying, togglePlay, playNow } = usePlayer()
  const [tracks, setTracks] = useState([])
  const [loading, setLoading] = useState(true)
  const [ready, setReady] = useState(false)

  const buildQuickPicks = useCallback(async (favSongs) => {
    setLoading(true)

    const queries = (favSongs || []).filter(Boolean).slice(0, 4)
    if (queries.length === 0) {
      setTracks([])
      setLoading(false)
      setReady(true)
      return
    }

    const resolved = await Promise.allSettled(
      queries.map((q) => searchSongs(q, 0, 1))
    )
    const seedIds = []
    resolved.forEach((r) => {
      if (r.status === 'fulfilled') {
        const track = r.value?.results?.[0]
        if (track?.id) seedIds.push(track.id)
      }
    })

    if (seedIds.length === 0) {
      setTracks([])
      setLoading(false)
      setReady(true)
      return
    }

    const seen = new Map()
    const usedSeeds = new Set()
    let callCount = 0

    async function fetchSuggestionsFor(id) {
      callCount += 1
      try {
        const res = await getSongSuggestions(id)
        return Array.isArray(res) ? res : []
      } catch (e) {
        console.warn('Failed to fetch quick-pick suggestions for seed', id, e)
        return []
      }
    }

    const initialBatches = await Promise.all(
      seedIds.map((id) => {
        usedSeeds.add(id)
        return callCount < MAX_CALLS ? fetchSuggestionsFor(id) : Promise.resolve([])
      })
    )
    initialBatches.forEach((batch) => {
      batch.forEach((t) => {
        if (t?.id && !seedIds.includes(t.id) && !seen.has(t.id)) seen.set(t.id, t)
      })
    })
    setTracks(Array.from(seen.values()).slice(0, TARGET_COUNT))
    setReady(true)

    while (seen.size < TARGET_COUNT && callCount < MAX_CALLS) {
      const nextSeeds = Array.from(seen.values())
        .filter((t) => !usedSeeds.has(t.id))
        .slice(0, SEEDS_PER_ROUND)
      if (nextSeeds.length === 0) break

      nextSeeds.forEach((t) => usedSeeds.add(t.id))
      const results = await Promise.all(
        nextSeeds.map((t) => (callCount < MAX_CALLS ? fetchSuggestionsFor(t.id) : Promise.resolve([])))
      )
      let addedAny = false
      results.forEach((list) => {
        list.forEach((t) => {
          if (t?.id && !seedIds.includes(t.id) && !seen.has(t.id)) {
            seen.set(t.id, t)
            addedAny = true
          }
        })
      })
      setTracks(Array.from(seen.values()).slice(0, TARGET_COUNT))
      if (!addedAny) break
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    if (profile?.exists && profile.favSongs?.length) {
      buildQuickPicks(profile.favSongs)
    } else {
      setTracks([])
      setLoading(false)
      setReady(true)
    }
  }, [profile?.exists, profile?.favSongs, buildQuickPicks])

  if (!ready && loading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <Sparkles className="text-signal" size={18} />
          <h2 className="text-sm font-display font-bold text-paper uppercase tracking-wide">Your Fav</h2>
        </div>
        <div className="overflow-x-auto no-scrollbar">
          <div className="grid grid-flow-col grid-rows-3 auto-cols-[10rem] gap-4 w-max">
            {Array.from({ length: TARGET_COUNT }).map((_, i) => (
              <div key={i} className="aspect-square rounded-xl bg-panel animate-pulse border border-line/30" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (tracks.length === 0) return null

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-1">
        <Sparkles className="text-signal" size={18} />
        <h2 className="text-sm font-display font-bold text-paper uppercase tracking-wide">Your Fav</h2>
      </div>
      <div className="overflow-x-auto no-scrollbar">
        <div className="grid grid-flow-col grid-rows-3 auto-cols-[10rem] gap-4 w-max">
          {tracks.map((track) => {
            const isCurrent = currentTrack?.id === track.id
            const isCurrentlyPlaying = isCurrent && isPlaying
            const art = bestImageUrl(track.image)
            const title = stripHtml(track.title || track.name || '')
            const artists = artistNames(track)
            return (
              <div
                key={track.id}
                className="group rounded-xl border border-line/30 bg-panel/40 p-3 hover:border-signal hover:bg-panel/70 transition-all"
              >
                <div
                  onClick={() => (isCurrentlyPlaying ? togglePlay() : playNow(track, tracks))}
                  className="relative w-full aspect-square rounded-lg overflow-hidden mb-2.5 border border-line/20 cursor-pointer"
                >
                  {art && <img src={art} alt="" className="w-full h-full object-cover" />}
                  <div className="absolute inset-0 bg-chassis/0 group-hover:bg-chassis/30 transition-all flex items-center justify-center">
                    <div
                      className={`w-10 h-10 rounded-full bg-signal/90 text-ink flex items-center justify-center scale-90 group-hover:scale-100 transition-all ${
                        isCurrentlyPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      }`}
                    >
                      {isCurrentlyPlaying ? (
                        <Pause size={16} fill="currentColor" />
                      ) : (
                        <Play size={16} fill="currentColor" className="ml-0.5" />
                      )}
                    </div>
                  </div>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-paper group-hover:text-signal truncate">{title}</p>
                  <p className="text-xs text-muted truncate">{artists}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
