import { useEffect, useRef, useState } from 'react'
import { Bell, ChevronRight, Menu, Search } from 'lucide-react'
import type { HealthStatus, ViewId } from '../../types'
import { VIEW_TITLES } from './nav'
import { DEMO_NOTIFICATIONS } from '../../lib/mock'
import { Badge } from '../ui/Badge'

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

function ModeBadge({ health }: { health: HealthStatus | null }) {
  if (!health) return null
  if (health.agentforce_configured) return <Badge tone="violet" dot>Hybrid · Agentforce</Badge>
  if (health.salesforce_configured) return <Badge tone="success" dot>Live Salesforce · SOQL</Badge>
  return <Badge tone="neutral" dot>CSV fallback</Badge>
}

function NotificationsButton() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const unread = DEMO_NOTIFICATIONS.filter((n) => n.unread).length

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-9 w-9 items-center justify-center rounded-md text-ink-500 hover:bg-surface-sunken hover:text-ink-700"
        aria-label={`Notifications (${unread} unread)`}
      >
        <Bell className="h-4.5 w-4.5" />
        {unread > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-accent-400 opacity-75 animate-ping" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-accent-500" />
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-1.5 w-80 rounded-lg border border-surface-border bg-surface-card shadow-lg z-50 animate-scale-in origin-top-right overflow-hidden">
          <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-surface-border">
            <span className="text-sm font-semibold text-ink-900">Notifications</span>
            <Badge tone="accent">{unread} new</Badge>
          </div>
          <ul className="max-h-96 overflow-auto divide-y divide-surface-border">
            {DEMO_NOTIFICATIONS.map((n) => (
              <li key={n.id} className={cx('px-3.5 py-2.5 hover:bg-surface-base', n.unread && 'bg-accent-50/40')}>
                <div className="flex items-start gap-2">
                  {n.unread && <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-accent-500 shrink-0" />}
                  <div className={cx('min-w-0', !n.unread && 'pl-3.5')}>
                    <div className="text-xs font-medium text-ink-900">{n.title}</div>
                    <div className="text-2xs text-ink-500 mt-0.5">{n.body}</div>
                    <div className="text-2xs text-ink-400 mt-0.5">{n.time}</div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <div className="px-3.5 py-2 border-t border-surface-border text-center">
            <span className="text-2xs text-ink-400">Sample notifications</span>
          </div>
        </div>
      )}
    </div>
  )
}

interface TopbarProps {
  view: ViewId
  clientName?: string
  health: HealthStatus | null
  onOpenCommand: () => void
  onOpenMobileNav: () => void
}

export function Topbar({ view, clientName, health, onOpenCommand, onOpenMobileNav }: TopbarProps) {
  return (
    <header className="h-14 shrink-0 border-b border-surface-border bg-surface-card/80 backdrop-blur-sm flex items-center gap-3 px-4 sm:px-5 z-30">
      {/* Mobile nav toggle */}
      <button
        onClick={onOpenMobileNav}
        className="flex h-9 w-9 items-center justify-center rounded-md text-ink-500 hover:bg-surface-sunken hover:text-ink-700 lg:hidden"
        aria-label="Open navigation"
        aria-controls="primary-nav"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm min-w-0">
        <span className="hidden sm:inline text-ink-400">Copilot</span>
        <ChevronRight className="hidden sm:inline h-3.5 w-3.5 text-ink-300" />
        <span className={cx('font-medium', clientName ? 'text-ink-500' : 'text-ink-900')}>{VIEW_TITLES[view]}</span>
        {clientName && (
          <>
            <ChevronRight className="h-3.5 w-3.5 text-ink-300" />
            <span className="font-medium text-ink-900 truncate">{clientName}</span>
          </>
        )}
      </nav>

      <div className="flex-1" />

      {/* Command palette trigger */}
      <button
        onClick={onOpenCommand}
        className="hidden sm:flex items-center gap-2 h-9 px-3 rounded-md border border-surface-border bg-surface-base text-ink-400 hover:border-surface-border-strong hover:text-ink-500 transition-colors"
      >
        <Search className="h-3.5 w-3.5" />
        <span className="text-xs">Search or jump to…</span>
        <kbd className="ml-2 rounded border border-surface-border-strong bg-surface-card px-1.5 py-0.5 text-2xs font-medium text-ink-400">
          ⌘K
        </kbd>
      </button>

      <ModeBadge health={health} />
      <NotificationsButton />
    </header>
  )
}
