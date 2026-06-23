import type { Client, HealthStatus, PrepResult } from '../types'

const API_BASE = ''

export async function fetchClients(): Promise<Client[]> {
  const r = await fetch(`${API_BASE}/api/clients`)
  if (!r.ok) throw new Error('Failed to load clients')
  return r.json()
}

export async function fetchHealth(): Promise<HealthStatus | null> {
  try {
    const r = await fetch(`${API_BASE}/api/health`)
    if (!r.ok) return null
    return r.json()
  } catch {
    return null
  }
}

export async function fetchPrep(
  clientId: string,
  model: string,
  notes?: string | null,
): Promise<PrepResult> {
  const r = await fetch(`${API_BASE}/api/prep`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_id: clientId, model, notes: notes || null }),
  })
  if (!r.ok) {
    const err = await r.json().catch(() => ({ detail: r.statusText }))
    const msg =
      typeof err.detail === 'string'
        ? err.detail
        : Array.isArray(err.detail)
          ? err.detail.map((d: { msg?: string }) => d.msg || JSON.stringify(d)).join(', ')
          : 'Failed to generate prep'
    throw new Error(msg || 'Failed to generate prep')
  }
  return r.json()
}

/** Build a deep link to a Salesforce record when we know the instance + id. */
export function salesforceRecordUrl(
  instance: string | null | undefined,
  recordId: string | null | undefined,
): string | null {
  if (!instance || !recordId) return null
  const base = instance.startsWith('http') ? instance : `https://${instance}`
  return `${base.replace(/\/$/, '')}/${recordId}`
}
