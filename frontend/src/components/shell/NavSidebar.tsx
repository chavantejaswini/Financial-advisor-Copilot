import { ChevronLeft, ClipboardCheck, X } from 'lucide-react'
import type { ViewId } from '../../types'
import { ADVISOR } from '../../lib/mock'
import { initials } from '../../lib/format'
import { NAV_ITEMS } from './nav'

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

interface NavSidebarProps {
  active: ViewId
  collapsed: boolean
  mobileOpen: boolean
  onNavigate: (view: ViewId) => void
  onToggle: () => void
  onCloseMobile: () => void
}

export function NavSidebar({ active, collapsed, mobileOpen, onNavigate, onToggle, onCloseMobile }: NavSidebarProps) {
  return (
    <aside
      id="primary-nav"
      aria-label="Primary navigation"
      className={cx(
        // Mobile: off-canvas drawer. Desktop (lg): static, width toggles with collapse.
        'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-navy-800 bg-navy-900 text-navy-100',
        'transition-transform duration-200 lg:static lg:z-auto lg:transition-[width]',
        collapsed ? 'lg:w-[68px]' : 'lg:w-60',
        mobileOpen ? 'translate-x-0 shadow-lg' : '-translate-x-full lg:translate-x-0',
      )}
    >
      {/* Brand */}
      <div className={cx('flex items-center gap-2.5 h-14 px-4 border-b border-navy-800', collapsed && 'lg:justify-center lg:px-0')}>
        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-accent-500 text-white shrink-0">
          <ClipboardCheck className="h-4.5 w-4.5" strokeWidth={2.2} />
        </span>
        <div className={cx('min-w-0', collapsed && 'lg:hidden')}>
          <div className="text-sm font-semibold text-white leading-tight truncate">Advisor Copilot</div>
          <div className="text-2xs text-navy-300">AI Meeting Prep</div>
        </div>
        {/* Mobile close */}
        <button
          onClick={onCloseMobile}
          className="ml-auto flex h-8 w-8 items-center justify-center rounded-md text-navy-300 hover:bg-navy-800 hover:text-white lg:hidden"
          aria-label="Close navigation"
        >
          <X className="h-4.5 w-4.5" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2.5 py-3 space-y-0.5" aria-label="Primary">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = active === item.id
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              title={collapsed ? item.label : undefined}
              aria-current={isActive ? 'page' : undefined}
              className={cx(
                'group relative w-full flex items-center gap-3 rounded-md px-2.5 h-9 text-sm font-medium transition-colors',
                collapsed && 'lg:justify-center lg:px-0',
                isActive ? 'bg-accent-500/15 text-white' : 'text-navy-200 hover:bg-navy-800 hover:text-white',
              )}
            >
              {isActive && <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-accent-400" />}
              <Icon className="h-4.5 w-4.5 shrink-0" />
              <span className={cx('flex-1 text-left truncate', collapsed && 'lg:hidden')}>{item.label}</span>
              {item.comingSoon && (
                <span className={cx('text-2xs text-navy-400 font-normal', collapsed && 'lg:hidden')}>Soon</span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Profile */}
      <div className="border-t border-navy-800 p-3">
        <div className={cx('flex items-center gap-2.5', collapsed && 'lg:justify-center')}>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-navy-700 text-2xs font-semibold text-white shrink-0">
            {initials(ADVISOR.name)}
          </span>
          <div className={cx('min-w-0', collapsed && 'lg:hidden')}>
            <div className="text-xs font-medium text-white truncate">{ADVISOR.name}</div>
            <div className="text-2xs text-navy-300 truncate">{ADVISOR.title}</div>
          </div>
        </div>
      </div>

      {/* Collapse toggle (desktop only) */}
      <button
        onClick={onToggle}
        className="hidden h-9 border-t border-navy-800 text-navy-300 hover:text-white hover:bg-navy-800 lg:flex items-center justify-center transition-colors"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        aria-expanded={!collapsed}
      >
        <ChevronLeft className={cx('h-4 w-4 transition-transform', collapsed && 'rotate-180')} />
      </button>
    </aside>
  )
}
