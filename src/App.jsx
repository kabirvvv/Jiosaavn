import { useState } from 'react'
import { Routes, Route, Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { AuthProvider } from './context/AuthContext.jsx'
import Sidebar from './components/Sidebar.jsx'
import TopBar from './components/TopBar.jsx'
import SignalDeck from './components/SignalDeck.jsx'
import QueueDrawer from './components/QueueDrawer.jsx'
import HomePage from './Pages/HomePage.jsx'
import SearchPage from './Pages/SearchPage.jsx'
import AlbumPage from './Pages/AlbumPage.jsx'
import ArtistPage from './Pages/ArtistPage.jsx'
import PlaylistPage from './Pages/PlaylistPage.jsx'
import LibraryPage from './Pages/LibraryPage.jsx'
import NowPlayingPage from './Pages/NowPlayingPage.jsx'
import LyricsPage from './Pages/LyricsPage.jsx'
import RecommendationsPage from './Pages/RecommendationsPage.jsx'
import ProfilePage from './Pages/ProfilePage.jsx'
import LikedSongsPage from './Pages/LikedSongsPage.jsx'
import SignInPage from './Pages/SignInPage.jsx'

// Layout route: Sidebar + TopBar mount ONCE and stay mounted across every
// nested navigation (Home, Search, Album, ...). Only <Outlet/> swaps.
// This is what lets TopBar's search element persist as the SAME instance
// across the /search navigation — required for the icon-to-input morph.
function AppShellLayout({ onOpenQueue }) {
  const location = useLocation()
  return (
    <div className="flex min-h-screen bg-ink">
      <Sidebar />
      <div className="flex-1 min-w-0">
        <TopBar onOpenQueue={onOpenQueue} />
        <main className="px-4 sm:px-6 py-6 pb-40 md:pb-28 max-w-6xl mx-auto">
          <AnimatePresence mode="wait">
            <div key={location.pathname}>
              <Outlet />
            </div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}

function AppRoutes() {
  const [queueOpen, setQueueOpen] = useState(false)
  const location = useLocation()
  const isFullScreenRoute = location.pathname === '/now-playing' || location.pathname === '/lyrics'
  const isAuthRoute = location.pathname === '/signin'
  const hasBottomNav = !isFullScreenRoute && !location.pathname.startsWith('/recommendations')

  return (
    <>
      <Routes>
        <Route path="/signin" element={<SignInPage />} />

        <Route element={<AppShellLayout onOpenQueue={() => setQueueOpen(true)} />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/album/:id" element={<AlbumPage />} />
          <Route path="/artist/:id" element={<ArtistPage />} />
          <Route path="/playlist/:id" element={<PlaylistPage />} />
          <Route path="/library" element={<LibraryPage />} />
          <Route path="/library/liked" element={<LikedSongsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>

        <Route path="/now-playing" element={<NowPlayingPage />} />
        <Route path="/lyrics" element={<LyricsPage />} />
        <Route path="/recommendations/:trackId" element={<RecommendationsPage />} />
      </Routes>
      {!isFullScreenRoute && !isAuthRoute && (
        <SignalDeck onOpenQueue={() => setQueueOpen(true)} hasBottomNav={hasBottomNav} />
      )}
      {!isFullScreenRoute && !isAuthRoute && (
        <QueueDrawer open={queueOpen} onClose={() => setQueueOpen(false)} />
      )}
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
          }
