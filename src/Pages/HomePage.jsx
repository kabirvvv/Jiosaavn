import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Play, Pause, Heart, Sparkles, Flame, Music, Disc, UserCheck, ChevronRight, Radio } from 'lucide-react'
import { searchSongs, searchPlaylists, searchAlbums, searchArtists, bestImageUrl } from '../api/jiosaavn'
import { usePlayer } from '../context/PlayerContext'
import { useLibrary } from '../context/LibraryContext'
import { artistNames, stripHtml, formatTime } from '../utils/format'
const CATEGORIES = [
  { id: 'all', label: 'All', query: 'Trending' },
  { id: 'bollywood', label: 'Bollywood', query: 'Bollywood Hits' },
  { id: 'topcharts', label: 'Top Charts', query: 'Top 50' },
  { id: 'punjabi', label: 'Punjabi', query: 'Punjabi Hits' },
  { id: 'pop', label: 'Pop & International', query: 'Pop Hits' },
  { id: 'chill', label: 'Chill & Lo-Fi', query: 'Chill Lo-Fi' },
  { id: 'romance', label: 'Romantic', query: 'Romantic Hits' },
]
export default function HomePage() {
  const { currentTrack, isPlaying, togglePlay, playNow, playQueue } = usePlayer()
  const { isLiked, toggleLiked } = useLibrary()
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0])
  const [loading, setLoading] = useState(true)
  const [heroTrack, setHeroTrack] = useState(null)
  const [trendingSongs, setTrendingSongs] = useState([])
  const [topPlaylists, setTopPlaylists] = useState([])
  const [featuredAlbums, setFeaturedAlbums] = useState([])
  const [popularArtists, setPopularArtists] = useState([])
  useEffect(() => {
    let isMounted = true
    async function loadHomeData() {
      setLoading(true)
      try {
        const query = activeCategory.query
        const [songsRes, playlistsRes, albumsRes, artistsRes] = await Promise.allSettled([
          searchSongs(query, 0, 16),
          searchPlaylists(query, 0, 8),
          searchAlbums(query, 0, 8),
          searchArtists('Arijit Singh Pritam Shreya Ghoshal Badshah Taylor Swift', 0, 8)
        ])
        if (!isMounted) return
        const songs = songsRes.status === 'fulfilled' ? songsRes.value?.results || [] : []
        const playlists = playlistsRes.status === 'fulfilled' ? playlistsRes.value?.results || [] : []
        const albums = albumsRes.status === 'fulfilled' ? albumsRes.value?.results || [] : []
        const artists = artistsRes.status === 'fulfilled' ? artistsRes.value?.results || [] : []
        setTrendingSongs(songs)
        setTopPlaylists(playlists)
        setFeaturedAlbums(albums)
        setPopularArtists(artists)
        if (songs.length > 0) {
          setHeroTrack(songs[0])
        }
      } catch (err) {
        console.error('Failed loading home page data:', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    loadHomeData()
    return () => { isMounted = false }
  }, [activeCategory])
  const heroArtwork = heroTrack ? bestImageUrl(heroTrack.image) : null
  const heroTitle = heroTrack ? stripHtml(heroTrack.title || heroTrack.name || '') : ''
  const heroSubtitle = heroTrack ? artistNames(heroTrack) : ''
  const isHeroPlaying = isPlaying && currentTrack?.id === heroTrack?.id
  return (
    <div className="space-y-10 pb-16">
      {/* Category Pills Header */}
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
      {/* Hero Spotlight Section */}
      {loading ? (
        <div className="w-full h-72 sm:h-80 rounded-2xl bg-panel animate-pulse border border-line" />
      ) : heroTrack ? (
        <div className="relative w-full rounded-3xl overflow-hidden border border-line shadow-2xl bg-gradient-to-r from-panel via-panel2 to-chassis group">
          {/* Ambient Glow Backdrop */}
          {heroArtwork && (
            <div
              className="absolute inset-0 bg-cover bg-center opacity-25 blur-3xl scale-125 transition-all duration-1000 group-hover:opacity-40"
              style={{ backgroundImage: `url(${heroArtwork})` }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/60 to-transparent z-0" />
          <div className="relative z-10 p-6 sm:p-10 flex flex-col md:flex-row items-center gap-6 md:gap-10">
            {/* Hero Artwork */}
            <div className="relative shrink-0 w-44 h-44 sm:w-56 sm:h-56 rounded-2xl overflow-hidden shadow-2xl border border-line/40 group-hover:scale-105 transition-transform duration-500">
              <img src={heroArtwork} alt={heroTitle} className="w-full h-full object-cover" />
              <button
                onClick={() => isHeroPlaying ? togglePlay() : playNow(heroTrack, trendingSongs)}
                className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-signal text-ink flex items-center justify-center shadow-xl opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100 transition-all duration-300 hover:bg-signal2"
              >
                {isHeroPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-1" />}
              </button>
            </div>
            {/* Hero Metadata */}
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
      {/* Shelf 1: Trending Hits */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="text-signal" size={20} />
            <h2 className="text-xl font-display font-bold text-paper tracking-tight">Trending Hits</h2>
          </div>
          <Link to="/search?q=Trending" className="text-xs text-muted hover:text-signal flex items-center gap-1 font-mono">
            <span>View All</span>
            <ChevronRight size={14} />
          </Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-56 rounded-xl bg-panel animate-pulse border border-line" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {trendingSongs.map((track) => {
              const art = bestImageUrl(track.image)
              const title = stripHtml(track.title || track.name || '')
              const artist = artistNames(track)
              const isCurr = currentTrack?.id === track.id
              const isPlayingThis = isCurr && isPlaying
              return (
                <div
                  key={track.id}
                  className="group relative bg-panel border border-line rounded-xl p-3 hover:bg-panel2/80 transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between"
                >
                  <div className="relative aspect-square rounded-lg overflow-hidden mb-3 bg-chassis border border-line/30">
                    {art ? (
                      <img src={art} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted">
                        <Music size={28} />
                      </div>
                    )}
                    <button
                      onClick={() => isPlayingThis ? togglePlay() : playNow(track, trendingSongs)}
                      className={`absolute bottom-2 right-2 w-10 h-10 rounded-full bg-signal text-ink flex items-center justify-center shadow-lg transition-all duration-300 ${
                        isPlayingThis ? 'opacity-100 scale-100' : 'opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100'
                      } hover:bg-signal2`}
                    >
                      {isPlayingThis ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
                    </button>
                  </div>
                  <div>
                    <h3 className={`text-sm font-semibold truncate ${isCurr ? 'text-signal' : 'text-paper'}`}>
                      {title}
                    </h3>
                    <p className="text-xs text-muted truncate mt-0.5">{artist}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
      {/* Shelf 2: Top Playlists */}
      {topPlaylists.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio className="text-signal" size={20} />
              <h2 className="text-xl font-display font-bold text-paper tracking-tight">Featured Playlists</h2>
            </div>
            <Link to="/search?type=playlists&q=Charts" className="text-xs text-muted hover:text-signal flex items-center gap-1 font-mono">
              <span>More Playlists</span>
              <ChevronRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {topPlaylists.map((pl) => {
              const art = bestImageUrl(pl.image)
              const title = stripHtml(pl.title || pl.name || '')
              return (
                <Link
                  key={pl.id}
                  to={`/playlist/${pl.id}`}
                  className="group bg-panel border border-line rounded-xl p-3 hover:bg-panel2/80 transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="relative aspect-square rounded-lg overflow-hidden mb-3 bg-chassis border border-line/30">
                    {art && <img src={art} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />}
                  </div>
                  <h3 className="text-sm font-semibold text-paper truncate">{title}</h3>
                  <p className="text-xs text-muted truncate mt-0.5">Curated Mix</p>
                </Link>
              )
            })}
          </div>
        </section>
      )}
      {/* Shelf 3: Popular Artists */}
      {popularArtists.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserCheck className="text-signal" size={20} />
              <h2 className="text-xl font-display font-bold text-paper tracking-tight">Popular Artists</h2>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
            {popularArtists.map((artist) => {
              const art = bestImageUrl(artist.image)
              const name = stripHtml(artist.name || artist.title || '')
              return (
                <Link
                  key={artist.id}
                  to={`/artist/${artist.id}`}
                  className="group flex flex-col items-center text-center p-2 rounded-xl hover:bg-panel2/60 transition-colors"
                >
                  <div className="relative w-24 h-24 rounded-full overflow-hidden mb-2 bg-chassis border border-line/40 group-hover:scale-105 transition-transform duration-300">
                    {art ? (
                      <img src={art} alt={name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted">
                        <Disc size={32} />
                      </div>
                    )}
                  </div>
                  <span className="text-xs font-semibold text-paper truncate w-full">{name}</span>
                  <span className="text-[10px] text-muted font-mono mt-0.5">Artist</span>
                </Link>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
