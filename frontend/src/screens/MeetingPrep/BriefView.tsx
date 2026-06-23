import { AlertTriangle } from 'lucide-react'
import type { ConnectionOutput, SummaryOutput } from '../../types'
import { deriveConfidence } from '../../lib/format'
import { AIOutputCard } from '../../components/ai/AIOutputCard'

function BulletList({ items, empty }: { items?: string[]; empty: string }) {
  const list = (items ?? []).filter(Boolean)
  if (list.length === 0) return <p className="text-sm italic text-ink-400">{empty}</p>
  return (
    <ul className="space-y-2">
      {list.map((s, i) => (
        <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-ink-700">
          <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-accent-400 shrink-0" />
          <span>{s}</span>
        </li>
      ))}
    </ul>
  )
}

export function BriefView({
  summary,
  connection,
  generatedAt,
}: {
  summary: SummaryOutput
  connection: ConnectionOutput
  generatedAt: Date
}) {
  if (summary.error) {
    return (
      <div className="rounded-lg border border-danger-200 bg-danger-50 p-4 text-sm text-danger-700">
        <div className="font-medium mb-1">The Summary Agent could not complete the brief.</div>
        {summary.error}
      </div>
    )
  }

  const signals = summary.key_financial_or_relationship_signals
  const risks = summary.potential_risks_or_opportunities
  const topics = summary.suggested_discussion_topics
  const actions = summary.recommended_next_best_actions
  const review = (summary.confidence_notes_or_human_review ?? []).filter(Boolean)
  const relationships = connection.relationships

  return (
    <div className="space-y-4">
      {/* Executive summary */}
      <AIOutputCard
        title="Client summary"
        agent="summary"
        generatedAt={generatedAt}
        confidence={deriveConfidence(summary.client_summary ?? '')}
        rawText={summary.client_summary ?? ''}
      >
        <p className="text-sm leading-relaxed text-ink-700">{summary.client_summary || '—'}</p>
      </AIOutputCard>

      <div className="grid gap-4 lg:grid-cols-2 lg:auto-rows-fr">
        <AIOutputCard
          title="Key signals"
          agent="summary"
          generatedAt={generatedAt}
          confidence={deriveConfidence((signals ?? []).join(' '))}
          rawText={(signals ?? []).join('\n')}
        >
          <BulletList items={signals} empty="No key signals identified." />
        </AIOutputCard>

        <AIOutputCard
          title="Risks & opportunities"
          agent="summary"
          generatedAt={generatedAt}
          confidence={deriveConfidence((risks ?? []).join(' '))}
          rawText={(risks ?? []).join('\n')}
        >
          <BulletList items={risks} empty="None identified." />
        </AIOutputCard>

        <AIOutputCard
          title="Suggested discussion topics"
          agent="summary"
          generatedAt={generatedAt}
          confidence={deriveConfidence((topics ?? []).join(' '))}
          rawText={(topics ?? []).join('\n')}
        >
          <BulletList items={topics} empty="None suggested." />
        </AIOutputCard>

        <AIOutputCard
          title="Recommended next-best actions"
          agent="summary"
          generatedAt={generatedAt}
          confidence={deriveConfidence((actions ?? []).join(' '))}
          rawText={(actions ?? []).join('\n')}
        >
          <BulletList items={actions} empty="None recommended." />
        </AIOutputCard>
      </div>

      {/* Connection agent — relationships */}
      <AIOutputCard
        title="Cross-cutting relationships"
        agent="connection"
        generatedAt={generatedAt}
        confidence={deriveConfidence((relationships ?? []).join(' '))}
        rawText={(relationships ?? []).join('\n')}
      >
        <BulletList items={relationships} empty="No relationships identified." />
      </AIOutputCard>

      {/* Self-flagged human review — never approvable, this is the AI asking for oversight */}
      {review.length > 0 && (
        <section className="rounded-lg border border-warning-200 bg-warning-50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-warning-600" />
            <h3 className="text-sm font-semibold text-warning-700">Flagged for human review</h3>
          </div>
          <ul className="space-y-1.5">
            {review.map((c, i) => (
              <li key={i} className="flex gap-2 text-sm text-warning-700">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-warning-500 shrink-0" />
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
