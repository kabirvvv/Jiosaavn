import { createContext, useContext, useEffect, useState, useCallback } from 'react'

const ProfileContext = createContext(null)
const STORAGE_KEY = 'signaldeck.profile.v1'

function loadInitial() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch (e) {
    console.warn('Failed to load profile from storage', e)
  }
  return {
    exists: false,
    name: '',
    avatar: null, // base64 data URL
    favSongs: [],
    favArtists: [],
    favPlaylists: []
  }
}

export function ProfileProvider({ children }) {
  const [profile, setProfile] = useState(loadInitial)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
    } catch (e) {
      console.warn('Failed to persist profile', e)
    }
  }, [profile])

  const saveProfile = useCallback((data) => {
    setProfile({
      exists: true,
      name: data.name || '',
      avatar: data.avatar || null,
      favSongs: data.favSongs || [],
      favArtists: data.favArtists || [],
      favPlaylists: data.favPlaylists || []
    })
  }, [])

  const clearProfile = useCallback(() => {
    setProfile({ exists: false, name: '', avatar: null, favSongs: [], favArtists: [], favPlaylists: [] })
  }, [])

  return (
    <ProfileContext.Provider value={{ profile, saveProfile, clearProfile }}>
      {children}
    </ProfileContext.Provider>
  )
}

export function useProfile() {
  const ctx = useContext(ProfileContext)
  if (!ctx) throw new Error('useProfile must be used within ProfileProvider')
  return ctx
    }
