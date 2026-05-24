import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { useMediaQuery } from '../lib/useMediaQuery'
import Sidebar from './Sidebar'
import MobileNav from './MobileNav'

interface AppShellProps {
  children: ReactNode
}

export default function AppShell({ children }: AppShellProps) {
  const location = useLocation()
  const isDesktop = useMediaQuery('(min-width: 1024px)')

  return (
    <div className="flex min-h-screen bg-bg-deep">
      {isDesktop ? (
        <>
          <Sidebar currentPath={location.pathname} />
          <main className="flex-1 min-w-0 overflow-x-hidden">
            <div className="max-w-[1280px] mx-auto px-8 py-8">
              {children}
            </div>
          </main>
        </>
      ) : (
        <div className="flex-1 flex flex-col min-w-0">
          <MobileNav />
          <main className="flex-1 px-4 py-6">
            {children}
          </main>
        </div>
      )}
    </div>
  )
}
