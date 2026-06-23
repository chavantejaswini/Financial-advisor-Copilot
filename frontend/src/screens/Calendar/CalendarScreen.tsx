import { useState } from 'react'
import { CalendarDays, Mic, Sparkles } from 'lucide-react'
import type { Client } from '../../types'
import { DEMO_WEEK, type DemoCalEvent } from '../../lib/mock'
import { initials } from '../../lib/format'
import { Badge, DemoTag } from '../../components/ui/Badge'

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
const DAY_DATES = ['Jun 22', 'Jun 23', 'Jun 24', 'Jun 25', 'Jun 26']
const START_HOUR = 8
const END_HOUR = 18
const HOUR_PX = 56

function fmtHour(h: number) {
  const hour = Math.floor(h)
  const min = Math.round((h - hour) * 60)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const h12 = hour % 12 === 0 ? 12 : hour % 12
  return `${h12}:${min.toString().padStart(2, '0')} ${ampm}`
}

const STATUS: Record<DemoCalEvent['status'], { tone: 'success' | 'accent' | 'neutral'; ring: string; bg: string }> = {
  now: { tone: 'success', ring: 'border-success-300', bg: 'bg-success-50' },
  upcoming: { tone: 'accent', ring: 'border-accent-200', bg: 'bg-accent-50' },
  done: { tone: 'neutral', ring: 'border-surface-border-strong', bg: 'bg-surface-sunken' },
}

interface CalendarScreenProps {
  clients: Client[]
  onPrep: (clientId: string) => void
  onJoin: (clientName: string) => void
}

export function CalendarScreen({ clients, onPrep, onJoin }: CalendarScreenProps) {
  const [selected, setSelected] = useState<DemoCalEvent | null>(null)
  const byName = (name: string) => clients.find((c) => c.client_name === name)?.client_id
  const hours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i)

  return (
    <div className="mx-auto max-w-6xl px-5 py-6 space-y-5">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-ink-900">Calendar</h1>
          <p className="text-sm text-ink-500 mt-0.5">Week of June 22 · click a meeting to prep or join.</p>
        </div>
        <DemoTag />
      </div>

      <div className="rounded-lg border border-surface-border bg-surface-card shadow-sm overflow-hidden">
       <div className="overflow-x-auto">
        {/* Day headers */}
        <div className="grid border-b border-surface-border min-w-[680px]" style={{ gridTemplateColumns: `56px repeat(5, 1fr)` }}>
          <div className="border-r border-surface-border" />
          {DAYS.map((d, i) => (
            <div
              key={d}
              className={cx(
                'px-3 py-2.5 text-center border-r border-surface-border last:border-r-0',
                i === 1 && 'bg-accent-50/50',
              )}
            >
              <div className="text-2xs uppercase tracking-wider text-ink-400">{d}</div>
              <div className={cx('text-sm font-semibold', i === 1 ? 'text-accent-700' : 'text-ink-900')}>
                {DAY_DATES[i].split(' ')[1]}
              </div>
            </div>
          ))}
        </div>

        {/* Grid body */}
        <div className="grid min-w-[680px]" style={{ gridTemplateColumns: `56px repeat(5, 1fr)` }}>
          {/* Hour axis */}
          <div className="border-r border-surface-border">
            {hours.map((h) => (
              <div key={h} className="relative text-right pr-2" style={{ height: HOUR_PX }}>
                <span className="absolute -top-1.5 right-2 text-2xs text-ink-400">{fmtHour(h)}</span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          {DAYS.map((_, dayIdx) => (
            <div
              key={dayIdx}
              className={cx('relative border-r border-surface-border last:border-r-0', dayIdx === 1 && 'bg-accent-50/20')}
              style={{ height: HOUR_PX * (END_HOUR - START_HOUR) }}
            >
              {/* hour lines */}
              {hours.slice(0, -1).map((h) => (
                <div key={h} className="border-b border-surface-border/70" style={{ height: HOUR_PX }} />
              ))}

              {/* events */}
              {DEMO_WEEK.filter((e) => e.day === dayIdx).map((e) => {
                const top = (e.start - START_HOUR) * HOUR_PX
                const height = (e.durationMin / 60) * HOUR_PX
                const s = STATUS[e.status]
                return (
                  <button
                    key={e.id}
                    onClick={() => setSelected(e)}
                    aria-label={`${e.clientName}, ${e.type}, ${fmtHour(e.start)}`}
                    className={cx(
                      'absolute left-1 right-1 rounded-md border px-2 py-1 text-left overflow-hidden transition-shadow hover:shadow-md',
                      s.ring,
                      s.bg,
                      selected?.id === e.id && 'ring-2 ring-accent-300',
                    )}
                    style={{ top: top + 1, height: height - 2 }}
                  >
                    <div className="text-2xs font-semibold text-ink-900 truncate leading-tight">{e.clientName}</div>
                    <div className="text-2xs text-ink-500 truncate">{fmtHour(e.start)} · {e.type}</div>
                  </button>
                )
              })}
            </div>
          ))}
        </div>
       </div>
      </div>

      {/* Selected meeting detail */}
      {selected && (
        <div className="rounded-lg border border-surface-border bg-surface-card shadow-sm p-5 animate-slide-up">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy-900 text-xs font-semibold text-white shrink-0">
                {initials(selected.clientName)}
              </span>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-semibold text-ink-900">{selected.clientName}</h3>
                  <Badge tone={STATUS[selected.status].tone} dot={selected.status === 'now'}>
                    {selected.status === 'now' ? 'In progress' : selected.status === 'done' ? 'Completed' : 'Upcoming'}
                  </Badge>
                </div>
                <p className="text-xs text-ink-500 mt-0.5">
                  {selected.type} · {fmtHour(selected.start)} · {selected.durationMin} min
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onJoin(selected.clientName)}
                className="inline-flex items-center gap-1.5 rounded-md border border-surface-border-strong bg-surface-card px-3 py-1.5 text-xs font-medium text-ink-700 hover:bg-surface-sunken"
              >
                <Mic className="h-3.5 w-3.5" /> Join meeting room
              </button>
              {byName(selected.clientName) && (
                <button
                  onClick={() => onPrep(byName(selected.clientName)!)}
                  className="inline-flex items-center gap-1.5 rounded-md bg-accent-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-600"
                >
                  <Sparkles className="h-3.5 w-3.5" /> Generate prep
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {!selected && (
        <div className="flex items-center gap-2 text-2xs text-ink-400">
          <CalendarDays className="h-3.5 w-3.5" /> Select a meeting block to see prep and join options.
        </div>
      )}
    </div>
  )
}
