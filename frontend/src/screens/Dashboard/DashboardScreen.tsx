import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock,
  FileText,
  Sparkles,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react'
import type { Client, HealthStatus } from '../../types'
import {
  ADVISOR,
  DEMO_ATTENTION,
  DEMO_BOOK_AUM,
  DEMO_PENDING_ACTIONS,
  DEMO_TODAY_MEETINGS,
  type DemoMeeting,
} from '../../lib/mock'
import { formatCurrency, initials } from '../../lib/format'
import { Badge, DemoTag } from '../../components/ui/Badge'

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

interface DashboardScreenProps {
  clients: Client[]
  health: HealthStatus | null
  onPrep: (clientId: string) => void
  onOpenClient: (clientId: string) => void
}

export function DashboardScreen({ clients, health, onPrep, onOpenClient }: DashboardScreenProps) {
  const byName = (name: string) => clients.find((c) => c.client_name === name)?.client_id

  const meetingsToday = DEMO_TODAY_MEETINGS.length
  const pending = DEMO_PENDING_ACTIONS.length
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  const stats = [
    { label: 'Meetings today', value: meetingsToday, icon: CalendarDays, demo: true },
    { label: 'Active clients', value: clients.length || '—', icon: Users, demo: false },
    { label: 'Actions to approve', value: pending, icon: ClipboardList, demo: true },
    { label: 'Assets tracked', value: formatCurrency(DEMO_BOOK_AUM, true), icon: Wallet, demo: true },
  ]

  return (
    <div className="mx-auto max-w-6xl px-5 py-6 space-y-5">
      {/* Greeting */}
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-ink-900">
            {greeting()}, {ADVISOR.name.split(' ')[0]}
          </h1>
          <p className="text-sm text-ink-500 mt-0.5">{today} · here’s what needs your attention.</p>
        </div>
        <ConnectionHealth health={health} />
      </div>

      {/* Quick stats */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon
          return (
            <div key={s.label} className="rounded-lg border border-surface-border bg-surface-card p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="flex h-8 w-8 items-center justify-center rounded-md bg-surface-sunken text-ink-500">
                  <Icon className="h-4 w-4" />
                </span>
                {s.demo && <DemoTag />}
              </div>
              <div className="mt-3 text-2xl font-semibold text-ink-900 tnum leading-none">{s.value}</div>
              <div className="mt-1 text-2xs uppercase tracking-wider text-ink-400">{s.label}</div>
            </div>
          )
        })}
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Left: schedule + attention */}
        <div className="lg:col-span-2 space-y-5">
          <TodaySchedule meetings={DEMO_TODAY_MEETINGS} resolveId={byName} onPrep={onPrep} onOpenClient={onOpenClient} />
          <NeedsAttention resolveId={byName} onOpenClient={onOpenClient} />
        </div>

        {/* Right: approvals + activity */}
        <div className="space-y-5">
          <PendingApprovals resolveId={byName} onPrep={onPrep} />
          <RecentActivity />
        </div>
      </div>
    </div>
  )
}

function ConnectionHealth({ health }: { health: HealthStatus | null }) {
  const rows = [
    { label: 'OpenAI', ok: !!health?.openai_configured },
    { label: 'Salesforce', ok: !!health?.salesforce_configured },
    { label: 'Agentforce', ok: !!health?.agentforce_configured, optional: true },
  ]
  return (
    <div className="flex items-center gap-3 rounded-lg border border-surface-border bg-surface-card px-3.5 py-2 shadow-sm">
      {rows.map((r) => (
        <div key={r.label} className="flex items-center gap-1.5">
          <span
            className={cx(
              'h-2 w-2 rounded-full',
              r.ok ? 'bg-success-500' : r.optional ? 'bg-ink-300' : 'bg-danger-500',
            )}
          />
          <span className="text-2xs font-medium text-ink-600">{r.label}</span>
        </div>
      ))}
    </div>
  )
}

const STATUS_BADGE: Record<DemoMeeting['status'], { tone: 'success' | 'accent' | 'neutral'; label: string }> = {
  now: { tone: 'success', label: 'Now' },
  upcoming: { tone: 'accent', label: 'Upcoming' },
  done: { tone: 'neutral', label: 'Done' },
}

function TodaySchedule({
  meetings,
  resolveId,
  onPrep,
  onOpenClient,
}: {
  meetings: DemoMeeting[]
  resolveId: (name: string) => string | undefined
  onPrep: (id: string) => void
  onOpenClient: (id: string) => void
}) {
  return (
    <div className="rounded-lg border border-surface-border bg-surface-card shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-surface-border">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-ink-400" />
          <h3 className="text-sm font-semibold text-ink-900">Today’s schedule</h3>
        </div>
        <DemoTag />
      </div>
      <ul className="divide-y divide-surface-border">
        {meetings.map((m) => {
          const id = resolveId(m.clientName)
          const badge = STATUS_BADGE[m.status]
          return (
            <li key={m.id} className="flex items-center gap-3 px-5 py-3 hover:bg-surface-base/60">
              <div className="w-16 shrink-0 text-right">
                <div className="text-sm font-semibold text-ink-900 tnum">{m.time.split(' ')[0]}</div>
                <div className="text-2xs text-ink-400">{m.time.split(' ')[1]}</div>
              </div>
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy-900 text-2xs font-semibold text-white shrink-0">
                {initials(m.clientName)}
              </span>
              <div className="min-w-0 flex-1">
                <button
                  disabled={!id}
                  onClick={() => id && onOpenClient(id)}
                  className={cx('text-sm font-medium text-ink-900 truncate text-left', id && 'hover:text-accent-600')}
                >
                  {m.clientName}
                </button>
                <div className="flex items-center gap-2 mt-0.5 text-2xs text-ink-400">
                  <span>{m.type}</span>
                  <span aria-hidden>·</span>
                  <span>{m.durationMin}m</span>
                  <Badge tone={badge.tone} dot={m.status === 'now'}>
                    {badge.label}
                  </Badge>
                </div>
              </div>
              {id ? (
                <button
                  onClick={() => onPrep(id)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-accent-200 bg-accent-50 px-2.5 py-1 text-2xs font-semibold text-accent-700 hover:bg-accent-100 shrink-0"
                >
                  {m.prepReady ? <CheckCircle2 className="h-3 w-3" /> : <Sparkles className="h-3 w-3" />}
                  {m.prepReady ? 'Prep ready' : 'Prep'}
                </button>
              ) : (
                <span className="text-2xs text-ink-300 shrink-0">No record</span>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function NeedsAttention({
  resolveId,
  onOpenClient,
}: {
  resolveId: (name: string) => string | undefined
  onOpenClient: (id: string) => void
}) {
  return (
    <div className="rounded-lg border border-surface-border bg-surface-card shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-surface-border">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-ink-400" />
          <h3 className="text-sm font-semibold text-ink-900">Clients requiring attention</h3>
        </div>
        <DemoTag />
      </div>
      <ul className="divide-y divide-surface-border">
        {DEMO_ATTENTION.map((a) => {
          const id = resolveId(a.clientName)
          return (
            <li key={a.clientName} className="flex items-center gap-3 px-5 py-3">
              <span
                className={cx(
                  'h-2 w-2 rounded-full shrink-0',
                  a.severity === 'high' ? 'bg-danger-500' : 'bg-warning-500',
                )}
              />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-ink-900 truncate">{a.clientName}</div>
                <div className="text-2xs text-ink-500 mt-0.5">{a.reason}</div>
              </div>
              {id && (
                <button
                  onClick={() => onOpenClient(id)}
                  className="inline-flex items-center gap-1 text-2xs font-medium text-accent-600 hover:text-accent-700 shrink-0"
                >
                  Review <ArrowRight className="h-3 w-3" />
                </button>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function PendingApprovals({
  resolveId,
  onPrep,
}: {
  resolveId: (name: string) => string | undefined
  onPrep: (id: string) => void
}) {
  return (
    <div className="rounded-lg border border-surface-border bg-surface-card shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-surface-border">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-accent-500" />
          <h3 className="text-sm font-semibold text-ink-900">AI actions to approve</h3>
        </div>
        <Badge tone="accent">{DEMO_PENDING_ACTIONS.length}</Badge>
      </div>
      <ul className="divide-y divide-surface-border">
        {DEMO_PENDING_ACTIONS.map((a) => {
          const id = resolveId(a.clientName)
          const Icon = a.kind === 'task' ? ClipboardList : FileText
          return (
            <li key={a.id} className="px-5 py-3">
              <div className="flex items-start gap-2.5">
                <span className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-md bg-accent-50 text-accent-600 shrink-0">
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-ink-900">{a.title}</div>
                  <div className="text-2xs text-ink-400">{a.clientName}</div>
                  <p className="text-xs text-ink-600 mt-1 leading-relaxed">{a.summary}</p>
                  <div className="mt-2 flex items-center gap-1.5">
                    <button className="inline-flex items-center gap-1 rounded-md border border-success-200 bg-success-50 px-2 py-1 text-2xs font-semibold text-success-700 hover:bg-success-100">
                      <CheckCircle2 className="h-3 w-3" /> Approve
                    </button>
                    {id && (
                      <button
                        onClick={() => onPrep(id)}
                        className="rounded-md border border-surface-border-strong bg-surface-card px-2 py-1 text-2xs font-medium text-ink-600 hover:bg-surface-sunken"
                      >
                        Open in prep
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </li>
          )
        })}
      </ul>
      <div className="px-5 py-2 border-t border-surface-border text-center">
        <DemoTag />
      </div>
    </div>
  )
}

function RecentActivity() {
  const items = [
    { icon: CheckCircle2, color: 'text-success-600', text: 'Task created for Express Logistics', time: '12m ago' },
    { icon: Sparkles, color: 'text-accent-600', text: 'Brief generated for Edge Communications', time: '38m ago' },
    { icon: FileText, color: 'text-ink-500', text: 'Meeting note logged for Burlington Textiles', time: '1h ago' },
    { icon: Clock, color: 'text-ink-500', text: 'Salesforce sync completed', time: '2h ago' },
  ]
  return (
    <div className="rounded-lg border border-surface-border bg-surface-card shadow-sm overflow-hidden">
      <div className="px-5 py-3.5 border-b border-surface-border">
        <h3 className="text-sm font-semibold text-ink-900">Recent activity</h3>
      </div>
      <ul className="px-5 py-3 space-y-3">
        {items.map((it, i) => {
          const Icon = it.icon
          return (
            <li key={i} className="flex items-start gap-2.5">
              <Icon className={cx('h-4 w-4 mt-0.5 shrink-0', it.color)} />
              <div className="min-w-0 flex-1">
                <div className="text-xs text-ink-700 leading-snug">{it.text}</div>
                <div className="text-2xs text-ink-400">{it.time}</div>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
