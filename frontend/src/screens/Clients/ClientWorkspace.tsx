import { useEffect, useRef, useState } from 'react'
import { AlertCircle, ArrowLeft, Sparkles } from 'lucide-react'
import type { Client, ClientContextShape, PrepResult } from '../../types'
import { fetchPrep } from '../../lib/api'
import { Button } from '../../components/ui/Button'
import { SkeletonText } from '../../components/ui/Skeleton'
import { ClientSummaryHeader } from '../MeetingPrep/ClientSummaryHeader'
import { BriefView } from '../MeetingPrep/BriefView'
import { PortfolioCard } from './PortfolioCard'
import { GoalsCard } from './GoalsCard'
import { ActivityPanel } from './ActivityPanel'

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

type Tab = 'overview' | 'activity' | 'insights'
const TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'activity', label: 'Activity' },
  { id: 'insights', label: 'AI Insights' },
]

interface ClientWorkspaceProps {
  client: Client
  model: string
  onBack: () => void
  onPrep: (clientId: string) => void
}

export function ClientWorkspace({ client, model, onBack, onPrep }: ClientWorkspaceProps) {
  const [result, setResult] = useState<PrepResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('overview')
  const generatedAt = useRef<Date>(new Date())

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    setResult(null)
    setTab('overview')
    fetchPrep(client.client_id, model, null)
      .then((data) => {
        if (cancelled) return
        generatedAt.current = new Date()
        setResult(data)
      })
      .catch((e) => !cancelled && setError(e instanceof Error ? e.message : 'Failed to load client'))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [client.client_id, model])

  const context = (result?.client_context ?? {}) as ClientContextShape

  return (
    <div className="mx-auto max-w-6xl px-5 py-6 space-y-5">
      {/* Back + actions */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-ink-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> All clients
        </button>
        <Button
          variant="primary"
          icon={<Sparkles className="h-4 w-4" />}
          onClick={() => onPrep(client.client_id)}
        >
          Prepare meeting
        </Button>
      </div>

      {loading && (
        <div className="space-y-5 animate-fade-in">
          <div className="rounded-lg border border-surface-border bg-surface-card p-5 shadow-sm">
            <SkeletonText lines={2} />
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="rounded-lg border border-surface-border bg-surface-card p-5 shadow-sm">
              <SkeletonText lines={5} />
            </div>
            <div className="rounded-lg border border-surface-border bg-surface-card p-5 shadow-sm">
              <SkeletonText lines={5} />
            </div>
          </div>
        </div>
      )}

      {error && !loading && (
        <div className="flex items-start gap-2.5 rounded-lg border border-danger-200 bg-danger-50 p-4 text-sm text-danger-700">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <div>
            <div className="font-medium">Could not load {client.client_name}</div>
            <div className="mt-0.5">{error}</div>
          </div>
        </div>
      )}

      {result && !loading && (
        <div className="space-y-5 animate-slide-up">
          <ClientSummaryHeader context={context} />

          {/* Tabs */}
          <div className="flex items-center gap-1 border-b border-surface-border">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cx(
                  'relative px-3.5 py-2 text-sm font-medium transition-colors',
                  tab === t.id ? 'text-ink-900' : 'text-ink-500 hover:text-ink-700',
                )}
              >
                {t.label}
                {tab === t.id && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-accent-500" />}
              </button>
            ))}
          </div>

          {tab === 'overview' && (
            <div className="grid gap-5 lg:grid-cols-2 animate-fade-in">
              <PortfolioCard />
              <GoalsCard context={context} />
            </div>
          )}

          {tab === 'activity' && (
            <div className="animate-fade-in">
              <ActivityPanel context={context} />
            </div>
          )}

          {tab === 'insights' && (
            <div className="animate-fade-in">
              <BriefView
                summary={result.summary_output}
                connection={result.connection_output}
                generatedAt={generatedAt.current}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
