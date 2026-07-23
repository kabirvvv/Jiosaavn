import { Link } from 'react-router-dom'
import { Play } from 'lucide-react'
import { bestImageUrl } from '../api/jiosaavn'
import { stripHtml } from '../utils/format'

export default function ShelfCard({ item, kind }) {
  const title = stripHtml(item.title || item.name || '')
  const artwork = bestImageUrl(item.image)
  const isArtist = kind === 'artist'

  const to =
    kind === 'album' ? `/album/${item.id}` :
    kind === 'artist' ? `/artist/${item.id}` :
    kind === 'playlist' ? `/playlist/${item.id}` : '#'

  const subtitle =
    kind === 'album' ? stripHtml(item.artist || item.subtitle || item.year || '') :
    kind === 'artist' ? 'Artist' :
    kind === 'playlist' ? stripHtml(item.subtitle || item.language || 'Playlist') : ''

  return (
    <Link to={to} className="group flex-shrink-0 w-36 sm:w-40">
      <div className={`relative w-36 h-36 sm:w-40 sm:h-40 overflow-hidden border border-line bg-panel2 ${isArtist ? 'rounded-full' : 'rounded-lg'}`}>
        {artwork && (
          <img
            src={artwork}
            alt=""
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        )}
        {!isArtist && (
          <span className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
            <span className="w-9 h-9 rounded-full bg-signal flex items-center justify-center shadow-knob">
              <Play size={14} className="text-ink ml-0.5" fill="currentColor" />
            </span>
          </span>
        )}
      </div>
      <p className="mt-2 text-sm text-paper truncate">{title}</p>
      <p className="text-xs text-muted truncate">{subtitle}</p>
    </Link>
  )
}
