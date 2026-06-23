import { ChevronDown, Sparkles, Wand2 } from 'lucide-react'
import type { Client } from '../../types'
import { Button } from '../../components/ui/Button'
import { Skeleton } from '../../components/ui/Skeleton'

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

const MODELS = [
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini · fast' },
  { value: 'gpt-4o', label: 'GPT-4o · most capable' },
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
]

const SAMPLE_NOTES = [
  'Create a task to send the SLA renewal proposal by Friday',
  'Remind me to follow up on the portable truck generators quote next Tuesday',
  'Log a meeting note that we reviewed the portfolio and agreed to rebalance',
]

interface PrepSetupProps {
  clients: Client[]
  loadingClients: boolean
  clientId: string
  onClientChange: (id: string) => void
  notes: string
  onNotesChange: (v: string) => void
  model: string
  onModelChange: (v: string) => void
  onGenerate: () => void
  generating: boolean
}

export function PrepSetup({
  clients,
  loadingClients,
  clientId,
  onClientChange,
  notes,
  onNotesChange,
  model,
  onModelChange,
  onGenerate,
  generating,
}: PrepSetupProps) {
  return (
    <div className="rounded-lg border border-surface-border bg-surface-card shadow-sm">
      <div className="grid gap-4 p-4 md:grid-cols-[1.4fr_1fr]">
        {/* Client */}
        <div>
          <label className="block text-2xs font-semibold uppercase tracking-wider text-ink-400 mb-1.5">
            Client
          </label>
          {loadingClients ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <div className="relative">
              <select
                value={clientId}
                onChange={(e) => onClientChange(e.target.value)}
                className="w-full h-10 pl-3 pr-9 rounded-md border border-surface-border-strong bg-surface-card text-sm text-ink-900 appearance-none focus:outline-none focus:border-accent-400 focus:shadow-focus-accent"
              >
                {clients.length === 0 && <option value="">No clients loaded</option>}
                {clients.map((c) => (
                  <option key={c.client_id} value={c.client_id}>
                    {c.client_name}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
            </div>
          )}
        </div>

        {/* Model */}
        <div>
          <label className="block text-2xs font-semibold uppercase tracking-wider text-ink-400 mb-1.5">
            Model
          </label>
          <div className="relative">
            <select
              value={model}
              onChange={(e) => onModelChange(e.target.value)}
              className="w-full h-10 pl-3 pr-9 rounded-md border border-surface-border-strong bg-surface-card text-sm text-ink-900 appearance-none focus:outline-none focus:border-accent-400 focus:shadow-focus-accent"
            >
              {MODELS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
          </div>
        </div>

        {/* Notes */}
        <div className="md:col-span-2">
          <label className="block text-2xs font-semibold uppercase tracking-wider text-ink-400 mb-1.5">
            Advisor note <span className="font-normal normal-case text-ink-400">— natural-language instruction (optional)</span>
          </label>
          <textarea
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder="e.g. Create a task to send the ESG comparison by Friday — the Summary Agent will execute CRM actions you describe here."
            rows={2}
            className="w-full px-3 py-2.5 rounded-md border border-surface-border-strong bg-surface-card text-sm text-ink-900 placeholder-ink-400 focus:outline-none focus:border-accent-400 focus:shadow-focus-accent resize-none"
          />
          <div className="mt-2 flex items-center gap-1.5 flex-wrap">
            <span className="text-2xs text-ink-400 inline-flex items-center gap-1">
              <Wand2 className="h-3 w-3" /> Try:
            </span>
            {SAMPLE_NOTES.map((s) => (
              <button
                key={s}
                onClick={() => onNotesChange(s)}
                className="text-2xs rounded-full border border-surface-border bg-surface-base px-2.5 py-1 text-ink-600 hover:border-accent-300 hover:text-accent-700 transition-colors"
              >
                {s.length > 46 ? s.slice(0, 44) + '…' : s}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-surface-border bg-surface-base/50">
        <p className="text-2xs text-ink-400 hidden sm:block">
          Runs the Access → Connection → Summary pipeline against live Salesforce data.
        </p>
        <Button
          onClick={onGenerate}
          loading={generating}
          disabled={!clientId}
          icon={<Sparkles className="h-4 w-4" />}
          className={cx('shrink-0')}
        >
          {generating ? 'Generating prep…' : 'Generate meeting prep'}
        </Button>
      </div>
    </div>
  )
}
