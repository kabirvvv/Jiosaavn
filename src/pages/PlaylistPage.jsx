import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Play } from 'lucide-react'
import { getPlaylistById, bestImageUrl } from '../api/jiosaavn'
import { usePlayer } from '../context/PlayerContext'
import TrackRow from '../components/TrackRow'
import { stripHtml } from '../utils/format'

export default function PlaylistPage() {
  const { id } = useParams()
  const [playlist, setPlaylist] = useState(null)
  const [loading, setLoading] = useState(true)
  const { playQueue } = usePlayer()

  useEffect(() => {
    setLoading(true)
    getPlaylistById(id).then(setPlaylist).finally(() => setLoading(false))
  }, [id])

  if (loading) return <p className="text-sm text-muted px-1">Spinning up the reel…</p>
  if (!playlist) return <p className="text-sm text-signal px-1">Couldn't find that playlist.</p>

  const songs = playlist.songs || []
  const artwork = bestImageUrl(playlist.image)

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-6 mb-8 items-start">
        {artwork && <img src={artwork} alt="" className="w-40 h-40 rounded-lg object-cover border border-line flex-shrink-0" />}
        <div className="flex-1 min-w-0">
          <p className="text-eyebrow text-xs text-muted mb-2">Playlist</p>
          <h1 className="font-display text-3xl font-semibold mb-2">{stripHtml(playlist.name)}</h1>
          <p className="text-sm text-muted mb-4">{songs.length} tracks</p>
          {songs.length > 0 && (
            <button
              onClick={() => playQueue(songs, 0)}
              className="inline-flex items-center gap-2 bg-signal text-ink px-5 py-2 rounded-full text-sm font-medium hover:bg-signal2"
            >
              <Play size={14} fill="currentColor" /> Play Playlist
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col">
        {songs.map((song, i) => (
          <TrackRow key={song.id} song={song} index={i} contextTracks={songs} />
        ))}
      </div>
    </div>
  )
}
