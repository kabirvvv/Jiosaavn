export function formatTime(seconds) {
  if (!isFinite(seconds) || seconds < 0) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function stripHtml(str = '') {
  return str.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#039;/g, "'")
}

export function artistNames(song) {
  if (!song) return ''
  if (typeof song.primaryArtists === 'string' && song.primaryArtists) return stripHtml(song.primaryArtists)
  if (song.artists?.primary?.length) return stripHtml(song.artists.primary.map((a) => a.name).join(', '))
  return stripHtml(song.subtitle || '')
}
