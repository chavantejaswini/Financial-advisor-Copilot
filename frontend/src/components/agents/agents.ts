import { Database, GitBranch, Sparkles } from 'lucide-react'
import type { AgentKey } from '../../types'

export interface AgentMeta {
  key: AgentKey
  name: string
  role: string
  description: string
  icon: typeof Database
  /** tailwind text color */
  color: string
  /** tailwind bg tint */
  tint: string
  ring: string
}

export const AGENTS: Record<AgentKey, AgentMeta> = {
  access: {
    key: 'access',
    name: 'Access Agent',
    role: 'Data retrieval',
    description: 'Pulls the client’s profile, goals, tasks and CRM history from Salesforce via SOQL.',
    icon: Database,
    color: 'text-agent-access',
    tint: 'bg-cyan-50',
    ring: 'ring-cyan-200',
  },
  connection: {
    key: 'connection',
    name: 'Connection Agent',
    role: 'Reasoning',
    description: 'Identifies cross-cutting relationships between goals, portfolio, market and compliance.',
    icon: GitBranch,
    color: 'text-agent-connection',
    tint: 'bg-violet-50',
    ring: 'ring-violet-200',
  },
  summary: {
    key: 'summary',
    name: 'Summary Agent',
    role: 'Synthesis + CRM actions',
    description: 'Writes the meeting brief and executes any CRM actions the advisor requested.',
    icon: Sparkles,
    color: 'text-agent-summary',
    tint: 'bg-accent-50',
    ring: 'ring-accent-200',
  },
}

export const AGENT_ORDER: AgentKey[] = ['access', 'connection', 'summary']
