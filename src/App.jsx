import { useState } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Sidebar from './components/Sidebar.jsx'
import TopBar from './components/TopBar.jsx'
import SignalDeck from './components/SignalDeck.jsx'
import QueueDrawer from './components/QueueDrawer.jsx'
import HomePage from './Pages/HomePage.jsx'
import SearchPage from './pages/SearchPage.jsx'
import AlbumPage from './pages/AlbumPage.jsx'
import ArtistPage from './pages/ArtistPage.jsx'
import PlaylistPage from './pages/PlaylistPage.jsx'
import LibraryPage from './pages/LibraryPage.jsx'
import NowPlayingPage from './Pages/NowPlayingPage.jsx'
import LyricsPage from './pages/LyricsPage.jsx'

function AppShell({ children, onOpenQueue }) {
  return (
    <div className="flex min-h-screen bg-ink">
      <Sidebar />
      <div className="flex-1 min-w-0">
        <TopBar onOpenQueue={onOpenQueue} />
        <main className="px-4 sm:px-6 py-6 pb-40 md:pb-28 max-w-6xl mx-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

export default function App() {
  const [queueOpen, setQueueOpen] = useState(false)
  const location = useLocation()
  // Now Playing and Lyrics are real full-screen pages — Sidebar/TopBar/mini
  // player simply aren't mounted on these routes, so there's nothing left
  // behind them to visibly slide or bleed through.
  const isFullScreenRoute = location.pathname === '/now-playing' || location.pathname === '/lyrics'

  return (
    <>
      <Routes>
        <Route path="/" element={<AppShell onOpenQueue={() => setQueueOpen(true)}><HomePage /></AppShell>} />
        <Route path="/search" element={<AppShell onOpenQueue={() => setQueueOpen(true)}><SearchPage /></AppShell>} />
        <Route path="/album/:id" element={<AppShell onOpenQueue={() => setQueueOpen(true)}><AlbumPage /></AppShell>} />
        <Route path="/artist/:id" element={<AppShell onOpenQueue={() => setQueueOpen(true)}><ArtistPage /></AppShell>} />
        <Route path="/playlist/:id" element={<AppShell onOpenQueue={() => setQueueOpen(true)}><PlaylistPage /></AppShell>} />
        <Route path="/library" element={<AppShell onOpenQueue={() => setQueueOpen(true)}><LibraryPage /></AppShell>} />
        <Route path="/now-playing" element={<NowPlayingPage />} />
        <Route path="/lyrics" element={<LyricsPage />} />
      </Routes>
      {!isFullScreenRoute && <SignalDeck onOpenQueue={() => setQueueOpen(true)} />}
      {!isFullScreenRoute && <QueueDrawer open={queueOpen} onClose={() => setQueueOpen(false)} />}
    </>
  )
}
