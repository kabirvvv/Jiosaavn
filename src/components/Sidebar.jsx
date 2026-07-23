import { NavLink } from 'react-router-dom'
import { Search, Library, Radio, Disc3 } from 'lucide-react'

const links = [
  { to: '/', label: 'Search', icon: Search, end: true },
  { to: '/library', label: 'Library', icon: Library }
]

export default function Sidebar() {
  return (
    <>
      {/* Desktop rail */}
      <aside className="hidden md:flex flex-col w-56 shrink-0 border-r border-line bg-panel h-screen sticky top-0 px-4 py-6">
        <div className="flex items-center gap-2 mb-8 px-1">
          <Disc3 className="text-signal" size={22} />
          <span className="font-display font-bold text-lg tracking-tight">Signal Deck</span>
        </div>
        <nav className="flex flex-col gap-1">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                  isActive ? 'bg-panel2 text-paper' : 'text-muted hover:text-paper hover:bg-panel2/60'
                }`
              }
            >
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto text-eyebrow text-[10px] text-muted/70 px-1 leading-relaxed">
          <Radio size={13} className="inline mr-1 -mt-0.5" />
          On air via JioSaavn
        </div>
      </aside>

      {/* Mobile bottom rail */}
      <nav className="md:hidden fixed bottom-16 left-0 right-0 z-30 bg-panel border-t border-line flex justify-around py-1.5">
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-4 py-1 text-[10px] ${
                isActive ? 'text-signal' : 'text-muted'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
    </>
  )
}
