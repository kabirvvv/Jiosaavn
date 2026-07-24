import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { Search, ListMusic } from 'lucide-react'

const DEBOUNCE_MS = 400

export default function TopBar({ onOpenQueue }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [params] = useSearchParams()
  const [value, setValue] = useState(params.get('q') || '')
  const debounceRef = useRef(null)
  const isFirstRun = useRef(true)

  // Keep the input in sync if the URL's ?q= changes from elsewhere (e.g.
  // clicking a "View All" link on the homepage that sets its own query).
  useEffect(() => {
    setValue(params.get('q') || '')
  }, [params])

  // Live search-as-you-type: debounce keystrokes, then navigate to /search
  // with the query. Uses { replace: true } so every keystroke doesn't push
  // a new history entry — back/forward stays clean, one step per "session"
  // of typing rather than per character.
  useEffect(() => {
    // Skip firing on mount so we don't immediately re-navigate on page load
    // just because the input was initialized from the current ?q=.
    if (isFirstRun.current) {
      isFirstRun.current = false
      return
    }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    const trimmed = value.trim()
    debounceRef.current = setTimeout(() => {
      if (trimmed) {
        navigate(`/search?q=${encodeURIComponent(trimmed)}`, { replace: true })
      } else if (location.pathname === '/search') {
        // Clearing the box while on the search page drops back to its
        // empty state, rather than leaving a stale query in the URL.
        navigate('/search', { replace: true })
      }
    }, DEBOUNCE_MS)
    return () => clearTimeout(debounceRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  const submit = (e) => {
    e.preventDefault()
    // Manual submit (enter key) bypasses the debounce and navigates
    // immediately — also useful as a fallback if JS timing ever misses.
    if (debounceRef.current) clearTimeout(debounceRef.current)
    const trimmed = value.trim()
    if (trimmed) navigate(`/search?q=${encodeURIComponent(trimmed)}`, { replace: true })
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
