import { CalendarClock, Circle, Clock, Mail, Phone, StickyNote } from 'lucide-react'
import type { ClientContextShape } from '../../types'
import { formatDate } from '../../lib/format'
import { Badge } from '../../components/ui/Badge'

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

function noteIcon(type: string) {
  const t = type.toLowerCase()
  if (t.includes('call')) return Phone
  if (t.includes('email')) return Mail
  if (t.includes('meeting')) return CalendarClock
  return StickyNote
}

function priorityTone(p: string): 'danger' | 'warning' | 'neutral' {
  const v = p.toLowerCase()
  if (v === 'high') return 'danger'
  if (v === 'normal') return 'warning'
  return 'neutral'
}

export function ActivityPanel({ context }: { context: ClientContextShape }) {
  const notes = context.crm_notes ?? []
  const tasks = context.open_tasks ?? []

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {/* Meeting / CRM timeline */}
      <div className="rounded-lg border border-surface-border bg-surface-card shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-surface-border">
          <h3 className="text-sm font-semibold text-ink-900">Activity timeline</h3>
          <span className="text-2xs text-ink-400">Completed CRM history</span>
        </div>
        {notes.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-ink-400">No past activity logged.</div>
        ) : (
          <ol className="relative px-5 py-4">
            <span className="absolute left-[1.85rem] top-6 bottom-6 w-px bg-surface-border" aria-hidden />
            {notes.map((n, i) => {
              const Icon = noteIcon(n.note_type ?? '')
              return (
                <li key={n.note_id ?? i} className="relative flex gap-3 pb-4 last:pb-0">
                  <span className="relative z-10 flex h-7 w-7 items-center justify-center rounded-full border border-surface-border bg-surface-card text-ink-500 shrink-0">
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0 pt-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-ink-900">{n.summary || 'Activity'}</span>
                      {n.note_type && <Badge tone="neutral">{n.note_type}</Badge>}
                    </div>
                    <div className="text-2xs text-ink-400 mt-0.5">{formatDate(n.note_date)}</div>
                    {n.details && <p className="text-xs text-ink-600 mt-1 leading-relaxed">{n.details}</p>}
                  </div>
                </li>
              )
            })}
          </ol>
        )}
      </div>

      {/* Open tasks */}
      <div className="rounded-lg border border-surface-border bg-surface-card shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-surface-border">
          <h3 className="text-sm font-semibold text-ink-900">Open tasks</h3>
          <Badge tone={tasks.length ? 'accent' : 'neutral'}>{tasks.length} open</Badge>
        </div>
        {tasks.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-ink-400">No open tasks. You’re all caught up.</div>
        ) : (
          <ul className="divide-y divide-surface-border">
            {tasks.map((t, i) => {
              const started = (t.status ?? '').toLowerCase() === 'in progress'
              return (
                <li key={t.task_id ?? i} className="flex items-start gap-3 px-5 py-3">
                  <span className={cx('mt-0.5 shrink-0', started ? 'text-accent-500' : 'text-ink-300')}>
                    {started ? <Clock className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-ink-900">{t.subject || 'Task'}</div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap text-2xs text-ink-400">
                      {t.due && (
                        <span className="inline-flex items-center gap-1">
                          <CalendarClock className="h-3 w-3" /> Due {formatDate(t.due)}
                        </span>
                      )}
                      {t.status && <Badge tone="neutral">{t.status}</Badge>}
                      {t.priority && <Badge tone={priorityTone(t.priority)}>{t.priority}</Badge>}
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
