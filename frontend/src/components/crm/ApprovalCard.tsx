import { useState } from 'react'
import {
  ArrowUpRight,
  Check,
  ClipboardList,
  Clock,
  Database,
  FileText,
  Search,
  ShieldCheck,
  ThumbsDown,
} from 'lucide-react'
import type { CrmAction } from '../../types'
import { salesforceRecordUrl } from '../../lib/api'
import { formatDate, titleCaseTool } from '../../lib/format'
import { Badge } from '../ui/Badge'
import { AGENTS } from '../agents/agents'

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

const WRITE_TOOLS = new Set(['create_followup_task', 'log_meeting_note'])

const TOOL_ICON: Record<string, typeof FileText> = {
  create_followup_task: ClipboardList,
  log_meeting_note: FileText,
  soql_query: Search,
  get_account_summary: Database,
}

function parseResult(result: string | null): Record<string, unknown> | string | null {
  if (!result) return null
  try {
    return JSON.parse(result)
  } catch {
    return result
  }
}

/** Turn the tool + args into a plain-English description of what the agent did. */
function describe(action: CrmAction): string {
  const a = action.input || {}
  const due = a.due_date ? ` due ${formatDate(String(a.due_date))}` : ''
  switch (action.tool) {
    case 'create_followup_task':
      return `Create a follow-up task “${a.subject ?? ''}” for ${a.client_name_or_id ?? 'the client'}${due}.`
    case 'log_meeting_note':
      return `Log a meeting note “${a.subject ?? ''}” against ${a.client_name_or_id ?? 'the client'}.`
    case 'get_account_summary':
      return `Read the full CRM summary for ${a.client_name_or_id ?? 'the client'}.`
    case 'soql_query':
      return `Run a read-only SOQL query against Salesforce.`
    default:
      return titleCaseTool(action.tool)
  }
}

interface ApprovalCardProps {
  action: CrmAction
  instanceUrl?: string | null
  generatedAt: Date
}

export function ApprovalCard({ action, instanceUrl, generatedAt }: ApprovalCardProps) {
  const [decision, setDecision] = useState<'pending' | 'approved' | 'flagged'>('pending')
  const [showDetail, setShowDetail] = useState(false)

  const parsed = parseResult(action.result)
  const isWrite = WRITE_TOOLS.has(action.tool)
  const Icon = TOOL_ICON[action.tool] ?? Database
  const meta = AGENTS.summary

  const recordId =
    parsed && typeof parsed === 'object' && 'id' in parsed ? String((parsed as Record<string, unknown>).id ?? '') : ''
  const errored = parsed && typeof parsed === 'object' && 'error' in parsed
  const recordUrl = salesforceRecordUrl(instanceUrl, recordId)
  const timestamp = generatedAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

  return (
    <div
      className={cx(
        'rounded-lg border bg-surface-card shadow-sm overflow-hidden',
        decision === 'approved' && 'border-success-200',
        decision === 'flagged' && 'border-danger-200',
        decision === 'pending' && (errored ? 'border-danger-200' : 'border-surface-border'),
      )}
    >
      <div className="px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <span className={cx('flex h-9 w-9 items-center justify-center rounded-md shrink-0', meta.tint)}>
              <Icon className={cx('h-4 w-4', meta.color)} />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-ink-900">{titleCaseTool(action.tool)}</span>
                <Badge tone={isWrite ? 'accent' : 'neutral'}>{isWrite ? 'Write action' : 'Read action'}</Badge>
              </div>
              <p className="text-sm text-ink-700 mt-0.5">{describe(action)}</p>
            </div>
          </div>
        </div>

        {/* Salesforce result */}
        <div className="mt-3 flex items-center gap-2 flex-wrap">
          {errored ? (
            <Badge tone="danger" dot>
              Salesforce error
            </Badge>
          ) : isWrite ? (
            <Badge tone="success" icon={<ShieldCheck className="h-3 w-3" />}>
              Executed in Salesforce
            </Badge>
          ) : (
            <Badge tone="neutral" dot>
              Completed
            </Badge>
          )}
          {recordUrl && (
            <a
              href={recordUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-2xs font-medium text-accent-600 hover:text-accent-700 hover:underline"
            >
              Open record {recordId.slice(0, 6)}… <ArrowUpRight className="h-3 w-3" />
            </a>
          )}
          <button
            onClick={() => setShowDetail((v) => !v)}
            className="text-2xs font-medium text-ink-500 hover:text-ink-700 ml-auto"
          >
            {showDetail ? 'Hide' : 'View'} payload
          </button>
        </div>

        {showDetail && (
          <div className="mt-3 grid gap-3 sm:grid-cols-2 animate-slide-down">
            <div>
              <div className="text-2xs font-semibold uppercase tracking-wider text-ink-400 mb-1">Arguments</div>
              <pre className="text-2xs text-ink-700 bg-surface-sunken rounded-md p-2.5 overflow-auto max-h-44">
                {JSON.stringify(action.input, null, 2)}
              </pre>
            </div>
            <div>
              <div className="text-2xs font-semibold uppercase tracking-wider text-ink-400 mb-1">
                Salesforce response
              </div>
              <pre
                className={cx(
                  'text-2xs rounded-md p-2.5 overflow-auto max-h-44 bg-surface-sunken',
                  errored ? 'text-danger-700' : 'text-success-700',
                )}
              >
                {typeof parsed === 'string' ? parsed : JSON.stringify(parsed, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* Audit trail */}
      <div className="px-4 py-2 border-t border-surface-border bg-surface-base/50 flex items-center gap-x-4 gap-y-1 flex-wrap text-2xs text-ink-400">
        <span className={cx('inline-flex items-center gap-1 font-medium', meta.color)}>
          <Database className="h-3 w-3" /> {meta.name}
        </span>
        <span className="inline-flex items-center gap-1">
          <Clock className="h-3 w-3" /> {timestamp}
        </span>
        <span>Source: LangChain tool · v1</span>
        <span>
          Status:{' '}
          <span
            className={cx(
              'font-medium',
              decision === 'approved' ? 'text-success-600' : decision === 'flagged' ? 'text-danger-600' : 'text-ink-500',
            )}
          >
            {decision === 'pending' ? 'Awaiting sign-off' : decision === 'approved' ? 'Approved' : 'Flagged for reversal'}
          </span>
        </span>
      </div>

      {/* Decision controls */}
      <div className="px-4 py-2 border-t border-surface-border flex items-center justify-end gap-1.5">
        <button
          onClick={() => setDecision(decision === 'flagged' ? 'pending' : 'flagged')}
          className={cx(
            'inline-flex items-center gap-1 rounded-md border px-2 py-1 text-2xs font-medium transition-colors',
            decision === 'flagged'
              ? 'border-danger-200 bg-danger-50 text-danger-600'
              : 'border-surface-border-strong bg-surface-card text-ink-600 hover:border-danger-200 hover:text-danger-600',
          )}
        >
          <ThumbsDown className="h-3 w-3" /> Flag for reversal
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
          {decision === 'approved' ? 'Signed off' : 'Approve & sign off'}
        </button>
      </div>
    </div>
  )
}
