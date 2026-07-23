const BASE = 'https://backend-five-phi-74.vercel.app/api'

async function request(path) {
  const res = await fetch(`${BASE}${path}`)
  if (!res.ok) throw new Error(`Request failed: ${res.status}`)
  const json = await res.json()
  if (!json.success) throw new Error(json.message || 'API error')
  return json.data
}

export const searchAll = (query) =>
  request(`/search?query=${encodeURIComponent(query)}`)

export const searchSongs = (query, page = 0, limit = 20) =>
  request(`/search/songs?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`)

export const searchAlbums = (query, page = 0, limit = 20) =>
  request(`/search/albums?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`)

export const searchArtists = (query, page = 0, limit = 20) =>
  request(`/search/artists?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`)

export const searchPlaylists = (query, page = 0, limit = 20) =>
  request(`/search/playlists?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`)

export const getSongById = (id) => request(`/songs/${id}`)
export const getSongsByIds = (ids) => request(`/songs?ids=${ids.join(',')}`)
export const getSongSuggestions = (id) => request(`/songs/${id}/suggestions`)

export const getAlbumById = (id) => request(`/albums?id=${id}`)
export const getArtistById = (id) => request(`/artists?id=${id}`)
export const getArtistSongs = (id, page = 0) => request(`/artists/${id}/songs?page=${page}`)
export const getArtistAlbums = (id, page = 0) => request(`/artists/${id}/albums?page=${page}`)

export const getPlaylistById = (id) => request(`/playlists?id=${id}`)

// Picks the highest-quality streamable URL from a downloadUrl[] array
export function bestAudioUrl(downloadUrl = []) {
  if (!downloadUrl.length) return null
  const order = ['320kbps', '160kbps', '96kbps', '48kbps', '12kbps']
  for (const q of order) {
    const hit = downloadUrl.find((d) => d.quality === q)
    if (hit) return hit.url
  }
  return downloadUrl[downloadUrl.length - 1].url
}

export function bestImageUrl(image = []) {
  if (!image.length) return null
  return image[image.length - 1].url
}
