import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import {
  collection,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  updateDoc,
  onSnapshot,
  deleteField,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from './AuthContext'

const LibraryContext = createContext(null)
const STORAGE_KEY = 'signaldeck.library.v1'

function loadLocal() {
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

function saveLocal(library) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(library))
  } catch (e) {
    console.warn('Failed to persist library', e)
  }
}

export function LibraryProvider({ children }) {
  const { user } = useAuth()
  const [library, setLibrary] = useState(loadLocal)
  const [loading, setLoading] = useState(false)

  // Tracks which mode we're currently in so the guest-mode localStorage
  // effect doesn't fire while we're subscribed to Firestore, and vice versa.
  const modeRef = useRef(user ? 'cloud' : 'guest')

  useEffect(() => {
    if (!user) {
      modeRef.current = 'guest'
      setLibrary(loadLocal())
      setLoading(false)
      return
    }

    modeRef.current = 'cloud'
    setLoading(true)

    const likedCol = collection(db, 'users', user.uid, 'likedSongs')
    const reelsCol = collection(db, 'users', user.uid, 'reels')
    const userRef = doc(db, 'users', user.uid)

    let likedSongs = []
    let playlists = []
    let likedReady = false
    let reelsReady = false
    let cancelled = false

    function pushIfReady() {
      if (likedReady && reelsReady) {
        setLibrary({ likedSongs: [...likedSongs], playlists: [...playlists] })
        setLoading(false)
      }
    }

    // One-time check: has this account been initialized before?
    // If not, seed a starter reel and mark it done so it never repeats.
    async function ensureInitialized() {
      try {
        const userSnap = await getDoc(userRef)
        if (!userSnap.exists() || !userSnap.data().libraryInitialized) {
          const starterRef = doc(collection(db, 'users', user.uid, 'reels'))
          await setDoc(starterRef, { name: 'Late Night Reel', songs: {} })
          await setDoc(userRef, { libraryInitialized: true }, { merge: true })
        }
      } catch (e) {
        console.warn('Failed to check/seed starter reel', e)
      }
    }

    ensureInitialized()

    const unsubLiked = onSnapshot(likedCol, (snap) => {
      if (cancelled) return
      likedSongs = snap.docs
        .map((d) => d.data())
        .sort((a, b) => (b.likedAt?.toMillis?.() || 0) - (a.likedAt?.toMillis?.() || 0))
      likedReady = true
      pushIfReady()
    })

    const unsubReels = onSnapshot(reelsCol, (snap) => {
      if (cancelled) return
      playlists = snap.docs.map((d) => {
        const data = d.data()
        return {
          id: d.id,
          name: data.name,
          songs: Object.values(data.songs || {})
        }
      })
      reelsReady = true
      pushIfReady()
    })

    return () => {
      cancelled = true
      unsubLiked()
      unsubReels()
    }
  }, [user])

  // Guest mode only: persist every change to localStorage
  useEffect(() => {
    if (modeRef.current === 'guest') {
      saveLocal(library)
    }
  }, [library])

  const toggleLiked = useCallback(async (song) => {
    if (modeRef.current === 'cloud' && user) {
      const ref = doc(db, 'users', user.uid, 'likedSongs', String(song.id))
      const alreadyLiked = library.likedSongs.some((s) => s.id === song.id)
      if (alreadyLiked) {
        await deleteDoc(ref)
      } else {
        await setDoc(ref, { ...song, likedAt: serverTimestamp() })
      }
      return
    }
    setLibrary((prev) => {
      const exists = prev.likedSongs.some((s) => s.id === song.id)
      return {
        ...prev,
        likedSongs: exists
          ? prev.likedSongs.filter((s) => s.id !== song.id)
          : [song, ...prev.likedSongs]
      }
    })
  }, [user, library.likedSongs])

  const isLiked = useCallback(
    (id) => library.likedSongs.some((s) => s.id === id),
    [library.likedSongs]
  )

  const createPlaylist = useCallback(async (name) => {
    if (modeRef.current === 'cloud' && user) {
      const ref = doc(collection(db, 'users', user.uid, 'reels'))
      await setDoc(ref, { name: name || 'Untitled Reel', songs: {} })
      return ref.id
    }
    const id = 'pl_' + Date.now()
    setLibrary((prev) => ({
      ...prev,
      playlists: [...prev.playlists, { id, name: name || 'Untitled Reel', songs: [] }]
    }))
    return id
  }, [user])

  const renamePlaylist = useCallback(async (id, name) => {
    if (modeRef.current === 'cloud' && user) {
      await updateDoc(doc(db, 'users', user.uid, 'reels', id), { name })
      return
    }
    setLibrary((prev) => ({
      ...prev,
      playlists: prev.playlists.map((p) => (p.id === id ? { ...p, name } : p))
    }))
  }, [user])

  const deletePlaylist = useCallback(async (id) => {
    if (modeRef.current === 'cloud' && user) {
      await deleteDoc(doc(db, 'users', user.uid, 'reels', id))
      return
    }
    setLibrary((prev) => ({
      ...prev,
      playlists: prev.playlists.filter((p) => p.id !== id)
    }))
  }, [user])

  const addToPlaylist = useCallback(async (id, song) => {
    if (modeRef.current === 'cloud' && user) {
      await updateDoc(doc(db, 'users', user.uid, 'reels', id), {
        [`songs.${song.id}`]: song
      })
      return
    }
    setLibrary((prev) => ({
      ...prev,
      playlists: prev.playlists.map((p) =>
        p.id === id && !p.songs.some((s) => s.id === song.id)
          ? { ...p, songs: [...p.songs, song] }
          : p
      )
    }))
  }, [user])

  const removeFromPlaylist = useCallback(async (id, songId) => {
    if (modeRef.current === 'cloud' && user) {
      await updateDoc(doc(db, 'users', user.uid, 'reels', id), {
        [`songs.${songId}`]: deleteField()
      })
      return
    }
    setLibrary((prev) => ({
      ...prev,
      playlists: prev.playlists.map((p) =>
        p.id === id ? { ...p, songs: p.songs.filter((s) => s.id !== songId) } : p
      )
    }))
  }, [user])

  return (
    <LibraryContext.Provider
      value={{
        library,
        loading,
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
