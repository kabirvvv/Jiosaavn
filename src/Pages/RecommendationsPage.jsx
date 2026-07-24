import { useEffect, useState, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronDown, Music, Play, Plus, ListMusic, Loader2 } from 'lucide-react'
import { usePlayer } from '../context/PlayerContext'
import { bestImageUrl, getSongSuggestions } from '../api/jiosaavn'
import { artistNames, stripHtml } from '../utils/format'

// How many songs we want on the page before we stop chaining further calls,
// and a hard cap on total suggestion calls fired so we don't hammer the API
// if the catalog is small and results keep overlapping.
const TARGET_COUNT = 30
const MAX_CALLS = 8
// How many freshly-discovered songs we use as new seeds each round.
const SEEDS_PER_ROUND = 5

export default function RecommendationsPage() {
  const navigate = useNavigate()
  const { trackId } = useParams()
  const { playNow, addToQueue, queue } = usePlayer()
  const [tracks, setTracks] = useState([])
  const [loading, setLoading] = useState(true)
  const [queuedAll, setQueuedAll] = useState(false)

  const fillRecommendations = useCallback(async (seedId) => {
    setLoading(true)
    setTracks([])
    // The /songs/{id}/suggestions endpoint has no page/offset param — only
    // limit — so calling it twice with the same id just returns the same
    // list again. The only way to get more variety is to take songs *from*
    // one suggestions call and fire suggestions calls for *those* too,
    // merging and deduping as we go.
    const seen = new Map() // id -> track
    const usedSeeds = new Set([seedId])
    let callCount = 0

    async function fetchSuggestionsFor(id) {
      callCount += 1
      try {
        const res = await getSongSuggestions(id)
        return Array.isArray(res) ? res : []
      } catch (e) {
        console.warn('Failed to fetch suggestions for seed', id, e)
        return []
      }
    }

    let batch = await fetchSuggestionsFor(seedId)
    batch.forEach((t) => {
      if (t?.id && t.id !== seedId && !seen.has(t.id)) seen.set(t.id, t)
    })

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
          if (t?.id && t.id !== seedId && !seen.has(t.id)) {
            seen.set(t.id, t)
            addedAny = true
          }
        })
      })
      // Live-fill the page as rounds complete instead of waiting for the
      // whole thing, so it doesn't feel like a long blank loading state.
      setTracks(Array.from(seen.values()))
      if (!addedAny) break
    }

    setTracks(Array.from(seen.values()))
    setLoading(false)
  }, [])

  useEffect(() => {
    if (trackId) fillRecommendations(trackId)
  }, [trackId, fillRecommendations])

  const isQueued = (id) => queue.some((t) => t.id === id)

  const handleQueueAll = () => {
    tracks.forEach((t) => {
      if (!isQueued(t.id)) addToQueue(t)
    })
    setQueuedAll(true)
  }

  return (
    <div className="min-h-screen w-full bg-chassis text-paper relative overflow-y-auto">
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-chassis/90 via-chassis/95 to-chassis" />

      <header className="sticky top-0 z-20 flex items-center justify-between px-6 py-5 border-b border-line/40 bg-chassis/60 backdrop-blur-md">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-full border border-line bg-panel/60 hover:bg-panel hover:scale-105 transition-all"
          aria-label="Back"
        >
          <ChevronDown size={22} className="rotate-90" />
        </button>
        <span className="text-xs font-mono text-muted uppercase tracking-wider">Recommendations</span>
        <div className="w-9" />
      </header>

      <div className="relative z-10 max-w-4xl mx-auto w-full p-6 space-y-6 pb-24">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-display font-bold text-paper">Similar Songs</h2>
            <p className="text-xs text-muted font-mono">
              {loading ? 'Finding more tracks…' : `${tracks.length} tracks found`}
            </p>
          </div>
          <button
            onClick={handleQueueAll}
            disabled={!tracks.length}
            className={`px-4 py-2 rounded-xl border text-sm font-semibold flex items-center gap-2 transition-all shrink-0 ${
              queuedAll
                ? 'bg-signal/15 border-signal text-signal'
                : 'bg-signal border-signal text-ink hover:bg-signal2 disabled:opacity-40 disabled:cursor-not-allowed'
            }`}
          >
            <ListMusic size={16} />
            <span>{queuedAll ? 'Queued' : 'Queue All'}</span>
          </button>
        </div>

        {loading && tracks.length === 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-square rounded-xl bg-panel animate-pulse border border-line/30" />
            ))}
          </div>
        ) : tracks.length === 0 ? (
          <div className="text-center py-24 text-muted">
            <Music size={36} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm">No recommendations found for this track.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {tracks.map((track) => {
              const art = bestImageUrl(track.image)
              const trTitle = stripHtml(track.title || track.name || '')
              const trArtist = artistNames(track)
              const queued = isQueued(track.id)
              return (
                <div
                  key={track.id}
                  className="group rounded-xl border border-line/30 bg-panel/40 p-3 hover:border-signal hover:bg-panel/70 transition-all"
                >
                  <div
                    onClick={() => playNow(track, tracks)}
                    className="relative w-full aspect-square rounded-lg overflow-hidden mb-2.5 border border-line/20 cursor-pointer"
                  >
                    {art && <img src={art} alt="" className="w-full h-full object-cover" />}
                    <div className="absolute inset-0 bg-chassis/0 group-hover:bg-chassis/30 transition-all flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-signal/90 text-ink flex items-center justify-center opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100 transition-all">
                        <Play size={16} fill="currentColor" className="ml-0.5" />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-paper group-hover:text-signal truncate">{trTitle}</p>
                      <p className="text-xs text-muted truncate">{trArtist}</p>
                    </div>
                    <button
                      onClick={() => !queued && addToQueue(track)}
                      disabled={queued}
                      className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all ${
                        queued
                          ? 'bg-signal/15 text-signal'
                          : 'bg-panel border border-line/40 text-muted hover:text-signal hover:border-signal'
                      }`}
                      aria-label={queued ? 'Already in queue' : 'Add to queue'}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              )
            })}
            {loading && (
              <div className="col-span-2 sm:col-span-3 md:col-span-4 flex items-center justify-center gap-2 text-muted text-xs py-4">
                <Loader2 size={14} className="animate-spin" />
                <span>Finding more tracks…</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
