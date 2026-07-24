import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Search, ListMusic } from 'lucide-react'

export default function TopBar({ onOpenQueue }) {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [value, setValue] = useState(params.get('q') || '')

  const submit = (e) => {
    e.preventDefault()
    if (value.trim()) navigate(`/search?q=${encodeURIComponent(value.trim())}`)
  }

  return (
    <div className="sticky top-0 z-20 bg-ink/90 backdrop-blur border-b border-line">
      <div className="flex items-center gap-3 px-4 sm:px-6 py-3">
        <form onSubmit={submit} className="flex-1 max-w-xl">
          <div className="flex items-center gap-2 bg-panel border border-line rounded-full px-4 py-2 focus-within:border-signal transition-colors">
            <Search size={16} className="text-muted flex-shrink-0" />
            <input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Search tracks, albums, artists, playlists"
              className="bg-transparent outline-none text-sm flex-1 placeholder:text-muted"
            />
          </div>
        </form>
        <button
          onClick={onOpenQueue}
          className="md:hidden text-muted hover:text-paper flex-shrink-0"
          aria-label="Open queue"
        >
          <ListMusic size={20} />
        </button>
      </div>
    </div>
  )
}
