import { useEffect, useRef, useState } from 'react'
import { AlertCircle } from 'lucide-react'
import type { AgentKey, AgentStatus, Client, ClientContextShape, HealthStatus, PrepResult } from '../../types'
import { fetchPrep } from '../../lib/api'
import { AgentPipeline } from '../../components/agents/AgentPipeline'
import { SyncStatus } from '../../components/crm/SyncStatus'
import type { SyncState } from '../../components/crm/SyncStatus'
import { SkeletonText } from '../../components/ui/Skeleton'
import { PrepSetup } from './PrepSetup'
import { PrepEmptyState } from './PrepEmptyState'
import { ClientSummaryHeader } from './ClientSummaryHeader'
import { BriefView } from './BriefView'
import { ActionCenter } from './ActionCenter'

const IDLE: Record<AgentKey, AgentStatus> = { access: 'idle', connection: 'idle', summary: 'idle' }

interface MeetingPrepScreenProps {
  clients: Client[]
  loadingClients: boolean
  health: HealthStatus | null
  clientId: string
  onClientChange: (id: string) => void
  notes: string
  onNotesChange: (v: string) => void
  model: string
  onModelChange: (v: string) => void
}

export function MeetingPrepScreen({
  clients,
  loadingClients,
  health,
  clientId,
  onClientChange,
  notes,
  onNotesChange,
  model,
  onModelChange,
}: MeetingPrepScreenProps) {
  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState<PrepResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [statuses, setStatuses] = useState<Record<AgentKey, AgentStatus>>(IDLE)
  const [generatedAt, setGeneratedAt] = useState<Date>(() => new Date())
  const timers = useRef<number[]>([])

  function clearTimers() {
    timers.current.forEach((t) => window.clearTimeout(t))
    timers.current = []
  }
  useEffect(() => () => clearTimers(), [])

  const syncState: SyncState = health?.salesforce_configured ? 'synced' : 'offline'

  async function handleGenerate() {
    if (!clientId) return
    setError(null)
    setResult(null)
    setGenerating(true)
    setStatuses({ access: 'running', connection: 'idle', summary: 'idle' })

    // Reflect the real pipeline order (Access → Connection → Summary) while the
    // single /api/prep call is in flight, so the advisor sees which stage is active.
    clearTimers()
    timers.current.push(
      window.setTimeout(() => setStatuses((s) => ({ ...s, access: 'done', connection: 'running' })), 800),
    )
    timers.current.push(
      window.setTimeout(() => setStatuses((s) => ({ ...s, connection: 'done', summary: 'running' })), 1900),
    )

    try {
      const data = await fetchPrep(clientId, model, notes)
      clearTimers()
      setStatuses({ access: 'done', connection: 'done', summary: 'done' })
      setGeneratedAt(new Date())
      setResult(data)
    } catch (e) {
      clearTimers()
      setStatuses((s) => {
        const next = { ...s }
        const running = (Object.keys(next) as AgentKey[]).find((k) => next[k] === 'running') ?? 'summary'
        next[running] = 'error'
        return next
      })
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setGenerating(false)
    }
  }

  const context = (result?.client_context ?? {}) as ClientContextShape
  const started = generating || result || error

  return (
    <div className="mx-auto max-w-6xl px-5 py-6 space-y-5">
      {/* Header */}
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-ink-900">Meeting Prep</h1>
          <p className="text-sm text-ink-500 mt-0.5">
            Multi-agent brief with human-in-the-loop CRM actions.
          </p>
        </div>
        <SyncStatus
          state={syncState}
          lastUpdated={health?.salesforce_instance ? 'live' : undefined}
        />
      </div>

      <PrepSetup
        clients={clients}
        loadingClients={loadingClients}
        clientId={clientId}
        onClientChange={onClientChange}
        notes={notes}
        onNotesChange={onNotesChange}
        model={model}
        onModelChange={onModelChange}
        onGenerate={handleGenerate}
        generating={generating}
      />

      {/* Pipeline appears as soon as a run starts */}
      {started && <AgentPipeline statuses={statuses} />}

      {error && (
        <div className="flex items-start gap-2.5 rounded-lg border border-danger-200 bg-danger-50 p-4 text-sm text-danger-700 animate-fade-in">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <div>
            <div className="font-medium">Could not generate the brief</div>
            <div className="mt-0.5">{error}</div>
          </div>
        </div>
      )}

      {/* Loading skeleton */}
      {generating && !result && (
        <div className="grid gap-4 lg:grid-cols-3 animate-fade-in">
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-lg border border-surface-border bg-surface-card p-5 shadow-sm">
              <SkeletonText lines={3} />
            </div>
            <div className="rounded-lg border border-surface-border bg-surface-card p-5 shadow-sm">
              <SkeletonText lines={4} />
            </div>
          </div>
          <div className="rounded-lg border border-surface-border bg-surface-card p-5 shadow-sm">
            <SkeletonText lines={5} />
          </div>
        </div>
      )}

      {/* Results */}
      {result && !generating && (
        <div className="space-y-5 animate-slide-up">
          <ClientSummaryHeader context={context} />
          <div className="grid gap-5 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <BriefView
                summary={result.summary_output}
                connection={result.connection_output}
                generatedAt={generatedAt}
              />
            </div>
            <div className="lg:col-span-1">
              <div className="lg:sticky lg:top-5">
                <ActionCenter
                  summary={result.summary_output}
                  instanceUrl={health?.salesforce_instance}
                  generatedAt={generatedAt}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty (first load) */}
      {!started && <PrepEmptyState />}
    </div>
  )
}
