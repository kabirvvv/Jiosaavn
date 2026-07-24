const LRCLIB_BASE = 'https://lrclib.net/api'

// Parses LRC-format synced lyrics ("[mm:ss.xx]text" per line) into
// [{ time: seconds, text: string }, ...] sorted by time.
export function parseSyncedLyrics(lrc) {
  if (!lrc) return []
  const lines = lrc.split('\n')
  const result = []
  const timeTag = /\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?\]/g
  for (const line of lines) {
    const tags = [...line.matchAll(timeTag)]
    if (!tags.length) continue
    const text = line.replace(timeTag, '').trim()
    for (const t of tags) {
      const min = parseInt(t[1], 10)
      const sec = parseInt(t[2], 10)
      const ms = t[3] ? parseInt(t[3].padEnd(3, '0'), 10) : 0
      result.push({ time: min * 60 + sec + ms / 1000, text })
    }
  }
  return result.sort((a, b) => a.time - b.time)
}

async function tryGet(params) {
  const qs = new URLSearchParams(params).toString()
  const res = await fetch(`${LRCLIB_BASE}/get?${qs}`)
  if (!res.ok) return null
  return res.json()
}

async function trySearch(params) {
  const qs = new URLSearchParams(params).toString()
  const res = await fetch(`${LRCLIB_BASE}/search?${qs}`)
  if (!res.ok) return null
  const results = await res.json()
  return Array.isArray(results) && results.length ? results[0] : null
}

// trackName/artistName are required; albumName/durationSeconds are optional
// but improve match accuracy when available.
export async function getLyrics({ trackName, artistName, albumName, durationSeconds }) {
  if (!trackName || !artistName) return null
  const exactParams = {
    track_name: trackName,
    artist_name: artistName,
    ...(albumName ? { album_name: albumName } : {}),
    ...(durationSeconds ? { duration: Math.round(durationSeconds) } : {})
  }
  let result = await tryGet(exactParams).catch(() => null)
  if (!result) {
    result = await trySearch({ track_name: trackName, artist_name: artistName }).catch(() => null)
  }
  if (!result) return null
  return {
    plain: result.plainLyrics || null,
    synced: result.syncedLyrics ? parseSyncedLyrics(result.syncedLyrics) : [],
    instrumental: !!result.instrumental
  }
}
