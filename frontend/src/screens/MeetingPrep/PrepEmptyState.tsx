import { ArrowRight } from 'lucide-react'
import { AGENT_ORDER, AGENTS } from '../../components/agents/agents'

export function PrepEmptyState() {
  return (
    <div className="rounded-lg border border-dashed border-surface-border-strong bg-surface-card/60 p-8 md:p-12 text-center animate-fade-in">
      <div className="mx-auto max-w-2xl">
        <h2 className="text-lg font-semibold text-ink-900">Prepare for your next client meeting in seconds</h2>
        <p className="mt-2 text-sm text-ink-500 leading-relaxed">
          Three specialized AI agents collaborate to pull the client’s Salesforce record, find the connections that
          matter, and draft a meeting brief — then execute any CRM actions you describe, with your approval on every
          step.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-stretch justify-center gap-3">
          {AGENT_ORDER.map((key, i) => {
            const meta = AGENTS[key]
            const Icon = meta.icon
            return (
              <div key={key} className="flex items-center gap-3">
                <div className="flex-1 rounded-lg border border-surface-border bg-surface-card p-4 text-left shadow-xs min-w-[180px]">
                  <span className={`flex h-9 w-9 items-center justify-center rounded-md ${meta.tint} mb-2.5`}>
                    <Icon className={`h-4.5 w-4.5 ${meta.color}`} />
                  </span>
                  <div className="text-sm font-semibold text-ink-900">{meta.name}</div>
                  <div className="text-2xs font-medium text-ink-400 mb-1">{meta.role}</div>
                  <p className="text-xs text-ink-500 leading-snug">{meta.description}</p>
                </div>
                {i < AGENT_ORDER.length - 1 && (
                  <ArrowRight className="hidden sm:block h-4 w-4 text-ink-300 shrink-0" />
                )}
              </div>
            )
          })}
        </div>

        <p className="mt-8 text-xs text-ink-400">
          Select a client above and click <span className="font-medium text-ink-600">Generate meeting prep</span> to
          begin.
        </p>
      </div>
    </div>
  )
}
