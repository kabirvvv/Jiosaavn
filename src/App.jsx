import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import SignalDeck from './components/SignalDeck'
import QueueDrawer from './components/QueueDrawer'
import SearchPage from './pages/SearchPage'
import AlbumPage from './pages/AlbumPage'
import ArtistPage from './pages/ArtistPage'
import PlaylistPage from './pages/PlaylistPage'
import LibraryPage from './pages/LibraryPage'

export default function App() {
  const [queueOpen, setQueueOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-ink">
      <Sidebar />
      <div className="flex-1 min-w-0">
        <TopBar onOpenQueue={() => setQueueOpen(true)} />
        <main className="px-4 sm:px-6 py-6 pb-40 md:pb-28 max-w-6xl mx-auto">
          <Routes>
            <Route path="/" element={<SearchPage />} />
            <Route path="/album/:id" element={<AlbumPage />} />
            <Route path="/artist/:id" element={<ArtistPage />} />
            <Route path="/playlist/:id" element={<PlaylistPage />} />
            <Route path="/library" element={<LibraryPage />} />
          </Routes>
        </main>
      </div>
      <SignalDeck onOpenQueue={() => setQueueOpen(true)} />
      <QueueDrawer open={queueOpen} onClose={() => setQueueOpen(false)} />
    </div>
  )
}
