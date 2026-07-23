import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Play } from 'lucide-react'
import { getArtistById, bestImageUrl } from '../api/jiosaavn'
import { usePlayer } from '../context/PlayerContext'
import TrackRow from '../components/TrackRow'
import Shelf from '../components/Shelf'
import ShelfCard from '../components/ShelfCard'
import { stripHtml } from '../utils/format'

export default function ArtistPage() {
  const { id } = useParams()
  const [artist, setArtist] = useState(null)
  const [loading, setLoading] = useState(true)
  const { playQueue } = usePlayer()

  useEffect(() => {
    setLoading(true)
    getArtistById(id).then(setArtist).finally(() => setLoading(false))
  }, [id])

  if (loading) return <p className="text-sm text-muted px-1">Tuning in…</p>
  if (!artist) return <p className="text-sm text-signal px-1">Couldn't find that artist.</p>

  const songs = artist.topSongs || []
  const albums = artist.topAlbums || []
  const artwork = bestImageUrl(artist.image)

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-6 mb-8 items-start">
        {artwork && <img src={artwork} alt="" className="w-40 h-40 rounded-full object-cover border border-line flex-shrink-0" />}
        <div className="flex-1 min-w-0">
          <p className="text-eyebrow text-xs text-muted mb-2">Artist</p>
          <h1 className="font-display text-3xl font-semibold mb-2">{stripHtml(artist.name)}</h1>
          {artist.followerCount && (
            <p className="text-sm text-muted mb-4">{Number(artist.followerCount).toLocaleString()} followers</p>
          )}
          {songs.length > 0 && (
            <button
              onClick={() => playQueue(songs, 0)}
              className="inline-flex items-center gap-2 bg-signal text-ink px-5 py-2 rounded-full text-sm font-medium hover:bg-signal2"
            >
              <Play size={14} fill="currentColor" /> Play Top Songs
            </button>
          )}
        </div>
      </div>

      {songs.length > 0 && (
        <section className="mb-8">
          <h2 className="text-eyebrow text-xs text-muted mb-3 px-1">Top Songs</h2>
          <div className="flex flex-col">
            {songs.slice(0, 10).map((song, i) => (
              <TrackRow key={song.id} song={song} index={i} contextTracks={songs} />
            ))}
          </div>
        </section>
      )}

      {albums.length > 0 && (
        <Shelf title="Albums">
          {albums.map((a) => <ShelfCard key={a.id} item={a} kind="album" />)}
        </Shelf>
      )}
    </div>
  )
}
