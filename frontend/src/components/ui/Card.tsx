import type { HTMLAttributes, ReactNode } from 'react'

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  /** raise on hover — for interactive/clickable cards */
  interactive?: boolean
  padded?: boolean
}

export function Card({ children, interactive, padded = true, className, ...rest }: CardProps) {
  return (
    <div
      className={cx(
        'rounded-lg border border-surface-border bg-surface-card shadow-sm',
        interactive && 'transition-shadow transition-transform hover:shadow-md hover:-translate-y-px cursor-pointer',
        padded && 'p-5',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  )
}

export function CardHeader({
  title,
  subtitle,
  icon,
  action,
  className,
}: {
  title: ReactNode
  subtitle?: ReactNode
  icon?: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cx('flex items-start justify-between gap-3', className)}>
      <div className="flex items-start gap-2.5 min-w-0">
        {icon && <div className="mt-0.5 shrink-0 text-ink-500">{icon}</div>}
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-ink-900 leading-tight">{title}</h3>
          {subtitle && <p className="text-xs text-ink-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

/** Small uppercase section eyebrow used throughout the brief. */
export function SectionLabel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cx('text-2xs font-semibold uppercase tracking-wider text-ink-400', className)}>
      {children}
    </div>
  )
}
