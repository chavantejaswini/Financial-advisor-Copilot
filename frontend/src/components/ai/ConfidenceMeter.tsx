import type { Confidence } from '../../lib/format'

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

const COLORS = {
  high: { bar: 'bg-success-500', text: 'text-success-700', track: 'bg-success-100' },
  medium: { bar: 'bg-warning-500', text: 'text-warning-700', track: 'bg-warning-100' },
  low: { bar: 'bg-danger-500', text: 'text-danger-700', track: 'bg-danger-100' },
}

export function ConfidenceMeter({ confidence, showLabel = true }: { confidence: Confidence; showLabel?: boolean }) {
  const c = COLORS[confidence.level]
  return (
    <div className="flex items-center gap-2" title={`${confidence.label} · ${confidence.score}%`}>
      <div className={cx('h-1.5 w-14 rounded-full overflow-hidden', c.track)}>
        <div className={cx('h-full rounded-full', c.bar)} style={{ width: `${confidence.score}%` }} />
      </div>
      {showLabel && <span className={cx('text-2xs font-medium', c.text)}>{confidence.score}%</span>}
    </div>
  )
}
