import type { Client, HealthStatus } from '../../types'
import { ClientsList } from './ClientsList'
import { ClientWorkspace } from './ClientWorkspace'

interface ClientsScreenProps {
  clients: Client[]
  loadingClients: boolean
  health: HealthStatus | null
  model: string
  selectedId: string
  onSelect: (clientId: string) => void
  onBack: () => void
  onPrep: (clientId: string) => void
}

export function ClientsScreen({
  clients,
  loadingClients,
  health,
  model,
  selectedId,
  onSelect,
  onBack,
  onPrep,
}: ClientsScreenProps) {
  const selected = clients.find((c) => c.client_id === selectedId)

  if (selected) {
    return <ClientWorkspace client={selected} model={model} onBack={onBack} onPrep={onPrep} />
  }

  return <ClientsList clients={clients} loading={loadingClients} health={health} onOpen={onSelect} />
}
