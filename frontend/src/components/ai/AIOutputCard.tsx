import { useState } from 'react'
import type { ReactNode } from 'react'
import { Check, Pencil, ThumbsDown } from 'lucide-react'
import type { AgentKey, ApprovalDecision } from '../../types'
import type { Confidence } from '../../lib/format'
import { AGENTS } from '../agents/agents'
import { ConfidenceMeter } from './ConfidenceMeter'
import { Badge } from '../ui/Badge'

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

interface AIOutputCardProps {
  title: string
  agent: AgentKey
  generatedAt: Date
  confidence?: Confidence
  children: ReactNode
  /** plain-text version shown in the edit box when the advisor modifies the output */
  rawText?: string
  /** show the Modify / Flag / Approve footer */
  approvable?: boolean
}

const DECISION_BADGE: Record<Exclude<ApprovalDecision, 'pending'>, { tone: 'success' | 'danger' | 'accent'; label: string }> = {
  approved: { tone: 'success', label: 'Approved' },
  rejected: { tone: 'danger', label: 'Flagged' },
  modified: { tone: 'accent', label: 'Edited' },
}

export function AIOutputCard({
  title,
  agent,
  generatedAt,
  confidence,
  children,
  rawText,
  approvable = true,
}: AIOutputCardProps) {
  const meta = AGENTS[agent]
  const [decision, setDecision] = useState<ApprovalDecision>('pending')
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(rawText ?? '')
  const [edited, setEdited] = useState(false)

  const timestamp = generatedAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

  return (
    <section
      className={cx(
        'flex h-full flex-col rounded-lg border bg-surface-card shadow-sm overflow-hidden transition-colors',
        decision === 'approved' && 'border-success-200',
        decision === 'rejected' && 'border-danger-200',
        decision === 'pending' && 'border-surface-border',
      )}
    >
      <header className="flex items-start justify-between gap-3 px-4 py-3 border-b border-surface-border bg-surface-base/60">
        <h3 className="text-sm font-semibold text-ink-900 leading-snug">{title}</h3>
        <div className="flex items-center gap-2 shrink-0 pt-0.5">
          {confidence && <ConfidenceMeter confidence={confidence} />}
          {decision !== 'pending' && (
            <Badge tone={DECISION_BADGE[decision].tone}>{DECISION_BADGE[decision].label}</Badge>
          )}
        </div>
      </header>

      <div className="flex-1 px-4 py-3.5">
        {editing ? (
          <div>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={Math.max(4, Math.min(12, draft.split('\n').length + 1))}
              className="w-full rounded-md border border-accent-300 bg-white px-3 py-2 text-sm text-ink-900 shadow-focus-accent focus:outline-none resize-y"
              aria-label={`Edit ${title}`}
            />
            <div className="mt-2 flex justify-end gap-2">
              <button
                onClick={() => {
                  setEditing(false)
                  setDraft(rawText ?? '')
                }}
                className="text-xs font-medium text-ink-500 hover:text-ink-700 px-2 py-1"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setEditing(false)
                  setEdited(true)
                  setDecision('modified')
                }}
                className="inline-flex items-center gap-1.5 rounded-md bg-accent-500 px-2.5 py-1 text-xs font-medium text-white hover:bg-accent-600"
              >
                <Check className="h-3.5 w-3.5" /> Save edit
              </button>
            </div>
          </div>
        ) : edited ? (
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-700">{draft}</p>
        ) : (
          children
        )}
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 py-2 border-t border-surface-border bg-surface-base/40">
        <span className="text-2xs text-ink-400 whitespace-nowrap">
          <span className={cx('font-medium', meta.color)}>{meta.name}</span> · AI generated · {timestamp}
        </span>

        {approvable && (
          <div className="flex items-center gap-1.5">
            {rawText != null && (
              <button
                onClick={() => setEditing((v) => !v)}
                className="inline-flex items-center gap-1 rounded-md border border-surface-border-strong bg-surface-card px-2 py-1 text-2xs font-medium text-ink-600 hover:bg-surface-sunken transition-colors"
              >
                <Pencil className="h-3 w-3" /> Modify
              </button>
            )}
            <button
              onClick={() => setDecision(decision === 'rejected' ? 'pending' : 'rejected')}
              className={cx(
                'inline-flex items-center gap-1 rounded-md border px-2 py-1 text-2xs font-medium transition-colors',
                decision === 'rejected'
                  ? 'border-danger-200 bg-danger-50 text-danger-600'
                  : 'border-surface-border-strong bg-surface-card text-ink-600 hover:border-danger-200 hover:text-danger-600',
              )}
            >
              <ThumbsDown className="h-3 w-3" /> Flag
            </button>
            <button
              onClick={() => setDecision(decision === 'approved' ? 'pending' : 'approved')}
              className={cx(
                'inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-2xs font-semibold transition-colors',
                decision === 'approved'
                  ? 'border-success-500 bg-success-500 text-white'
                  : 'border-success-200 bg-success-50 text-success-700 hover:bg-success-100',
              )}
            >
              {decision === 'approved' && <Check className="h-3 w-3" />}
              {decision === 'approved' ? 'Approved' : 'Approve'}
            </button>
          </div>
        )}
      </footer>
    </section>
  )
}
