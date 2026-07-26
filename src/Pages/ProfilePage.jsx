function ProfileForm({ existing, onDone, onSave }) {
  const [name, setName] = useState(existing?.name || '')
  const [avatar, setAvatar] = useState(existing?.avatar || null)
  const [songsText, setSongsText] = useState((existing?.favSongs || []).join(', '))
  const [artistsText, setArtistsText] = useState((existing?.favArtists || []).join(', '))
  const [playlistsText, setPlaylistsText] = useState((existing?.favPlaylists || []).join(', '))
  const fileRef = useRef(null)

  function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setAvatar(reader.result)
    reader.readAsDataURL(file)
  }

  function parseList(text) {
    return text.split(',').map((s) => s.trim()).filter(Boolean)
  }

  function submit(e) {
    e.preventDefault()
    if (!name.trim()) return
    onSave({
      name: name.trim(),
      avatar,
      favSongs: parseList(songsText),
      favArtists: parseList(artistsText),
      favPlaylists: parseList(playlistsText)
    })
    onDone()
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="font-display text-2xl font-semibold mb-1">
        {existing ? 'Edit Profile' : 'Create Your Profile'}
      </h1>
      <p className="text-sm text-muted mb-6">
        Tell us a bit about your taste — we'll use it to tune your suggestions.
      </p>

      <form onSubmit={submit} className="space-y-5">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="w-16 h-16 rounded-full overflow-hidden border-2 border-dashed border-line hover:border-signal bg-panel2 flex items-center justify-center flex-shrink-0 transition-colors no-native-outline"
          >
            {avatar ? (
              <img src={avatar} alt="" className="w-full h-full object-cover" />
            ) : (
              <Camera size={20} className="text-muted" />
            )}
          </button>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
          <div className="text-xs text-muted">
            Tap to upload a profile picture
            <br />(optional)
          </div>
        </div>

        <div>
          <label className="text-xs font-mono text-muted uppercase tracking-wider block mb-1.5">Name</label>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            required
            className="w-full bg-panel border border-line rounded-lg px-3.5 py-2.5 text-sm no-native-outline focus:border-signal placeholder:text-muted"
          />
        </div>

        <div>
          <label className="text-xs font-mono text-muted uppercase tracking-wider block mb-1.5">Favorite Songs</label>
          <input
            value={songsText}
            onChange={(e) => setSongsText(e.target.value)}
            placeholder="e.g. Blinding Lights, Levitating, Die With A Smile"
            className="w-full bg-panel border border-line rounded-lg px-3.5 py-2.5 text-sm no-native-outline focus:border-signal placeholder:text-muted"
          />
          <p className="text-[10px] text-muted mt-1">Separate with commas</p>
        </div>

        <div>
          <label className="text-xs font-mono text-muted uppercase tracking-wider block mb-1.5">Favorite Artists</label>
          <input
            value={artistsText}
            onChange={(e) => setArtistsText(e.target.value)}
            placeholder="e.g. Arijit Singh, The Weeknd"
            className="w-full bg-panel border border-line rounded-lg px-3.5 py-2.5 text-sm no-native-outline focus:border-signal placeholder:text-muted"
          />
          <p className="text-[10px] text-muted mt-1">Separate with commas</p>
        </div>

        <div>
          <label className="text-xs font-mono text-muted uppercase tracking-wider block mb-1.5">Favorite Playlists</label>
          <input
            value={playlistsText}
            onChange={(e) => setPlaylistsText(e.target.value)}
            placeholder="e.g. Rainy Day Lo-fi, Workout Bangers"
            className="w-full bg-panel border border-line rounded-lg px-3.5 py-2.5 text-sm no-native-outline focus:border-signal placeholder:text-muted"
          />
          <p className="text-[10px] text-muted mt-1">Separate with commas</p>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            className="flex-1 bg-signal text-ink font-semibold py-2.5 rounded-lg hover:bg-signal2 transition-colors no-native-outline"
          >
            {existing ? 'Save Changes' : 'Create Profile'}
          </button>
          {existing && (
            <button
              type="button"
              onClick={onDone}
              className="px-5 py-2.5 rounded-lg border border-line text-muted hover:text-paper transition-colors no-native-outline"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  )
      }
