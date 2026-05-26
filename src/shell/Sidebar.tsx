import { NavLink, useLocation } from 'react-router-dom'
import {
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
  {
    label: 'Dashboard',
    path: '/',
    icon: <SquaresFour size={16} weight="light" aria-hidden="true" />,
  },
  {
    label: 'Sleep',
    path: '/sleep',
    icon: <Moon size={16} weight="light" aria-hidden="true" />,
  },
  {
    label: 'To-do',
    path: '/todo',
    icon: <CheckSquare size={16} weight="light" aria-hidden="true" />,
  },
  {
    label: 'Journal',
    path: '/journal',
    icon: <NotePencil size={16} weight="light" aria-hidden="true" />,
  },
  {
    label: 'Library',
    path: '/journal?tab=library',
    icon: <Books size={16} weight="light" aria-hidden="true" />,
  },
  {
    label: 'Finance',
    path: '/finance',
    icon: <Diamond size={16} weight="light" aria-hidden="true" />,
  },
  {
    label: 'Workouts',
    path: '/workouts',
    icon: <Barbell size={16} weight="light" aria-hidden="true" />,
  },
  {
    label: 'Body',
    path: '/body',
    icon: <ArrowUp size={16} weight="light" aria-hidden="true" />,
  },
  {
    label: 'Food',
    path: '/food',
    icon: <ForkKnife size={16} weight="light" aria-hidden="true" />,
  },
  {
    label: 'Meal Prep',
    path: '/mealprep',
    icon: <CookingPot size={16} weight="light" aria-hidden="true" />,
  },
  {
    label: 'Weekly',
    path: '/weekly',
    icon: <CalendarCheck size={16} weight="light" aria-hidden="true" />,
  },
]

interface SidebarProps {
  currentPath: string
}

export default function Sidebar({ currentPath: _currentPath }: SidebarProps) {
  const location = useLocation()
  const tabParam = new URLSearchParams(location.search).get('tab')

  function isItemActive(path: string): boolean {
    if (path === '/journal') {
      // Active when on /journal with no tab param or tab=journal
      return location.pathname === '/journal' && tabParam !== 'library'
    }
    if (path === '/journal?tab=library') {
      // Active when on /journal with tab=library
      return location.pathname === '/journal' && tabParam === 'library'
    }
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  return (
    <aside className="w-[220px] flex-shrink-0 bg-bg-base border-r border-border-default flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="px-4 h-14 flex items-center border-b border-border-subtle">
        <span className="text-lg font-bold text-text-primary tracking-tight">matteOS</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2" aria-label="Main navigation">
        {navItems.map((item) => {
          const active = isItemActive(item.path)
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={false}
              className={() =>
                `flex items-center gap-3 h-9 px-3 text-sm transition-colors duration-[120ms] ease-out relative ${
                  active
                    ? 'text-text-primary font-medium'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
                }`
              }
              style={() =>
                active
                  ? {
                      background: 'var(--color-accent-soft)',
                      borderLeft: '2px solid var(--color-accent)',
                    }
                  : {}
              }
              aria-current={active ? 'page' : undefined}
            >
              <span style={{ color: active ? 'var(--color-accent)' : undefined }}>
                {item.icon}
              </span>
              {item.label}
            </NavLink>
          )
        })}
      </nav>

      {/* Settings */}
      <div className="border-t border-border-subtle py-2">
        {(() => {
          const active = location.pathname.startsWith('/settings')
          return (
            <NavLink
              to="/settings"
              end={false}
              className={() =>
                `flex items-center gap-3 h-9 px-3 text-sm transition-colors duration-[120ms] ease-out ${
                  active
                    ? 'text-text-primary font-medium'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
                }`
              }
              style={() =>
                active ? { background: 'var(--color-accent-soft)', borderLeft: '2px solid var(--color-accent)' } : {}
              }
              aria-current={active ? 'page' : undefined}
            >
              <span style={{ color: active ? 'var(--color-accent)' : undefined }}>
                <Gear size={16} weight="light" aria-hidden="true" />
              </span>
              Settings
            </NavLink>
          )
        })()}
      </div>
    </aside>
  )
}
