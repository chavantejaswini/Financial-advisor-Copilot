import { useState } from 'react'
import type { PrepResult, SummaryOutput } from './types'

function ListBlock({ items, empty = 'None identified.' }: { items: string[] | undefined; empty?: string }) {
  const list = items?.filter(Boolean) ?? []
  if (list.length === 0) {
    return <p className="text-slate-500 text-sm italic">{empty}</p>
  }
  return (
    <ul className="list-disc list-inside text-slate-300 text-sm space-y-1">
      {list.map((s, i) => (
        <li key={i}>{s}</li>
      ))}
    </ul>
  )
}

function MeetingPrepTab({ summary }: { summary: SummaryOutput }) {
  if (summary.error) {
    return (
      <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
        {summary.error}
      </div>
    )
  }
  return (
    <div className="space-y-6">
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Client summary</h3>
        <p className="text-slate-300 text-sm leading-relaxed">{summary.client_summary || '—'}</p>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-lg bg-slate-800/50 border border-slate-700/60 p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Key signals</h3>
          <ListBlock items={summary.key_financial_or_relationship_signals} empty="No key signals identified." />
        </div>
        <div className="rounded-lg bg-slate-800/50 border border-slate-700/60 p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Suggested discussion topics</h3>
          <ListBlock items={summary.suggested_discussion_topics} empty="None suggested." />
        </div>
        <div className="rounded-lg bg-slate-800/50 border border-slate-700/60 p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Risks & opportunities</h3>
          <ListBlock items={summary.potential_risks_or_opportunities} />
        </div>
        <div className="rounded-lg bg-slate-800/50 border border-slate-700/60 p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Next-best actions</h3>
          <ListBlock items={summary.recommended_next_best_actions} empty="None recommended." />
        </div>
      </div>

      {(summary.confidence_notes_or_human_review?.length ?? 0) > 0 && (
        <section className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-400/90 mb-2">Confidence / human review</h3>
          <ul className="space-y-1 text-sm text-amber-200/90">
            {summary.confidence_notes_or_human_review!.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

interface ResultViewProps {
  result: PrepResult
  className?: string
}

export function ResultView({ result, className = '' }: ResultViewProps) {
  const [tab, setTab] = useState<'prep' | 'relationships' | 'raw'>('prep')
  const { summary_output, connection_output, client_context } = result
  const name = summary_output.client_name ?? 'Client'

  const tabs = [
    { id: 'prep' as const, label: 'Meeting prep' },
    { id: 'relationships' as const, label: 'Relationships' },
    { id: 'raw' as const, label: 'Raw context' },
  ]

  return (
    <div className={className}>
      <div className="mb-6 p-4 rounded-lg bg-primary-500/10 border border-primary-500/30 text-primary-200 text-sm">
        Meeting prep ready for <strong className="text-white">{name}</strong>.
      </div>

      <div className="flex gap-1 border-b border-slate-700/60 mb-6">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
              tab === t.id
                ? 'bg-slate-800/80 text-white border border-slate-700/60 border-b-0 -mb-px'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'prep' && <MeetingPrepTab summary={summary_output} />}
      {tab === 'relationships' && (
        <section>
          <ListBlock
            items={connection_output.relationships}
            empty="No relationships identified."
          />
        </section>
      )}
      {tab === 'raw' && (
        <pre className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/60 text-xs text-slate-400 overflow-auto max-h-[70vh]">
          {JSON.stringify(
            {
              client_profile: client_context.client_profile,
              crm_notes: client_context.crm_notes,
              portfolio_activity: client_context.portfolio_activity,
              client_goals: client_context.client_goals,
              compliance_considerations: client_context.compliance_considerations,
              market_updates_sample: Array.isArray(client_context.market_updates) ? client_context.market_updates.slice(0, 3) : [],
            },
            null,
            2
          )}
        </pre>
      )}
    </div>
  )
}
