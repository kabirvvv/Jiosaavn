import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from './AuthContext'

const ProfileContext = createContext(null)
const STORAGE_KEY = 'signaldeck.profile.v1'

const EMPTY_PROFILE = {
  exists: false,
  name: '',
  avatar: null,
  favSongs: [],
  favArtists: [],
  favPlaylists: []
}

function loadLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch (e) {
    console.warn('Failed to load profile from storage', e)
  }
  return EMPTY_PROFILE
}

function saveLocal(profile) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
  } catch (e) {
    console.warn('Failed to persist profile', e)
  }
}

export function ProfileProvider({ children }) {
  const { user } = useAuth()
  const [profile, setProfile] = useState(loadLocal)
  const [loading, setLoading] = useState(false)

  const modeRef = useRef(user ? 'cloud' : 'guest')

  useEffect(() => {
    if (!user) {
      modeRef.current = 'guest'
      setProfile(loadLocal())
      setLoading(false)
      return
    }

    modeRef.current = 'cloud'
    setLoading(true)

    const userRef = doc(db, 'users', user.uid)

    const unsub = onSnapshot(userRef, (snap) => {
      const data = snap.data()
      if (data?.profile) {
        setProfile({ ...EMPTY_PROFILE, ...data.profile, exists: true })
      } else {
        setProfile(EMPTY_PROFILE)
      }
      setLoading(false)
    })

    return unsub
  }, [user])

  // Guest mode only: persist every change to localStorage
  useEffect(() => {
    if (modeRef.current === 'guest') {
      saveLocal(profile)
    }
  }, [profile])

  const saveProfile = useCallback(async (data) => {
    const next = { ...data, exists: true }

    if (modeRef.current === 'cloud' && user) {
      const userRef = doc(db, 'users', user.uid)
      await setDoc(userRef, { profile: data }, { merge: true })
      return
    }

    setProfile(next)
  }, [user])

  return (
    <ProfileContext.Provider value={{ profile, loading, saveProfile }}>
      {children}
    </ProfileContext.Provider>
  )
}

export function useProfile() {
  const ctx = useContext(ProfileContext)
  if (!ctx) throw new Error('useProfile must be used within ProfileProvider')
  return ctx
}
