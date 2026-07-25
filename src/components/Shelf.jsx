import { Children, cloneElement, useEffect, useRef } from 'react'

export default function Shelf({ title, icon, children, direction = 'left', speed = 45 }) {
  const items = Children.toArray(children)
  const containerRef = useRef(null)
  const rafRef = useRef(null)
  const lastTsRef = useRef(null)
  const pausedRef = useRef(false)     // true while hovered/touched
  const draggingRef = useRef(false)   // true only during an active mouse drag
  const dragStartXRef = useRef(0)
  const dragStartScrollRef = useRef(0)
  const dir = direction === 'right' ? -1 : 1

  if (items.length === 0) return null

  // Duplicate content so wrapping scrollLeft past the halfway point loops seamlessly.
  const duplicated = [
    ...items,
    ...items.map((child, i) => cloneElement(child, { key: `dup-${child.key ?? i}` })),
  ]

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    function step(ts) {
      if (lastTsRef.current == null) lastTsRef.current = ts
      const dt = (ts - lastTsRef.current) / 1000
      lastTsRef.current = ts

      if (!pausedRef.current && !draggingRef.current) {
        const half = el.scrollWidth / 2
        if (half > 0) {
          let next = el.scrollLeft + dir * speed * dt
          if (next >= half) next -= half
          if (next < 0) next += half
          el.scrollLeft = next
        }
      }
      rafRef.current = requestAnimationFrame(step)
    }
    rafRef.current = requestAnimationFrame(step)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      lastTsRef.current = null
    }
  }, [speed, dir])

  // Mouse click-drag support (touch scrolling works natively via overflow-x-auto,
  // we just pause the auto-scroll for it via onTouchStart/End below).
  function onPointerDown(e) {
    if (e.pointerType !== 'mouse') return
    draggingRef.current = true
    dragStartXRef.current = e.clientX
    dragStartScrollRef.current = containerRef.current.scrollLeft
  }
  function onPointerMove(e) {
    if (!draggingRef.current) return
    const dx = e.clientX - dragStartXRef.current
    containerRef.current.scrollLeft = dragStartScrollRef.current - dx
  }
  function endDrag() {
    draggingRef.current = false
  }

  return (
    <section className="mb-8">
      {title && (
        <div className="flex items-center gap-2 mb-3 px-1">
          {icon}
          <h2 className="text-eyebrow text-xs text-muted">{title}</h2>
        </div>
      )}
      <div
        ref={containerRef}
        className="shelf-viewport overflow-x-auto no-scrollbar cursor-grab active:cursor-grabbing select-none"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={() => { endDrag(); pausedRef.current = false }}
        onMouseEnter={() => { pausedRef.current = true }}
        onMouseLeave={() => { pausedRef.current = false }}
        onTouchStart={() => { pausedRef.current = true }}
        onTouchEnd={() => { pausedRef.current = false }}
      >
        <div className="shelf-track flex gap-4 w-max px-1">
          {duplicated}
        </div>
      </div>
    </section>
  )
      }
