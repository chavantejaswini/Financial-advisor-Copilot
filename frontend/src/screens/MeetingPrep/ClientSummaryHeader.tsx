import { Building2, CalendarClock, Gauge, ListTodo, Target, Wallet } from 'lucide-react'
import type { ClientContextShape } from '../../types'
import { formatDate, initials } from '../../lib/format'
import { Badge } from '../../components/ui/Badge'

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-8 w-8 items-center justify-center rounded-md bg-surface-sunken text-ink-500 shrink-0">
        {icon}
      </span>
      <div className="min-w-0">
        <div className="text-2xs uppercase tracking-wider text-ink-400">{label}</div>
        <div className="text-sm font-medium text-ink-900 truncate">{value || '—'}</div>
      </div>
    </div>
  )
}

export function ClientSummaryHeader({ context }: { context: ClientContextShape }) {
  const p = context.client_profile ?? {}
  const name = p.client_name ?? 'Client'
  const openTasks = context.open_tasks?.length ?? 0
  const goals = context.client_goals?.length ?? 0

  return (
    <div className="rounded-lg border border-surface-border bg-surface-card shadow-sm overflow-hidden">
      <div className="flex items-center gap-4 px-5 py-4">
        <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-navy-900 text-base font-semibold text-white shrink-0">
          {initials(name)}
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg font-semibold text-ink-900 truncate">{name}</h2>
            {context.source === 'salesforce' ? (
              <Badge tone="success" dot>
                Salesforce
              </Badge>
            ) : (
              <Badge tone="neutral" dot>
                CSV
              </Badge>
            )}
          </div>
          <p className="text-xs text-ink-500 mt-0.5">
            {[p.industry, p.account_type].filter(Boolean).join(' · ') || 'Client account'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 px-5 py-4 border-t border-surface-border bg-surface-base/40">
        <Stat icon={<Gauge className="h-4 w-4" />} label="Risk" value={p.risk_tolerance} />
        <Stat icon={<Wallet className="h-4 w-4" />} label="AUM band" value={p.aum_band} />
        <Stat icon={<Building2 className="h-4 w-4" />} label="Industry" value={p.industry} />
        <Stat
          icon={<CalendarClock className="h-4 w-4" />}
          label="Client since"
          value={p.relationship_start ? formatDate(p.relationship_start) : '—'}
        />
        <Stat icon={<ListTodo className="h-4 w-4" />} label="Open tasks" value={<span className="tnum">{openTasks}</span>} />
        <Stat icon={<Target className="h-4 w-4" />} label="Goals" value={<span className="tnum">{goals}</span>} />
      </div>
    </div>
  )
}
