import { motion, AnimatePresence } from 'framer-motion'
import { X, GripVertical, Play, Pause } from 'lucide-react'
import { usePlayer } from '../context/PlayerContext'
import { bestImageUrl } from '../api/jiosaavn'
import { artistNames, stripHtml } from '../utils/format'

export default function QueueDrawer({ open, onClose }) {
  const { queue, queueIndex, isPlaying, togglePlay, playQueue, removeFromQueue } = usePlayer()

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            className="fixed right-0 top-0 bottom-0 w-full sm:w-96 bg-panel border-l border-line z-50 flex flex-col"
          >
            <div className="flex items-center justify-between px-4 py-4 border-b border-line">
              <h3 className="text-eyebrow text-xs text-muted">Now Queued — {queue.length} tracks</h3>
              <button onClick={onClose} className="text-muted hover:text-paper" aria-label="Close queue">
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-2 py-2 pb-24">
              {queue.length === 0 && (
                <p className="text-sm text-muted px-3 py-6 text-center">Queue is empty. Play something to fill the deck.</p>
              )}
              {queue.map((song, i) => {
                const isCurrent = i === queueIndex
                const artwork = bestImageUrl(song.image)
                return (
                  <div
                    key={`${song.id}-${i}`}
                    className={`group flex items-center gap-2 px-2 py-2 rounded-md ${isCurrent ? 'bg-panel2' : 'hover:bg-panel2/60'}`}
                  >
                    <GripVertical size={14} className="text-muted/50 flex-shrink-0" />
                    <button
                      onClick={() => (isCurrent ? togglePlay() : playQueue(queue, i))}
                      className="relative w-9 h-9 rounded overflow-hidden border border-line flex-shrink-0"
                    >
                      {artwork && <img src={artwork} className="w-full h-full object-cover" alt="" />}
                      <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100">
                        {isCurrent && isPlaying ? <Pause size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" className="ml-0.5" />}
                      </span>
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className={`truncate text-sm ${isCurrent ? 'text-signal' : 'text-paper'}`}>{stripHtml(song.title || song.name || '')}</p>
                      <p className="truncate text-xs text-muted">{artistNames(song)}</p>
                    </div>
                    <button
                      onClick={() => removeFromQueue(i)}
                      className="text-muted opacity-0 group-hover:opacity-100 hover:text-signal flex-shrink-0"
                      aria-label="Remove from queue"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
