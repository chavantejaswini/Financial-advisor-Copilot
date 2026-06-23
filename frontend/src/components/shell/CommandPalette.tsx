import { useEffect, useMemo, useRef, useState } from 'react'
import { CornerDownLeft, Search } from 'lucide-react'
import type { Client, ViewId } from '../../types'
import { NAV_ITEMS } from './nav'
import { AGENTS } from '../agents/agents'

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

interface Command {
  id: string
  label: string
  hint?: string
  group: string
  icon: React.ReactNode
  run: () => void
}

interface CommandPaletteProps {
  open: boolean
  onClose: () => void
  clients: Client[]
  onNavigate: (view: ViewId) => void
  onSelectClient: (clientId: string) => void
}

export function CommandPalette({ open, onClose, clients, onNavigate, onSelectClient }: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const [cursor, setCursor] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const commands = useMemo<Command[]>(() => {
    const nav: Command[] = NAV_ITEMS.map((n) => {
      const Icon = n.icon
      return {
        id: `nav-${n.id}`,
        label: n.label,
        hint: 'Go to',
        group: 'Navigate',
        icon: <Icon className="h-4 w-4 text-ink-400" />,
        run: () => onNavigate(n.id),
      }
    })
    const clientCmds: Command[] = clients.slice(0, 50).map((c) => ({
      id: `client-${c.client_id}`,
      label: c.client_name,
      hint: 'Prep meeting',
      group: 'Clients',
      icon: <AGENTS.summary.icon className="h-4 w-4 text-accent-500" />,
      run: () => onSelectClient(c.client_id),
    }))
    return [...nav, ...clientCmds]
  }, [clients, onNavigate, onSelectClient])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return commands
    return commands.filter((c) => c.label.toLowerCase().includes(q) || c.group.toLowerCase().includes(q))
  }, [commands, query])

  useEffect(() => {
    if (open) {
      setQuery('')
      setCursor(0)
      setTimeout(() => inputRef.current?.focus(), 10)
    }
  }, [open])

  useEffect(() => {
    setCursor(0)
  }, [query])

  if (!open) return null

  const groups = filtered.reduce<Record<string, Command[]>>((acc, c) => {
    ;(acc[c.group] ??= []).push(c)
    return acc
  }, {})

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setCursor((c) => Math.min(c + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setCursor((c) => Math.max(c - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      filtered[cursor]?.run()
      onClose()
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  let flatIndex = -1

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh] px-4">
      <div className="absolute inset-0 bg-navy-950/40 backdrop-blur-[2px] animate-fade-in" onClick={onClose} />
      <div
        className="relative w-full max-w-xl rounded-xl border border-surface-border bg-surface-card shadow-lg overflow-hidden animate-scale-in"
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        onKeyDown={onKeyDown}
      >
        <div className="flex items-center gap-2.5 px-4 border-b border-surface-border">
          <Search className="h-4 w-4 text-ink-400 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search clients or jump to a screen…"
            className="flex-1 h-12 bg-transparent text-sm text-ink-900 placeholder-ink-400 focus:outline-none"
          />
          <kbd className="rounded border border-surface-border-strong bg-surface-base px-1.5 py-0.5 text-2xs text-ink-400">
            Esc
          </kbd>
        </div>

        <div className="max-h-[55vh] overflow-auto py-2">
          {filtered.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-ink-400">No matches for “{query}”.</div>
          )}
          {Object.entries(groups).map(([group, items]) => (
            <div key={group} className="mb-1">
              <div className="px-4 py-1 text-2xs font-semibold uppercase tracking-wider text-ink-400">{group}</div>
              {items.map((c) => {
                flatIndex++
                const idx = flatIndex
                const active = idx === cursor
                return (
                  <button
                    key={c.id}
                    onMouseEnter={() => setCursor(idx)}
                    onClick={() => {
                      c.run()
                      onClose()
                    }}
                    className={cx(
                      'w-full flex items-center gap-3 px-4 py-2 text-left',
                      active ? 'bg-accent-50' : 'hover:bg-surface-base',
                    )}
                  >
                    {c.icon}
                    <span className="flex-1 text-sm text-ink-900 truncate">{c.label}</span>
                    {c.hint && <span className="text-2xs text-ink-400">{c.hint}</span>}
                    {active && <CornerDownLeft className="h-3.5 w-3.5 text-ink-400" />}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
