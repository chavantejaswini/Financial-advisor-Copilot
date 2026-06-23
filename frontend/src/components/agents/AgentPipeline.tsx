import { Check, ChevronRight, Loader2 } from 'lucide-react'
import type { AgentKey, AgentStatus } from '../../types'
import { AGENT_ORDER, AGENTS } from './agents'

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

interface AgentPipelineProps {
  statuses: Record<AgentKey, AgentStatus>
  className?: string
}

function StatusDot({ status }: { status: AgentStatus }) {
  if (status === 'done')
    return (
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-success-500 text-white">
        <Check className="h-3 w-3" strokeWidth={3} />
      </span>
    )
  if (status === 'running')
    return (
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent-500 text-white animate-pulse-ring">
        <Loader2 className="h-3 w-3 animate-spin" />
      </span>
    )
  if (status === 'error')
    return <span className="flex h-5 w-5 items-center justify-center rounded-full bg-danger-500 text-white text-2xs font-bold">!</span>
  return <span className="h-5 w-5 rounded-full border-2 border-surface-border-strong" />
}

/**
 * Horizontal pipeline showing Access → Connection → Summary and the live
 * status of each agent. Communicates the multi-agent architecture at a glance.
 */
export function AgentPipeline({ statuses, className }: AgentPipelineProps) {
  return (
    <div className={cx('flex items-stretch gap-2', className)}>
      {AGENT_ORDER.map((key, i) => {
        const meta = AGENTS[key]
        const status = statuses[key]
        const Icon = meta.icon
        const active = status === 'running'
        const done = status === 'done'
        return (
          <div key={key} className="flex items-stretch gap-2 flex-1">
            <div
              className={cx(
                'flex-1 rounded-lg border bg-surface-card px-3 py-2.5 transition-colors',
                active ? 'border-accent-300 ring-2 ring-accent-100' : 'border-surface-border',
                done && 'border-success-200',
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={cx('flex h-7 w-7 items-center justify-center rounded-md shrink-0', meta.tint)}>
                    <Icon className={cx('h-4 w-4', meta.color)} />
                  </span>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-ink-900 truncate">{meta.name}</div>
                    <div className="text-2xs text-ink-400">{meta.role}</div>
                  </div>
                </div>
                <StatusDot status={status} />
              </div>
            </div>
            {i < AGENT_ORDER.length - 1 && (
              <div className="flex items-center text-ink-300">
                <ChevronRight className="h-4 w-4" />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
