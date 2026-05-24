import { NavLink } from 'react-router-dom'
import {
  SquaresFour,
  Moon,
  ListBullets,
  Notebook,
  Books,
  CurrencyDollar,
  Person,
  ForkKnife,
  CookingPot,
  Barbell,
  CalendarDots,
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
    icon: <ListBullets size={16} weight="light" aria-hidden="true" />,
  },
  {
    label: 'Journal',
    path: '/journal',
    icon: <Notebook size={16} weight="light" aria-hidden="true" />,
  },
  {
    label: 'Library',
    path: '/library',
    icon: <Books size={16} weight="light" aria-hidden="true" />,
  },
  {
    label: 'Finance',
    path: '/finance',
    icon: <CurrencyDollar size={16} weight="light" aria-hidden="true" />,
  },
  {
    label: 'Body',
    path: '/body',
    icon: <Person size={16} weight="light" aria-hidden="true" />,
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
    label: 'Workouts',
    path: '/workouts',
    icon: <Barbell size={16} weight="light" aria-hidden="true" />,
  },
  {
    label: 'Weekly',
    path: '/weekly',
    icon: <CalendarDots size={16} weight="light" aria-hidden="true" />,
  },
]

interface SidebarProps {
  currentPath: string
}

export default function Sidebar({ currentPath: _currentPath }: SidebarProps) {
  return (
    <aside className="w-[220px] flex-shrink-0 bg-bg-base border-r border-border-default flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="px-4 h-14 flex items-center border-b border-border-subtle">
        <span className="text-lg font-bold text-text-primary tracking-tight">matteOS</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2" aria-label="Main navigation">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 h-9 px-3 text-sm transition-colors duration-[120ms] ease-out relative ${
                isActive
                  ? 'text-text-primary font-medium'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
              }`
            }
            style={({ isActive }) =>
              isActive
                ? {
                    background: 'var(--color-accent-soft)',
                    borderLeft: '2px solid var(--color-accent)',
                  }
                : {}
            }
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Settings */}
      <div className="border-t border-border-subtle py-2">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center gap-3 h-9 px-3 text-sm transition-colors duration-[120ms] ease-out ${
              isActive
                ? 'text-text-primary font-medium'
                : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
            }`
          }
          style={({ isActive }) =>
            isActive ? { background: 'var(--color-accent-soft)', borderLeft: '2px solid var(--color-accent)' } : {}
          }
        >
          <Gear size={16} weight="light" aria-hidden="true" />
          Settings
        </NavLink>
      </div>
    </aside>
  )
}
