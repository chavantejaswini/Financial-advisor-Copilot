import { Bot, CircleSlash, Zap } from 'lucide-react'
import type { SummaryOutput } from '../../types'
import { Badge } from '../../components/ui/Badge'
import { ApprovalCard } from '../../components/crm/ApprovalCard'

export function ActionCenter({
  summary,
  instanceUrl,
  generatedAt,
}: {
  summary: SummaryOutput
  instanceUrl?: string | null
  generatedAt: Date
}) {
  const actions = summary.actions_taken ?? []
  const af = summary.agentforce_response

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-accent-500" />
          <h3 className="text-sm font-semibold text-ink-900">Action Center</h3>
          {actions.length > 0 && <Badge tone="accent">{actions.length} action{actions.length > 1 ? 's' : ''}</Badge>}
        </div>
        <span className="text-2xs text-ink-400">
          Mode: <span className="font-medium text-ink-500">{summary.mode ?? 'csv-fallback'}</span>
        </span>
      </div>

      {actions.length === 0 && !af ? (
        <div className="rounded-lg border border-dashed border-surface-border-strong bg-surface-base p-6 text-center">
          <CircleSlash className="mx-auto h-6 w-6 text-ink-300 mb-2" />
          <p className="text-sm font-medium text-ink-700">No CRM actions this run</p>
          <p className="text-xs text-ink-500 mt-1 max-w-sm mx-auto">
            Add an instruction to the advisor note — e.g.{' '}
            <em className="text-ink-600">“create a task to send the ESG comparison by Friday”</em> — and re-run to see
            the Summary Agent execute live Salesforce writes here, each requiring your sign-off.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {actions.map((a, i) => (
            <ApprovalCard key={i} action={a} instanceUrl={instanceUrl} generatedAt={generatedAt} />
          ))}

          {af && (
            <div className="rounded-lg border border-violet-200 bg-violet-50/50 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Bot className="h-4 w-4 text-violet-600" />
                <h4 className="text-sm font-semibold text-violet-700">Agentforce (parallel SF-native agent)</h4>
              </div>
              {af.error ? (
                <p className="text-sm text-danger-700">{af.error}</p>
              ) : (
                <>
                  <p className="text-sm leading-relaxed text-ink-700">{af.reply}</p>
                  {af.session_id && (
                    <p className="mt-2 text-2xs text-violet-600">
                      Session <code>{af.session_id}</code>
                    </p>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
