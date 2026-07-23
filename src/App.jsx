import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar.jsx'
import TopBar from './components/TopBar.jsx'
import SignalDeck from './components/SignalDeck.jsx'
import QueueDrawer from './components/QueueDrawer.jsx'
import SearchPage from './pages/SearchPage.jsx'
import AlbumPage from './pages/AlbumPage.jsx'
import ArtistPage from './pages/ArtistPage.jsx'
import PlaylistPage from './pages/PlaylistPage.jsx'
import LibraryPage from './pages/LibraryPage.jsx'
import FullPlayerModal from './components/FullPlayerModal.jsx'
import HomePage from './Pages/HomePage.jsx'


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
