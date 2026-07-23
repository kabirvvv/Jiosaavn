export default function Shelf({ title, children }) {
  if (!children || (Array.isArray(children) && children.length === 0)) return null
  return (
    <section className="mb-8">
      <h2 className="text-eyebrow text-xs text-muted mb-3 px-1">{title}</h2>
      <div className="flex gap-4 overflow-x-auto pb-2 px-1 -mx-1 snap-x">
        {children}
      </div>
    </section>
  )
}
