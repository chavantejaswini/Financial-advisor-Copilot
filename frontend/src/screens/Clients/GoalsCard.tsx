import { Target } from 'lucide-react'
import type { ClientContextShape } from '../../types'
import { formatCurrency, formatDate, stageProgress } from '../../lib/format'
import { Badge } from '../../components/ui/Badge'

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

function stageTone(stage: string): 'success' | 'accent' | 'warning' | 'neutral' {
  const s = stage.toLowerCase()
  if (s.includes('won')) return 'success'
  if (s.includes('lost')) return 'neutral'
  if (s.includes('negotiation') || s.includes('proposal') || s.includes('value')) return 'accent'
  return 'warning'
}

export function GoalsCard({ context }: { context: ClientContextShape }) {
  const goals = context.client_goals ?? []

  return (
    <div className="rounded-lg border border-surface-border bg-surface-card shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-surface-border">
        <h3 className="text-sm font-semibold text-ink-900">Financial goals</h3>
        <span className="text-2xs text-ink-400">From Salesforce Opportunities</span>
      </div>

      {goals.length === 0 ? (
        <div className="px-5 py-8 text-center text-sm text-ink-400">No goals recorded for this client.</div>
      ) : (
        <ul className="divide-y divide-surface-border">
          {goals.map((g, i) => {
            const stage = g.status ?? ''
            const progress = stageProgress(stage)
            return (
              <li key={g.goal_id ?? i} className="px-5 py-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <span className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-md bg-surface-sunken text-ink-500 shrink-0">
                      <Target className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-ink-900">{g.goal_name || 'Goal'}</div>
                      <div className="text-2xs text-ink-400 mt-0.5">
                        {g.target_date ? `Target ${formatDate(g.target_date)}` : 'No target date'}
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-semibold text-ink-900 tnum">{formatCurrency(g.target_amount)}</div>
                    {stage && (
                      <div className="mt-1">
                        <Badge tone={stageTone(stage)}>{stage}</Badge>
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-sunken">
                  <div
                    className={cx(
                      'h-full rounded-full',
                      stageTone(stage) === 'success' ? 'bg-success-500' : 'bg-accent-500',
                    )}
                    style={{ width: `${Math.round(progress * 100)}%` }}
                  />
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
