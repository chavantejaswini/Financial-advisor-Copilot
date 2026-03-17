export interface Client {
  client_id: string
  client_name: string
}

export interface PrepRequest {
  client_id: string
  model: string
  notes?: string | null
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
