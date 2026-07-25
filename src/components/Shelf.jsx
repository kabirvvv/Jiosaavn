import { Children, cloneElement } from 'react'

export default function Shelf({ title, icon, children, direction = 'left', speed = 42 }) {
  const items = Children.toArray(children)
  if (items.length === 0) return null

  const duplicated = [
    ...items,
    ...items.map((child, i) => cloneElement(child, { key: `dup-${child.key ?? i}` })),
  ]

  const animationName = direction === 'right' ? 'shelf-scroll-right' : 'shelf-scroll-left'

  return (
    <section className="mb-8">
      {title && (
        <div className="flex items-center gap-2 mb-3 px-1">
          {icon}
          <h2 className="text-eyebrow text-xs text-muted">{title}</h2>
        </div>
      )}
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
