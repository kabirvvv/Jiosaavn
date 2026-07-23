import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart, Plus, Play, Trash2, Pencil } from 'lucide-react'
import { useLibrary } from '../context/LibraryContext'
import { usePlayer } from '../context/PlayerContext'
import TrackRow from '../components/TrackRow'

export default function LibraryPage() {
  const { library, createPlaylist, deletePlaylist, renamePlaylist } = useLibrary()
  const { playQueue } = usePlayer()
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [activePlaylist, setActivePlaylist] = useState(null)

  const submitCreate = (e) => {
    e.preventDefault()
    if (name.trim()) createPlaylist(name.trim())
    setName('')
    setCreating(false)
  }

  const openPlaylist = library.playlists.find((p) => p.id === activePlaylist)

  if (openPlaylist) {
    return (
      <div>
        <button onClick={() => setActivePlaylist(null)} className="text-sm text-muted hover:text-paper mb-6">
          ← Back to library
        </button>
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-eyebrow text-xs text-muted mb-2">Reel</p>
            <h1 className="font-display text-3xl font-semibold">{openPlaylist.name}</h1>
            <p className="text-sm text-muted mt-1">{openPlaylist.songs.length} tracks</p>
          </div>
          <div className="flex items-center gap-3">
            {openPlaylist.songs.length > 0 && (
              <button
                onClick={() => playQueue(openPlaylist.songs, 0)}
                className="inline-flex items-center gap-2 bg-signal text-ink px-4 py-2 rounded-full text-sm font-medium hover:bg-signal2"
              >
                <Play size={14} fill="currentColor" /> Play
              </button>
            )}
            <button
              onClick={() => {
                const next = prompt('Rename reel', openPlaylist.name)
                if (next) renamePlaylist(openPlaylist.id, next)
              }}
              className="text-muted hover:text-paper"
              aria-label="Rename"
            >
              <Pencil size={16} />
            </button>
            <button
              onClick={() => {
                if (confirm(`Delete "${openPlaylist.name}"?`)) {
                  deletePlaylist(openPlaylist.id)
                  setActivePlaylist(null)
                }
              }}
              className="text-muted hover:text-signal"
              aria-label="Delete"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
        {openPlaylist.songs.length === 0 ? (
          <p className="text-sm text-muted">No tracks yet — add songs via the "+" button on any track.</p>
        ) : (
          <div className="flex flex-col">
            {openPlaylist.songs.map((song, i) => (
              <TrackRow key={song.id} song={song} index={i} contextTracks={openPlaylist.songs} />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-eyebrow text-xs text-muted">Liked Songs</h2>
          {library.likedSongs.length > 0 && (
            <button
              onClick={() => playQueue(library.likedSongs, 0)}
              className="text-xs text-signal hover:text-signal2 flex items-center gap-1"
            >
              <Play size={12} fill="currentColor" /> Play all
            </button>
          )}
        </div>
        {library.likedSongs.length === 0 ? (
          <p className="text-sm text-muted flex items-center gap-2">
            <Heart size={14} /> Tracks you like will collect here.
          </p>
        ) : (
          <div className="flex flex-col">
            {library.likedSongs.map((song, i) => (
              <TrackRow key={song.id} song={song} index={i} contextTracks={library.likedSongs} />
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-eyebrow text-xs text-muted">Your Reels</h2>
          <button
            onClick={() => setCreating(true)}
            className="text-xs text-signal hover:text-signal2 flex items-center gap-1"
          >
            <Plus size={14} /> New reel
          </button>
        </div>

        {creating && (
          <form onSubmit={submitCreate} className="flex gap-2 mb-4">
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Reel name"
              className="bg-panel border border-line rounded-md px-3 py-1.5 text-sm outline-none focus:border-signal flex-1 max-w-xs"
            />
            <button type="submit" className="text-xs bg-signal text-ink px-3 py-1.5 rounded-md font-medium">Create</button>
            <button type="button" onClick={() => setCreating(false)} className="text-xs text-muted px-2">Cancel</button>
          </form>
        )}

        {library.playlists.length === 0 ? (
          <p className="text-sm text-muted">Create a reel to start organizing tracks into playlists.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {library.playlists.map((p) => (
              <button
                key={p.id}
                onClick={() => setActivePlaylist(p.id)}
                className="text-left group"
              >
                <div className="w-full aspect-square rounded-lg bg-panel2 border border-line flex items-center justify-center overflow-hidden">
                  {p.songs.length > 0 ? (
                    <div className="grid grid-cols-2 w-full h-full">
                      {p.songs.slice(0, 4).map((s, i) => (
                        <img key={i} src={s.image?.[s.image.length - 1]?.url} alt="" className="w-full h-full object-cover" />
                      ))}
                    </div>
                  ) : (
                    <span className="text-2xl text-muted/40">♪</span>
                  )}
                </div>
                <p className="mt-2 text-sm truncate group-hover:text-signal">{p.name}</p>
                <p className="text-xs text-muted">{p.songs.length} tracks</p>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
