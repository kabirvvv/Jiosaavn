import { createContext, useContext, useEffect, useState, useCallback } from 'react'

const LibraryContext = createContext(null)
const STORAGE_KEY = 'signaldeck.library.v1'

function loadInitial() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch (e) {
    console.warn('Failed to load library from storage', e)
  }
  return {
    likedSongs: [],
    playlists: [
      { id: 'pl_' + Date.now(), name: 'Late Night Reel', songs: [] }
    ]
  }
}

export function LibraryProvider({ children }) {
  const [library, setLibrary] = useState(loadInitial)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(library))
    } catch (e) {
      console.warn('Failed to persist library', e)
    }
  }, [library])

  const toggleLiked = useCallback((song) => {
    setLibrary((prev) => {
      const exists = prev.likedSongs.some((s) => s.id === song.id)
      return {
        ...prev,
        likedSongs: exists
          ? prev.likedSongs.filter((s) => s.id !== song.id)
          : [song, ...prev.likedSongs]
      }
    })
  }, [])

  const isLiked = useCallback(
    (id) => library.likedSongs.some((s) => s.id === id),
    [library.likedSongs]
  )

  const createPlaylist = useCallback((name) => {
    const id = 'pl_' + Date.now()
    setLibrary((prev) => ({
      ...prev,
      playlists: [...prev.playlists, { id, name: name || 'Untitled Reel', songs: [] }]
    }))
    return id
  }, [])

  const renamePlaylist = useCallback((id, name) => {
    setLibrary((prev) => ({
      ...prev,
      playlists: prev.playlists.map((p) => (p.id === id ? { ...p, name } : p))
    }))
  }, [])

  const deletePlaylist = useCallback((id) => {
    setLibrary((prev) => ({
      ...prev,
      playlists: prev.playlists.filter((p) => p.id !== id)
    }))
  }, [])

  const addToPlaylist = useCallback((id, song) => {
    setLibrary((prev) => ({
      ...prev,
      playlists: prev.playlists.map((p) =>
        p.id === id && !p.songs.some((s) => s.id === song.id)
          ? { ...p, songs: [...p.songs, song] }
          : p
      )
    }))
  }, [])

  const removeFromPlaylist = useCallback((id, songId) => {
    setLibrary((prev) => ({
      ...prev,
      playlists: prev.playlists.map((p) =>
        p.id === id ? { ...p, songs: p.songs.filter((s) => s.id !== songId) } : p
      )
    }))
  }, [])

  return (
    <LibraryContext.Provider
      value={{
        library,
        toggleLiked,
        isLiked,
        createPlaylist,
        renamePlaylist,
        deletePlaylist,
        addToPlaylist,
        removeFromPlaylist
      }}
    >
      {children}
    </LibraryContext.Provider>
  )
}

export function useLibrary() {
  const ctx = useContext(LibraryContext)
  if (!ctx) throw new Error('useLibrary must be used within LibraryProvider')
  return ctx
}
