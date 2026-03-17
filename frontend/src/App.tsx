import { useState, useEffect } from 'react'
import type { Client, PrepResult } from './types'
import { Sidebar } from './Sidebar'
import { EmptyState } from './EmptyState'
import { ResultView } from './ResultView'

const API_BASE = ''

async function fetchClients(): Promise<Client[]> {
  const r = await fetch(`${API_BASE}/api/clients`)
  if (!r.ok) throw new Error('Failed to load clients')
  return r.json()
}

async function fetchPrep(clientId: string, model: string, notes?: string | null): Promise<PrepResult> {
  const r = await fetch(`${API_BASE}/api/prep`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_id: clientId, model, notes: notes || null }),
  })
  if (!r.ok) {
    const err = await r.json().catch(() => ({ detail: r.statusText }))
    const msg = typeof err.detail === 'string' ? err.detail : Array.isArray(err.detail) ? err.detail.map((d: { msg?: string }) => d.msg || JSON.stringify(d)).join(', ') : 'Failed to generate prep'
    throw new Error(msg || 'Failed to generate prep')
  }
  return r.json()
}

export default function App() {
  const [clients, setClients] = useState<Client[]>([])
  const [loadingClients, setLoadingClients] = useState(true)
  const [clientId, setClientId] = useState('')
  const [notes, setNotes] = useState('')
  const [model, setModel] = useState('gpt-4o-mini')
  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState<PrepResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchClients()
      .then((list) => {
        setClients(list)
        if (list.length && !clientId) setClientId(list[0].client_id)
      })
      .catch(() => setError('Could not load clients'))
      .finally(() => setLoadingClients(false))
  }, [])

  const handleGenerate = async () => {
    if (!clientId) return
    setError(null)
    setGenerating(true)
    setResult(null)
    try {
      const data = await fetchPrep(clientId, model, notes)
      setResult(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar
        clients={clients}
        loadingClients={loadingClients}
        clientId={clientId}
        onClientChange={setClientId}
        notes={notes}
        onNotesChange={setNotes}
        model={model}
        onModelChange={setModel}
        onGenerate={handleGenerate}
        generating={generating}
      />
      <main className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <header className="mb-8 pb-6 border-b border-slate-700/60">
            <h1 className="text-2xl font-semibold tracking-tight text-white flex items-center gap-2">
              <span className="text-primary-400">📋</span> Advisor Meeting Prep Copilot
            </h1>
            <p className="text-slate-400 mt-1 text-sm">
              Synthesize client context, relationships, and recommended talking points before your meeting.
            </p>
          </header>

          {error && (
            <div
              className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm animate-fade-in"
              role="alert"
            >
              {error}
            </div>
          )}

          {result ? (
            <ResultView result={result} className="animate-slide-up" />
          ) : (
            <EmptyState generating={generating} />
          )}

          <footer className="mt-12 pt-6 border-t border-slate-700/60 text-xs text-slate-500">
            Advisor Meeting Prep Copilot · Data from mock CSVs · Set OPENAI_API_KEY in your environment for AI summaries.
          </footer>
        </div>
      </main>
    </div>
  )
}
