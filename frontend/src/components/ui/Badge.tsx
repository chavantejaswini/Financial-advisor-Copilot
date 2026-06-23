import type { ReactNode } from 'react'

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

export type BadgeTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'navy' | 'violet'

const TONES: Record<BadgeTone, string> = {
  neutral: 'bg-surface-sunken text-ink-700 border-surface-border',
  accent: 'bg-accent-50 text-accent-700 border-accent-200',
  success: 'bg-success-50 text-success-700 border-success-200',
  warning: 'bg-warning-50 text-warning-700 border-warning-200',
  danger: 'bg-danger-50 text-danger-700 border-danger-200',
  navy: 'bg-navy-50 text-navy-800 border-navy-200',
  violet: 'bg-violet-50 text-violet-700 border-violet-200',
}

export function Badge({
  children,
  tone = 'neutral',
  icon,
  dot,
  className,
}: {
  children: ReactNode
  tone?: BadgeTone
  icon?: ReactNode
  dot?: boolean
  className?: string
}) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border px-2 py-0.5 text-2xs font-medium leading-5',
        TONES[tone],
        className,
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />}
      {icon}
      {children}
    </span>
  )
}

/** Small "Sample data" tag used wherever demo data is surfaced. */
export function DemoTag({ className }: { className?: string }) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 rounded border border-dashed border-ink-300 px-1.5 py-0.5 text-2xs font-medium text-ink-400',
        className,
      )}
      title="Sample data — not from the live backend"
    >
      Sample data
    </span>
  )
}
