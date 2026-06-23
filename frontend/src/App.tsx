import { useEffect, useMemo, useState } from 'react'
import type { Client, HealthStatus, ViewId } from './types'
import { fetchClients, fetchHealth } from './lib/api'
import { AppShell } from './components/shell/AppShell'
import { MeetingPrepScreen } from './screens/MeetingPrep/MeetingPrepScreen'
import { ClientsScreen } from './screens/Clients/ClientsScreen'
import { DashboardScreen } from './screens/Dashboard/DashboardScreen'
import { CalendarScreen } from './screens/Calendar/CalendarScreen'
import { MeetingRoomScreen } from './screens/MeetingRoom/MeetingRoomScreen'

export default function App() {
  const [view, setView] = useState<ViewId>('dashboard')
  const [clients, setClients] = useState<Client[]>([])
  const [loadingClients, setLoadingClients] = useState(true)
  const [health, setHealth] = useState<HealthStatus | null>(null)

  // Shared prep inputs (so the command palette can set the client & jump here)
  const [clientId, setClientId] = useState('')
  const [notes, setNotes] = useState('')
  const [model, setModel] = useState('gpt-4o-mini')

  // Client Workspace selection (Clients view: '' = list, id = workspace)
  const [workspaceClientId, setWorkspaceClientId] = useState('')

  // Meeting Room — which client we're "in" with
  const [meetingClientName, setMeetingClientName] = useState<string | undefined>(undefined)

  useEffect(() => {
    fetchClients()
      .then((list) => {
        setClients(list)
        setClientId((cur) => cur || (list[0]?.client_id ?? ''))
      })
      .catch(() => {})
      .finally(() => setLoadingClients(false))
    fetchHealth().then(setHealth)
  }, [])

  function navigate(next: ViewId) {
    // Re-entering Clients always lands on the list, not a stale workspace.
    if (next === 'clients') setWorkspaceClientId('')
    setView(next)
  }

  const clientName = useMemo(() => {
    const id = view === 'meeting-prep' ? clientId : view === 'clients' ? workspaceClientId : ''
    return id ? clients.find((c) => c.client_id === id)?.client_name : undefined
  }, [view, clients, clientId, workspaceClientId])

  function goToPrep(id: string) {
    setClientId(id)
    setWorkspaceClientId('')
    setView('meeting-prep')
  }

  function openClientWorkspace(id: string) {
    setWorkspaceClientId(id)
    setView('clients')
  }

  function joinMeeting(name: string) {
    setMeetingClientName(name)
    setView('meeting-room')
  }

  return (
    <AppShell
      view={view}
      clientName={clientName}
      health={health}
      clients={clients}
      onNavigate={navigate}
      onSelectClient={goToPrep}
    >
      {view === 'dashboard' && (
        <DashboardScreen
          clients={clients}
          health={health}
          onPrep={goToPrep}
          onOpenClient={openClientWorkspace}
        />
      )}

      {view === 'meeting-prep' && (
        <MeetingPrepScreen
          clients={clients}
          loadingClients={loadingClients}
          health={health}
          clientId={clientId}
          onClientChange={setClientId}
          notes={notes}
          onNotesChange={setNotes}
          model={model}
          onModelChange={setModel}
        />
      )}

      {view === 'clients' && (
        <ClientsScreen
          clients={clients}
          loadingClients={loadingClients}
          health={health}
          model={model}
          selectedId={workspaceClientId}
          onSelect={setWorkspaceClientId}
          onBack={() => setWorkspaceClientId('')}
          onPrep={goToPrep}
        />
      )}

      {view === 'calendar' && <CalendarScreen clients={clients} onPrep={goToPrep} onJoin={joinMeeting} />}

      {view === 'meeting-room' && <MeetingRoomScreen clientName={meetingClientName} />}
    </AppShell>
  )
}
