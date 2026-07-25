import { Children, cloneElement } from 'react'

export default function Shelf({ title, children, direction = 'left', speed = 42 }) {
  const items = Children.toArray(children)
  if (items.length === 0) return null

  // Duplicate the row so translateX(-50%) loops seamlessly — the animation
  // slides through copy 1, then snaps invisibly into copy 2's identical
  // starting position and keeps going.
  const duplicated = [
    ...items,
    ...items.map((child, i) => cloneElement(child, { key: `dup-${child.key ?? i}` })),
  ]

  const animationName = direction === 'right' ? 'shelf-scroll-right' : 'shelf-scroll-left'

  return (
    <section className="mb-8">
      {title && <h2 className="text-eyebrow text-xs text-muted mb-3 px-1">{title}</h2>}
      <div className="shelf-viewport overflow-hidden">
        <div
          className="shelf-track flex gap-4 w-max px-1"
          style={{ animation: `${animationName} ${speed}s linear infinite` }}
        >
          {duplicated}
        </div>
      </div>
    </section>
  )
}
