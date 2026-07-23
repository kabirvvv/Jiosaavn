import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Play } from 'lucide-react'
import { searchAll } from '../api/jiosaavn'
import { usePlayer } from '../context/PlayerContext'
import TrackRow from '../components/TrackRow'
import Shelf from '../components/Shelf'
import ShelfCard from '../components/ShelfCard'
import { artistNames, stripHtml } from '../utils/format'

const TABS = ['All', 'Songs', 'Albums', 'Artists', 'Playlists']

export default function SearchPage() {
  const [params] = useSearchParams()
  const query = params.get('q') || ''
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [tab, setTab] = useState('All')
  const { playNow } = usePlayer()

  useEffect(() => {
    if (!query) {
      setData(null)
      return
    }
    setLoading(true)
    setError(null)
    searchAll(query)
      .then(setData)
      .catch(() => setError('The deck lost signal on that search — try again.'))
      .finally(() => setLoading(false))
  }, [query])

  if (!query) return <EmptyState />
  if (loading) return <LoadingState />
  if (error) return <p className="text-sm text-signal px-1">{error}</p>
  if (!data) return null

  const songs = data.songs?.results || []
  const albums = data.albums?.results || []
  const artists = data.artists?.results || []
  const playlists = data.playlists?.results || []
  const topHit = data.topQuery?.results?.[0]

  const noResults = !songs.length && !albums.length && !artists.length && !playlists.length

  return (
    <div>
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3.5 py-1.5 rounded-full text-sm flex-shrink-0 border transition-colors ${
              tab === t ? 'bg-signal text-ink border-signal' : 'border-line text-muted hover:text-paper'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {noResults && (
        <p className="text-sm text-muted">No signal found for "{query}". Try a different spelling or artist name.</p>
      )}

      {topHit && (tab === 'All') && (
        <section className="mb-8">
          <h2 className="text-eyebrow text-xs text-muted mb-3 px-1">Top Hit</h2>
          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => playNow(topHit, songs.length ? songs : [topHit])}
            className="group flex items-center gap-4 bg-panel border border-line rounded-xl p-4 w-full max-w-md text-left hover:border-signal/60 transition-colors"
          >
            {topHit.image && (
              <img src={topHit.image[topHit.image.length - 1]?.url} alt="" className="w-16 h-16 rounded-lg object-cover" />
            )}
            <div className="min-w-0 flex-1">
              <p className="font-display font-semibold text-base truncate">{stripHtml(topHit.title)}</p>
              <p className="text-xs text-muted truncate">{artistNames(topHit)} · {topHit.type}</p>
            </div>
            <span className="w-9 h-9 rounded-full bg-signal text-ink flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
              <Play size={14} fill="currentColor" className="ml-0.5" />
            </span>
          </motion.button>
        </section>
      )}

      {(tab === 'All' || tab === 'Songs') && songs.length > 0 && (
        <section className="mb-8">
          <h2 className="text-eyebrow text-xs text-muted mb-3 px-1">Songs</h2>
          <div className="flex flex-col">
            {(tab === 'All' ? songs.slice(0, 6) : songs).map((song, i) => (
              <TrackRow key={song.id} song={song} index={i} contextTracks={songs} />
            ))}
          </div>
        </section>
      )}

      {(tab === 'All' || tab === 'Albums') && albums.length > 0 && (
        <Shelf title="Albums">
          {albums.map((a) => <ShelfCard key={a.id} item={a} kind="album" />)}
        </Shelf>
      )}

      {(tab === 'All' || tab === 'Artists') && artists.length > 0 && (
        <Shelf title="Artists">
          {artists.map((a) => <ShelfCard key={a.id} item={a} kind="artist" />)}
        </Shelf>
      )}

      {(tab === 'All' || tab === 'Playlists') && playlists.length > 0 && (
        <Shelf title="Playlists">
          {playlists.map((p) => <ShelfCard key={p.id} item={p} kind="playlist" />)}
        </Shelf>
      )}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-24 px-6">
      <p className="text-eyebrow text-xs text-signal mb-3">Signal Deck</p>
      <h1 className="font-display text-3xl sm:text-4xl font-semibold mb-3 max-w-md">
        Cue up something to listen to.
      </h1>
      <p className="text-muted text-sm max-w-sm">
        Search any track, album, artist, or playlist from JioSaavn's full catalog above.
      </p>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="flex flex-col gap-3 animate-pulse px-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="w-9 h-9 rounded bg-panel2" />
          <div className="flex-1">
            <div className="h-3 w-1/3 bg-panel2 rounded mb-2" />
            <div className="h-2 w-1/4 bg-panel2 rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}
