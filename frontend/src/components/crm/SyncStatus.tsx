import { CheckCircle2, CloudOff, RefreshCw } from 'lucide-react'

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

export type SyncState = 'synced' | 'syncing' | 'offline' | 'error'

export function SyncStatus({
  state,
  lastUpdated,
  onRetry,
  className,
}: {
  state: SyncState
  lastUpdated?: string
  onRetry?: () => void
  className?: string
}) {
  const map = {
    synced: { icon: CheckCircle2, text: 'Salesforce synced', cls: 'text-success-600' },
    syncing: { icon: RefreshCw, text: 'Syncing…', cls: 'text-accent-600' },
    offline: { icon: CloudOff, text: 'CSV fallback (offline)', cls: 'text-ink-500' },
    error: { icon: CloudOff, text: 'Sync failed', cls: 'text-danger-600' },
  } as const
  const { icon: Icon, text, cls } = map[state]
  return (
    <div className={cx('inline-flex items-center gap-1.5 text-2xs font-medium', cls, className)}>
      <Icon className={cx('h-3.5 w-3.5', state === 'syncing' && 'animate-spin')} />
      <span>{text}</span>
      {lastUpdated && <span className="text-ink-400">· updated {lastUpdated}</span>}
      {state === 'error' && onRetry && (
        <button onClick={onRetry} className="ml-1 underline hover:text-danger-700">
          Retry
        </button>
      )}
    </div>
  )
}
