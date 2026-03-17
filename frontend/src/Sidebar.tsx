import type { Client } from './types'

interface SidebarProps {
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

const MODELS = [
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
  { value: 'gpt-4o', label: 'GPT-4o' },
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
]

export function Sidebar({
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
}: SidebarProps) {
  return (
    <aside className="w-80 shrink-0 border-r border-slate-700/60 bg-slate-900/50 flex flex-col">
      <div className="p-5 flex flex-col gap-5">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Meeting setup</h2>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Client</label>
          {loadingClients ? (
            <div className="h-10 rounded-lg bg-slate-700/50 animate-pulse" />
          ) : (
            <select
              value={clientId}
              onChange={(e) => onClientChange(e.target.value)}
              className="w-full h-10 px-3 rounded-lg bg-slate-800 border border-slate-600/60 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
            >
              {clients.length === 0 && (
                <option value="">No clients loaded</option>
              )}
              {clients.map((c) => (
                <option key={c.client_id} value={c.client_id}>
                  {c.client_name} ({c.client_id})
                </option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Additional notes</label>
          <textarea
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder="Paste any extra context for this meeting..."
            rows={4}
            className="w-full px-3 py-2.5 rounded-lg bg-slate-800 border border-slate-600/60 text-slate-200 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 resize-none"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Model</label>
          <select
            value={model}
            onChange={(e) => onModelChange(e.target.value)}
            className="w-full h-10 px-3 rounded-lg bg-slate-800 border border-slate-600/60 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
          >
            {MODELS.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={onGenerate}
            disabled={generating || !clientId}
            className="w-full h-11 rounded-lg bg-primary-500 hover:bg-primary-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm transition-colors flex items-center justify-center gap-2"
          >
            {generating ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Generating…
              </>
            ) : (
              'Generate meeting prep'
            )}
          </button>
        </div>
      </div>
    </aside>
  )
}
