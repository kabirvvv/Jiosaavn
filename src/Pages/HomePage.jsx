import { useEffect, useState } from 'react'
import { Play, Pause, Heart, Sparkles, Flame, Radio, UserCheck, Globe2, Star } from 'lucide-react'
import { searchSongs, searchPlaylists, searchArtists, bestImageUrl } from '../api/jiosaavn'
import { usePlayer } from '../context/PlayerContext'
import { useLibrary } from '../context/LibraryContext'
import { artistNames, stripHtml } from '../utils/format'
import Shelf from '../components/Shelf'
import ShelfCard from '../components/ShelfCard'

const CATEGORIES = [
  { id: 'all', label: 'All', query: 'Trending' },
  { id: 'bollywood', label: 'Bollywood', query: 'Bollywood Hits' },
  { id: 'topcharts', label: 'Top Charts', query: 'Top 50' },
  { id: 'punjabi', label: 'Punjabi', query: 'Punjabi Hits' },
  { id: 'pop', label: 'Pop & International', query: 'Pop Hits' },
  { id: 'chill', label: 'Chill & Lo-Fi', query: 'Chill Lo-Fi' },
  { id: 'romance', label: 'Romantic', query: 'Romantic Hits' },
]

function getGreeting() {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 12) return 'Good Morning'
  if (hour >= 12 && hour < 17) return 'Good Afternoon'
  if (hour >= 17 && hour < 21) return 'Good Evening'
  return 'Good Night'
}
function SongShelf({ title, icon, songs, direction, currentTrack, isPlaying, togglePlay, playNow }) {
  if (!songs || songs.length === 0) return null
  return (
    <Shelf title={title} icon={icon} direction={direction}>
      {songs.map((track) => {
        const isCurrent = currentTrack?.id === track.id
        return (
          <ShelfCard
            key={track.id}
            item={track}
            kind="song"
            isCurrent={isCurrent}
            isPlaying={isCurrent && isPlaying}
            onPlay={() => (isCurrent && isPlaying ? togglePlay() : playNow(track, songs))}
          />
        )
      })}
    </Shelf>
  )
}

      {/* Trending Hits */}
      {loading ? (
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="w-36 sm:w-40 h-56 rounded-xl bg-panel animate-pulse border border-line flex-shrink-0" />
          ))}
        </div>
      ) : (
        <SongShelf title="Trending Hits" icon={<Flame className="text-signal" size={18} />} songs={trendingSongs} direction="left" />
      )}

      {/* Featured Playlists */}
      {!loading && topPlaylists.length > 0 && (
        <Shelf title="Featured Playlists" icon={<Radio className="text-signal" size={18} />} direction="right">
          {topPlaylists.map((pl) => (
            <ShelfCard key={pl.id} item={pl} kind="playlist" />
          ))}
        </Shelf>
      )}

      {/* Popular Artists */}
      {!loading && popularArtists.length > 0 && (
        <Shelf title="Popular Artists" icon={<UserCheck className="text-signal" size={18} />} direction="left">
          {popularArtists.map((artist) => (
            <ShelfCard key={artist.id} item={artist} kind="artist" />
          ))}
        </Shelf>
      )}

      {/* Singles */}
      {extraLoading ? (
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="w-36 sm:w-40 h-56 rounded-xl bg-panel animate-pulse border border-line flex-shrink-0" />
          ))}
        </div>
      ) : (
        <SongShelf title="Singles" icon={<Star className="text-signal" size={18} />} songs={singlesSongs} direction="right" />
      )}

      {/* International */}
      {!extraLoading && (
        <SongShelf title="International" icon={<Globe2 className="text-signal" size={18} />} songs={internationalSongs} direction="left" />
      )}

      {/* All Time Favorites */}
      {!extraLoading && (
        <SongShelf title="All Time Favorites" icon={<Sparkles className="text-signal" size={18} />} songs={allTimeFavSongs} direction="right" />
      )}
export default function HomePage() {
  const { currentTrack, isPlaying, togglePlay, playNow } = usePlayer()
  const { isLiked, toggleLiked } = useLibrary()
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0])
  const [loading, setLoading] = useState(true)
  const [heroTrack, setHeroTrack] = useState(null)
  const [trendingSongs, setTrendingSongs] = useState([])
  const [topPlaylists, setTopPlaylists] = useState([])
  const [popularArtists, setPopularArtists] = useState([])

  // Homepage-wide sections — independent of the genre pill filter above,
  // so they load once on mount rather than re-fetching per category.
  const [singlesSongs, setSinglesSongs] = useState([])
  const [internationalSongs, setInternationalSongs] = useState([])
  const [allTimeFavSongs, setAllTimeFavSongs] = useState([])
  const [extraLoading, setExtraLoading] = useState(true)

  const greeting = getGreeting()

  useEffect(() => {
    let isMounted = true
    async function loadHomeData() {
      setLoading(true)
      try {
        const query = activeCategory.query
        const [songsRes, playlistsRes, artistsRes] = await Promise.allSettled([
          searchSongs(query, 0, 16),
          searchPlaylists(query, 0, 8),
          searchArtists('Arijit Singh Pritam Shreya Ghoshal Badshah Taylor Swift', 0, 8)
        ])
        if (!isMounted) return
        const songs = songsRes.status === 'fulfilled' ? songsRes.value?.results || [] : []
        const playlists = playlistsRes.status === 'fulfilled' ? playlistsRes.value?.results || [] : []
        const artists = artistsRes.status === 'fulfilled' ? artistsRes.value?.results || [] : []
        setTrendingSongs(songs)
        setTopPlaylists(playlists)
        setPopularArtists(artists)
        if (songs.length > 0) setHeroTrack(songs[0])
      } catch (err) {
        console.error('Failed loading home page data:', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    loadHomeData()
    return () => { isMounted = false }
  }, [activeCategory])

  useEffect(() => {
    let isMounted = true
    async function loadExtras() {
      setExtraLoading(true)
      try {
        const [singlesRes, intlRes, favRes] = await Promise.allSettled([
          searchSongs('New Singles 2026', 0, 12),
          searchSongs('International Hits English', 0, 12),
          searchSongs('All Time Greatest Hits', 0, 12),
        ])
        if (!isMounted) return
        setSinglesSongs(singlesRes.status === 'fulfilled' ? singlesRes.value?.results || [] : [])
        setInternationalSongs(intlRes.status === 'fulfilled' ? intlRes.value?.results || [] : [])
        setAllTimeFavSongs(favRes.status === 'fulfilled' ? favRes.value?.results || [] : [])
      } catch (err) {
        console.error('Failed loading extra homepage sections:', err)
      } finally {
        if (isMounted) setExtraLoading(false)
      }
    }
    loadExtras()
    return () => { isMounted = false }
  }, [])

  const heroArtwork = heroTrack ? bestImageUrl(heroTrack.image) : null
  const heroTitle = heroTrack ? stripHtml(heroTrack.title || heroTrack.name || '') : ''
  const heroSubtitle = heroTrack ? artistNames(heroTrack) : ''
  const isHeroPlaying = isPlaying && currentTrack?.id === heroTrack?.id

  return (
    <div className="space-y-10 pb-16">
      {/* Greeting */}
      <div className="px-1">
        <h1 className="text-2xl sm:text-3xl font-display font-extrabold tracking-tight text-signal drop-shadow-[0_0_18px_rgba(255,92,53,0.25)]">
          {greeting}
        </h1>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-300 ${
              activeCategory.id === cat.id
                ? 'bg-signal text-ink shadow-lg shadow-signal/20 scale-105'
                : 'bg-panel border border-line text-muted hover:text-paper hover:bg-panel2'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Hero Spotlight */}
      {loading ? (
        <div className="w-full h-72 sm:h-80 rounded-2xl bg-panel animate-pulse border border-line" />
      ) : heroTrack ? (
        <div className="relative w-full rounded-3xl overflow-hidden border border-line shadow-2xl bg-gradient-to-r from-panel via-panel2 to-chassis group">
          {heroArtwork && (
            <div
              className="absolute inset-0 bg-cover bg-center opacity-25 blur-3xl scale-125 transition-all duration-1000 group-hover:opacity-40"
              style={{ backgroundImage: `url(${heroArtwork})` }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/60 to-transparent z-0" />
          <div className="relative z-10 p-6 sm:p-10 flex flex-col md:flex-row items-center gap-6 md:gap-10">
            <div className="relative shrink-0 w-44 h-44 sm:w-56 sm:h-56 rounded-2xl overflow-hidden shadow-2xl border border-line/40 group-hover:scale-105 transition-transform duration-500">
              <img src={heroArtwork} alt={heroTitle} className="w-full h-full object-cover" />
              <button
                onClick={() => isHeroPlaying ? togglePlay() : playNow(heroTrack, trendingSongs)}
                className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-signal text-ink flex items-center justify-center shadow-xl opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100 transition-all duration-300 hover:bg-signal2"
              >
                {isHeroPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-1" />}
              </button>
            </div>
            <div className="flex-1 text-center md:text-left space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-signal/10 border border-signal/30 text-signal text-xs font-mono font-semibold tracking-wide">
                <Sparkles size={13} />
                <span>VIBE SPOTLIGHT</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-display font-extrabold tracking-tight text-paper line-clamp-2">
                {heroTitle}
              </h1>
              <p className="text-sm sm:text-base text-muted max-w-xl line-clamp-2 font-medium">
                {heroSubtitle} • {heroTrack.album?.name || 'Featured Release'}
              </p>
              <div className="pt-3 flex flex-wrap items-center justify-center md:justify-start gap-4">
                <button
                  onClick={() => isHeroPlaying ? togglePlay() : playNow(heroTrack, trendingSongs)}
                  className="px-6 py-3 rounded-full bg-signal text-ink font-semibold text-sm flex items-center gap-2 shadow-lg hover:bg-signal2 transition-all hover:scale-105"
                >
                  {isHeroPlaying ? (
                    <>
                      <Pause size={18} fill="currentColor" />
                      <span>Pause Signal</span>
                    </>
                  ) : (
                    <>
                      <Play size={18} fill="currentColor" className="ml-0.5" />
                      <span>Listen Now</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => toggleLiked(heroTrack)}
                  className={`p-3 rounded-full border border-line bg-panel hover:bg-panel2 transition-colors ${
                    isLiked(heroTrack.id) ? 'text-signal border-signal/40' : 'text-paper'
                  }`}
                  aria-label="Like track"
                >
                  <Heart size={18} fill={isLiked(heroTrack.id) ? 'currentColor' : 'none'} />
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

    </div>
  )
}
