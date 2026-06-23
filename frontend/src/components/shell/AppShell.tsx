import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { Client, HealthStatus, ViewId } from '../../types'
import { NavSidebar } from './NavSidebar'
import { Topbar } from './Topbar'
import { CommandPalette } from './CommandPalette'

interface AppShellProps {
  view: ViewId
  clientName?: string
  health: HealthStatus | null
  clients: Client[]
  onNavigate: (view: ViewId) => void
  onSelectClient: (clientId: string) => void
  children: ReactNode
}

export function AppShell({
  view,
  clientName,
  health,
  clients,
  onNavigate,
  onSelectClient,
  children,
}: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen((v) => !v)
      }
      if (e.key === 'Escape') setMobileNavOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Lock body scroll while the mobile drawer is open
  useEffect(() => {
    document.body.style.overflow = mobileNavOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileNavOpen])

  function handleNavigate(next: ViewId) {
    onNavigate(next)
    setMobileNavOpen(false)
  }

  return (
    <div className="flex h-screen overflow-hidden bg-surface-base">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-[200] focus:rounded-md focus:bg-navy-900 focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-white"
      >
        Skip to content
      </a>

      {/* Mobile backdrop */}
      {mobileNavOpen && (
        <div
          className="fixed inset-0 z-40 bg-navy-950/40 backdrop-blur-[2px] lg:hidden animate-fade-in"
          onClick={() => setMobileNavOpen(false)}
          aria-hidden="true"
        />
      )}

      <NavSidebar
        active={view}
        collapsed={collapsed}
        mobileOpen={mobileNavOpen}
        onNavigate={handleNavigate}
        onToggle={() => setCollapsed((v) => !v)}
        onCloseMobile={() => setMobileNavOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Topbar
          view={view}
          clientName={clientName}
          health={health}
          onOpenCommand={() => setPaletteOpen(true)}
          onOpenMobileNav={() => setMobileNavOpen(true)}
        />
        <main id="main-content" className="flex-1 overflow-auto" tabIndex={-1}>
          {children}
        </main>
      </div>

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        clients={clients}
        onNavigate={(v) => {
          handleNavigate(v)
          setPaletteOpen(false)
        }}
        onSelectClient={(id) => {
          onSelectClient(id)
          setPaletteOpen(false)
        }}
      />
    </div>
  )
}
