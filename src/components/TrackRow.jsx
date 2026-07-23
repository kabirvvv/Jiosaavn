import { useState, useRef, useEffect } from 'react'
import { Play, Pause, Heart, Plus, ListPlus } from 'lucide-react'
import { usePlayer } from '../context/PlayerContext'
import { useLibrary } from '../context/LibraryContext'
import { bestImageUrl } from '../api/jiosaavn'
import { artistNames, stripHtml, formatTime } from '../utils/format'

export default function TrackRow({ song, index, contextTracks, dense = false }) {
  const { currentTrack, isPlaying, playNow, togglePlay, addToQueue } = usePlayer()
  const { isLiked, toggleLiked, library, addToPlaylist } = useLibrary()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  const isCurrent = currentTrack?.id === song.id
  const liked = isLiked(song.id)
  const title = stripHtml(song.title || song.name || '')
  const subtitle = artistNames(song)
  const artwork = bestImageUrl(song.image)

  useEffect(() => {
    function onClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const handlePlayClick = () => {
    if (isCurrent) togglePlay()
    else playNow(song, contextTracks)
  }

  return (
    <div
      className={`group flex items-center gap-3 px-2 rounded-md hover:bg-panel2/70 ${dense ? 'py-1.5' : 'py-2'}`}
    >
      <button
        onClick={handlePlayClick}
        className="relative flex-shrink-0 w-9 h-9 rounded overflow-hidden border border-line"
        aria-label={isCurrent && isPlaying ? 'Pause' : 'Play'}
      >
        {artwork && <img src={artwork} alt="" className="w-full h-full object-cover" />}
        <span
          className={`absolute inset-0 flex items-center justify-center bg-black/50 transition-opacity ${
            isCurrent ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}
        >
          {isCurrent && isPlaying ? (
            <Pause size={14} className="text-paper" fill="currentColor" />
          ) : (
            <Play size={14} className="text-paper ml-0.5" fill="currentColor" />
          )}
        </span>
      </button>

      <div className="min-w-0 flex-1">
        <p className={`truncate text-sm ${isCurrent ? 'text-signal' : 'text-paper'}`}>{title}</p>
        <p className="truncate text-xs text-muted">{subtitle}</p>
      </div>

      {song.duration && (
        <span className="text-xs text-muted font-mono hidden sm:inline">{formatTime(Number(song.duration))}</span>
      )}

      <button
        onClick={() => toggleLiked({ ...song, title, subtitle })}
        className={`flex-shrink-0 ${liked ? 'text-signal' : 'text-muted opacity-0 group-hover:opacity-100 hover:text-paper'}`}
        aria-label="Like"
      >
        <Heart size={15} fill={liked ? 'currentColor' : 'none'} />
      </button>

      <button
        onClick={() => addToQueue(song)}
        className="flex-shrink-0 text-muted opacity-0 group-hover:opacity-100 hover:text-paper"
        aria-label="Add to queue"
      >
        <ListPlus size={16} />
      </button>

      <div className="relative flex-shrink-0" ref={menuRef}>
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="text-muted opacity-0 group-hover:opacity-100 hover:text-paper"
          aria-label="Add to playlist"
        >
          <Plus size={16} />
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-6 z-20 w-44 bg-panel2 border border-line rounded-md shadow-deck py-1">
            <p className="text-eyebrow text-[10px] text-muted px-3 py-1">Add to reel</p>
            {library.playlists.length === 0 && (
              <p className="text-xs text-muted px-3 py-2">No reels yet</p>
            )}
            {library.playlists.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  addToPlaylist(p.id, { ...song, title, subtitle })
                  setMenuOpen(false)
                }}
                className="w-full text-left px-3 py-1.5 text-sm hover:bg-panel truncate"
              >
                {p.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
