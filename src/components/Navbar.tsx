import { NavLink } from 'react-router-dom'
import type { ReactNode } from 'react'

interface IconProps {
  d: ReactNode
  className?: string
}

const Icon = ({ d, className = '' }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
       strokeLinecap="round" strokeLinejoin="round" className={`w-5 h-5 ${className}`}>
    {d}
  </svg>
)

const icons: Record<string, ReactNode> = {
  attendance: <Icon d={
    <>
      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
      <rect x="9" y="3" width="6" height="4" rx="1"/>
      <path d="m9 14 2 2 4-4"/>
    </>
  } />,
  talent: <Icon d={
    <>
      <circle cx="12" cy="12" r="8"/>
      <path d="M12 8v8M9 11h5a1.5 1.5 0 0 1 0 3H9"/>
    </>
  } />,
  event: <Icon d={
    <>
      <rect x="3" y="5" width="18" height="16" rx="2"/>
      <path d="M3 9h18M8 3v4M16 3v4"/>
    </>
  } />,
  settings: <Icon d={
    <>
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </>
  } />,
}

interface Tab {
  to: string
  label: string
  icon: keyof typeof icons
  end?: boolean
}

const tabs: Tab[] = [
  { to: '/',         label: '출석부', icon: 'attendance', end: true },
  { to: '/talent',   label: '달란트', icon: 'talent' },
  { to: '/events',   label: '행사',   icon: 'event' },
  { to: '/settings', label: '설정',   icon: 'settings' },
]

function Navbar() {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t border-slate-200
                    pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-2xl mx-auto grid grid-cols-4">
        {tabs.map(tab => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-1 py-2.5 transition-colors ${
                isActive ? 'text-ink-900' : 'text-slate-400'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className={`transition-transform ${isActive ? 'scale-110' : ''}`}>
                  {icons[tab.icon]}
                </span>
                <span className={`text-[11px] ${isActive ? 'font-bold' : 'font-medium'}`}>
                  {tab.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

export default Navbar
