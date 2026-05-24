import { useState, type ReactNode } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import IconButton from '../ui/IconButton'
import { List, X } from '@phosphor-icons/react'

const navItems = [
  { label: 'Dashboard', path: '/' },
  { label: 'Sleep', path: '/sleep' },
  { label: 'To-do', path: '/todo' },
  { label: 'Journal', path: '/journal' },
  { label: 'Library', path: '/library' },
  { label: 'Finance', path: '/finance' },
  { label: 'Body', path: '/body' },
  { label: 'Food', path: '/food' },
  { label: 'Meal Prep', path: '/mealprep' },
  { label: 'Workouts', path: '/workouts' },
  { label: 'Weekly', path: '/weekly' },
  { label: 'Settings', path: '/settings' },
]

function HamburgerIcon() {
  return <List size={20} weight="regular" aria-hidden="true" />
}

function CloseIcon() {
  return <X size={18} weight="regular" aria-hidden="true" />
}

function getPageTitle(path: string): string {
  const item = navItems.find((n) => {
    if (n.path === '/') return path === '/'
    return path.startsWith(n.path)
  })
  return item?.label ?? 'matteOS'
}

interface MobileNavProps {
  right?: ReactNode
}

export default function MobileNav({ right }: MobileNavProps) {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const title = getPageTitle(location.pathname)

  return (
    <>
      {/* Top bar */}
      <header className="flex items-center h-14 px-4 bg-bg-base border-b border-border-default sticky top-0 z-30">
        <IconButton label="Open navigation" onClick={() => setOpen(true)}>
          <HamburgerIcon />
        </IconButton>
        <span className="flex-1 text-center text-base font-medium text-text-primary">{title}</span>
        <div className="w-8 flex justify-end">
          {right ?? <span className="w-8" />}
        </div>
      </header>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 matteos-fade-in"
          style={{ background: 'rgba(0,0,0,0.55)' }}
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <nav
        className={`
          fixed top-0 left-0 bottom-0 z-50 w-[280px] bg-bg-base border-r border-border-default
          flex flex-col transition-transform duration-[220ms] ease-out
        `}
        style={{ transform: open ? 'translateX(0)' : 'translateX(-100%)' }}
        aria-label="Mobile navigation"
        aria-hidden={!open}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-4 h-14 border-b border-border-subtle">
          <span className="text-lg font-bold text-text-primary tracking-tight">matteOS</span>
          <IconButton label="Close navigation" onClick={() => setOpen(false)}>
            <CloseIcon />
          </IconButton>
        </div>

        {/* Nav links */}
        <div className="flex-1 overflow-y-auto py-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center h-10 px-4 text-sm transition-colors duration-[120ms] ease-out ${
                  isActive
                    ? 'text-text-primary font-medium'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
                }`
              }
              style={({ isActive }) =>
                isActive
                  ? { background: 'var(--color-accent-soft)', borderLeft: '2px solid var(--color-accent)' }
                  : {}
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </>
  )
}
