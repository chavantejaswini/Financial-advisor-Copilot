interface EmptyStateProps {
  generating: boolean
}

export function EmptyState({ generating }: EmptyStateProps) {
  return (
    <div className="text-center py-16 px-4">
      <div className="text-5xl mb-4 opacity-80">📋</div>
      <h2 className="text-lg font-semibold text-white mb-2">Ready when you are</h2>
      <p className="text-slate-400 text-sm max-w-md mx-auto mb-8 leading-relaxed">
        Select a client in the sidebar and click <strong className="text-slate-300">Generate meeting prep</strong> to run the copilot and get a brief before your meeting.
      </p>
      {generating && (
        <div className="inline-flex items-center gap-2 text-sm text-slate-400">
          <span className="inline-block w-4 h-4 border-2 border-primary-500/30 border-t-primary-400 rounded-full animate-spin" />
          Loading client data… Analyzing relationships… Generating prep…
        </div>
      )}
      <details className="mt-12 text-left inline-block">
        <summary className="text-sm text-slate-500 cursor-pointer hover:text-slate-400">
          Data sources (mock CSVs)
        </summary>
        <ul className="mt-2 text-sm text-slate-500 space-y-1 list-disc list-inside">
          <li>clients.csv — Profile, risk tolerance, AUM band</li>
          <li>crm_notes.csv — Meeting/call/email history</li>
          <li>portfolio_activity.csv — Holdings, allocation, alerts</li>
          <li>market_updates.csv — Market and regulatory updates</li>
          <li>client_goals.csv — Goals, time horizons, status</li>
          <li>compliance_considerations.csv — Suitability, disclosure</li>
        </ul>
      </details>
    </div>
  )
}
