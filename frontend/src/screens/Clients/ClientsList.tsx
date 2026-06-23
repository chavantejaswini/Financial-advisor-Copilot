import { useMemo, useState } from 'react'
import { ChevronRight, Search, Users } from 'lucide-react'
import type { Client, HealthStatus } from '../../types'
import { initials } from '../../lib/format'
import { Badge } from '../../components/ui/Badge'
import { Skeleton } from '../../components/ui/Skeleton'

interface ClientsListProps {
  clients: Client[]
  loading: boolean
  health: HealthStatus | null
  onOpen: (clientId: string) => void
}

export function ClientsList({ clients, loading, health, onOpen }: ClientsListProps) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return clients
    return clients.filter((c) => c.client_name.toLowerCase().includes(q))
  }, [clients, query])

  const live = health?.salesforce_configured

  return (
    <div className="mx-auto max-w-6xl px-5 py-6 space-y-5">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-ink-900">Clients</h1>
          <p className="text-sm text-ink-500 mt-0.5">
            {loading ? 'Loading client book…' : `${clients.length} accounts`}
            {live ? ' · sourced from Salesforce' : ''}
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search clients…"
            className="h-9 w-64 rounded-md border border-surface-border bg-surface-card pl-9 pr-3 text-sm text-ink-900 placeholder-ink-400 focus:outline-none focus:border-accent-400 focus:shadow-focus-accent"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-surface-border bg-surface-card p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3.5 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-surface-border-strong bg-surface-card py-16 text-center">
          <Users className="mx-auto h-6 w-6 text-ink-300" />
          <p className="mt-2 text-sm text-ink-500">No clients match “{query}”.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <button
              key={c.client_id}
              onClick={() => onOpen(c.client_id)}
              className="group flex items-center gap-3 rounded-lg border border-surface-border bg-surface-card p-4 text-left shadow-sm transition-all hover:shadow-md hover:-translate-y-px hover:border-surface-border-strong"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy-900 text-xs font-semibold text-white shrink-0">
                {initials(c.client_name)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-ink-900 truncate">{c.client_name}</div>
                <div className="mt-1">
                  <Badge tone={live ? 'success' : 'neutral'} dot>
                    {live ? 'Salesforce' : 'CSV'}
                  </Badge>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-ink-300 group-hover:text-ink-500 transition-colors" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
