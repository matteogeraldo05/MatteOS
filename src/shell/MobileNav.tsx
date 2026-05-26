import { useState, type ReactNode } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import IconButton from '../ui/IconButton'
import {
  List,
  X,
  SquaresFour,
  Moon,
  CheckSquare,
  NotePencil,
  Books,
  Diamond,
  Barbell,
  ArrowUp,
  ForkKnife,
  CookingPot,
  CalendarCheck,
  Gear,
} from '@phosphor-icons/react'

const navItems = [
  { label: 'Dashboard',  path: '/',                    icon: <SquaresFour  size={18} weight="light" aria-hidden="true" /> },
  { label: 'Sleep',      path: '/sleep',               icon: <Moon         size={18} weight="light" aria-hidden="true" /> },
  { label: 'To-do',      path: '/todo',                icon: <CheckSquare  size={18} weight="light" aria-hidden="true" /> },
  { label: 'Journal',    path: '/journal',             icon: <NotePencil   size={18} weight="light" aria-hidden="true" /> },
  { label: 'Library',    path: '/journal?tab=library', icon: <Books        size={18} weight="light" aria-hidden="true" /> },
  { label: 'Finance',    path: '/finance',             icon: <Diamond      size={18} weight="light" aria-hidden="true" /> },
  { label: 'Workouts',   path: '/workouts',            icon: <Barbell      size={18} weight="light" aria-hidden="true" /> },
  { label: 'Body',       path: '/body',                icon: <ArrowUp      size={18} weight="light" aria-hidden="true" /> },
  { label: 'Food',       path: '/food',                icon: <ForkKnife    size={18} weight="light" aria-hidden="true" /> },
  { label: 'Meal Prep',  path: '/mealprep',            icon: <CookingPot   size={18} weight="light" aria-hidden="true" /> },
  { label: 'Weekly',     path: '/weekly',              icon: <CalendarCheck size={18} weight="light" aria-hidden="true" /> },
  { label: 'Settings',   path: '/settings',            icon: <Gear         size={18} weight="light" aria-hidden="true" /> },
]

function HamburgerIcon() {
  return <List size={20} weight="regular" aria-hidden="true" />
}

function CloseIcon() {
  return <X size={18} weight="regular" aria-hidden="true" />
}

function getPageTitle(path: string): string {
  // For /journal with tab=library, show "Library"
  const url = new URL(path, 'http://x')
  const tab = url.searchParams.get('tab')
  if (url.pathname === '/journal' && tab === 'library') return 'Library'
  const item = navItems.find((n) => {
    if (n.path === '/') return path === '/'
    if (n.path.includes('?')) return false
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
  const tabParam = new URLSearchParams(location.search).get('tab')

  const title = getPageTitle(location.pathname + location.search)

  function isItemActive(path: string): boolean {
    if (path === '/journal') {
      return location.pathname === '/journal' && tabParam !== 'library'
    }
    if (path === '/journal?tab=library') {
      return location.pathname === '/journal' && tabParam === 'library'
    }
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

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
          {navItems.map((item) => {
            const active = isItemActive(item.path)
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={false}
                onClick={() => setOpen(false)}
                className={() =>
                  `flex items-center gap-[10px] h-11 px-4 transition-colors duration-[120ms] ease-out ${
                    active
                      ? 'text-text-primary font-medium'
                      : 'text-text-muted hover:text-text-primary hover:bg-bg-hover'
                  }`
                }
                style={() =>
                  active
                    ? { background: 'var(--color-accent-soft)', borderLeft: '2px solid var(--color-accent)' }
                    : {}
                }
                aria-current={active ? 'page' : undefined}
              >
                <span
                  className="flex-shrink-0"
                  style={{ color: active ? 'var(--color-accent)' : 'var(--color-text-muted)' }}
                >
                  {item.icon}
                </span>
                <span style={{ fontSize: '15px' }}>{item.label}</span>
              </NavLink>
            )
          })}
        </div>
      </nav>
    </>
  )
}
