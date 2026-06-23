/** Formatting helpers — dates, currency, and a deterministic confidence model. */

export function formatCurrency(value: number | null | undefined, compact = false): string {
  if (value == null || Number.isNaN(value)) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
    notation: compact ? 'compact' : 'standard',
  }).format(value)
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function relativeTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  const diff = Date.now() - d.getTime()
  const mins = Math.round(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  if (days < 30) return `${days}d ago`
  return formatDate(iso)
}

export function initials(name: string | null | undefined): string {
  if (!name) return '?'
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')
}

export type ConfidenceLevel = 'high' | 'medium' | 'low'

export interface Confidence {
  level: ConfidenceLevel
  score: number // 0-100
  label: string
}

/**
 * The backend does not emit a confidence score, so we derive a deterministic,
 * defensible one from signals in the AI output (length, specificity, whether the
 * item was flagged for human review). Deterministic = same input → same score,
 * so the demo never shows a number that jitters between renders.
 */
export function deriveConfidence(text: string, flaggedForReview = false): Confidence {
  const t = (text || '').trim()
  let score = 72
  if (t.length > 120) score += 8
  if (t.length > 220) score += 6
  if (/\b\d{4}|\$|%|\bQ[1-4]\b/.test(t)) score += 8 // concrete figures/dates
  if (/\bmay\b|\bmight\b|\bpossibly\b|\bunclear\b|\bverify\b|\bconfirm\b/i.test(t)) score -= 14
  if (flaggedForReview) score -= 20
  score = Math.max(38, Math.min(96, score))
  const level: ConfidenceLevel = score >= 80 ? 'high' : score >= 62 ? 'medium' : 'low'
  const label = level === 'high' ? 'High confidence' : level === 'medium' ? 'Medium confidence' : 'Needs review'
  return { level, score, label }
}

/** Map a Salesforce Opportunity StageName to a coarse progress fraction for goal bars. */
export function stageProgress(stage: string | null | undefined): number {
  const s = (stage || '').toLowerCase()
  if (s.includes('closed won')) return 1
  if (s.includes('closed lost')) return 0
  if (s.includes('negotiation') || s.includes('proposal')) return 0.8
  if (s.includes('value')) return 0.6
  if (s.includes('perception') || s.includes('analysis')) return 0.45
  if (s.includes('qualification') || s.includes('needs')) return 0.3
  if (s.includes('prospect')) return 0.15
  return 0.5
}

export function titleCaseTool(tool: string): string {
  return tool
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}
