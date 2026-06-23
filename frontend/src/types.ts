export interface Client {
  client_id: string
  client_name: string
}

export interface PrepRequest {
  client_id: string
  model: string
  notes?: string | null
}

export interface CrmAction {
  tool: string
  input: Record<string, unknown>
  result: string | null
}

export interface AgentforceResponse {
  reply?: string
  session_id?: string
  error?: string
  raw?: unknown
}

export interface SummaryOutput {
  client_name?: string
  client_id?: string
  client_summary?: string
  key_financial_or_relationship_signals?: string[]
  potential_risks_or_opportunities?: string[]
  suggested_discussion_topics?: string[]
  recommended_next_best_actions?: string[]
  confidence_notes_or_human_review?: string[]
  actions_taken?: CrmAction[]
  agentforce_response?: AgentforceResponse | null
  mode?: 'salesforce' | 'csv-fallback'
  error?: string
}

export interface ConnectionOutput {
  relationships?: string[]
}

export interface PrepResult {
  summary_output: SummaryOutput
  connection_output: ConnectionOutput
  client_context: Record<string, unknown>
}

export interface HealthStatus {
  openai_configured: boolean
  salesforce_configured: boolean
  salesforce_instance: string | null
  agentforce_configured: boolean
}

// ---------- UI-only types (no backend contract) ----------

export type ViewId = 'dashboard' | 'clients' | 'meeting-prep' | 'calendar' | 'meeting-room'

export interface Route {
  view: ViewId
  clientId?: string
}

/** Lifecycle of a single AI agent in the pipeline visualization. */
export type AgentStatus = 'idle' | 'running' | 'done' | 'error'

export type AgentKey = 'access' | 'connection' | 'summary'

export interface AgentState {
  key: AgentKey
  status: AgentStatus
}

/** Advisor's decision on an AI-generated artifact (human-in-the-loop). */
export type ApprovalDecision = 'pending' | 'approved' | 'rejected' | 'modified'

export interface ClientContextShape {
  source?: 'salesforce' | 'csv'
  client_id?: string
  client_profile?: {
    client_id?: string
    client_name?: string
    account_type?: string
    industry?: string
    relationship_start?: string
    risk_tolerance?: string
    aum_band?: string
    primary_advisor_notes?: string
  }
  crm_notes?: Array<{
    note_id?: string
    note_date?: string
    note_type?: string
    summary?: string
    details?: string
  }>
  open_tasks?: Array<{
    task_id?: string
    subject?: string
    due?: string
    status?: string
    priority?: string
    details?: string
  }>
  client_goals?: Array<{
    goal_id?: string
    goal_name?: string
    target_amount?: number | null
    target_date?: string
    status?: string
    details?: string
  }>
  portfolio_activity?: Array<Record<string, unknown>>
  compliance_considerations?: Array<Record<string, unknown>>
  market_updates?: Array<Record<string, unknown>>
}
