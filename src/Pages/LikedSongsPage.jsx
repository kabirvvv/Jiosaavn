import { Link } from 'react-router-dom'
import { ChevronLeft, Play } from 'lucide-react'
import { useLibrary } from '../context/LibraryContext'
import { usePlayer } from '../context/PlayerContext'
import TrackRow from '../components/TrackRow'

export default function LikedSongsPage() {
  const { library } = useLibrary()
  const { playQueue } = usePlayer()

  return (
    <div>
      <Link to="/library" className="inline-flex items-center gap-1 text-sm text-muted hover:text-paper mb-6">
        <ChevronLeft size={16} /> Back to library
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-eyebrow text-xs text-muted mb-2">Collection</p>
          <h1 className="font-display text-3xl font-semibold">Liked Songs</h1>
          <p className="text-sm text-muted mt-1">{library.likedSongs.length} tracks</p>
        </div>
        {library.likedSongs.length > 0 && (
          <button
            onClick={() => playQueue(library.likedSongs, 0)}
            className="inline-flex items-center gap-2 bg-signal text-ink px-4 py-2 rounded-full text-sm font-medium hover:bg-signal2"
          >
            <Play size={14} fill="currentColor" /> Play
          </button>
        )}
      </div>

      {library.likedSongs.length === 0 ? (
        <p className="text-sm text-muted">Tracks you like will collect here.</p>
      ) : (
        <div className="flex flex-col">
          {library.likedSongs.map((song, i) => (
            <TrackRow key={song.id} song={song} index={i} contextTracks={library.likedSongs} />
          ))}
        </div>
      )}
    </div>
  )
            }
