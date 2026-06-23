/**
 * DEMO DATA — clearly fenced off from live API data.
 *
 * The frozen backend exposes only /api/clients, /api/health and /api/prep.
 * Screens that the real product would source from a calendar, a portfolio
 * book, or a notifications service are populated from this module so the full
 * enterprise experience can be demonstrated. Every value here is sample data.
 * Anything rendered from it is tagged with a `Sample data` badge in the UI.
 */

export const IS_DEMO = true

export interface Advisor {
  name: string
  title: string
  firm: string
  email: string
}

export const ADVISOR: Advisor = {
  name: 'Tejaswini Chavan',
  title: 'Senior Financial Advisor',
  firm: 'Northshore Wealth Partners',
  email: 'tejaswini@nodeglobe.xyz',
}

export interface DemoNotification {
  id: string
  kind: 'approval' | 'sync' | 'meeting' | 'risk'
  title: string
  body: string
  time: string // relative label
  unread: boolean
}

export const DEMO_NOTIFICATIONS: DemoNotification[] = [
  {
    id: 'n1',
    kind: 'approval',
    title: '2 AI actions awaiting approval',
    body: 'Summary Agent drafted follow-up tasks for Express Logistics.',
    time: '4m ago',
    unread: true,
  },
  {
    id: 'n2',
    kind: 'meeting',
    title: 'Meeting in 30 minutes',
    body: 'Edge Communications — quarterly portfolio review.',
    time: '24m ago',
    unread: true,
  },
  {
    id: 'n3',
    kind: 'risk',
    title: 'Suitability flag raised',
    body: 'GenePoint allocation drifted outside target risk band.',
    time: '1h ago',
    unread: false,
  },
  {
    id: 'n4',
    kind: 'sync',
    title: 'Salesforce sync complete',
    body: 'All client tasks synchronized successfully.',
    time: '2h ago',
    unread: false,
  },
]

export interface DemoMeeting {
  id: string
  clientName: string
  clientId?: string
  time: string
  durationMin: number
  type: 'Portfolio review' | 'Discovery' | 'Annual review' | 'Check-in'
  status: 'upcoming' | 'now' | 'done'
  prepReady: boolean
}

export const DEMO_TODAY_MEETINGS: DemoMeeting[] = [
  { id: 'm1', clientName: 'Edge Communications', time: '10:30 AM', durationMin: 45, type: 'Portfolio review', status: 'now', prepReady: true },
  { id: 'm2', clientName: 'Express Logistics and Transport', time: '1:00 PM', durationMin: 30, type: 'Check-in', status: 'upcoming', prepReady: true },
  { id: 'm3', clientName: 'GenePoint', time: '2:30 PM', durationMin: 60, type: 'Annual review', status: 'upcoming', prepReady: false },
  { id: 'm4', clientName: 'Grand Hotels & Resorts Ltd', time: '4:00 PM', durationMin: 30, type: 'Discovery', status: 'upcoming', prepReady: false },
]

export interface DemoHolding {
  symbol: string
  name: string
  assetClass: 'Equity' | 'Fixed Income' | 'Cash' | 'Alternatives'
  value: number
  weight: number // %
  dayChangePct: number
}

export const DEMO_PORTFOLIO: DemoHolding[] = [
  { symbol: 'VTI', name: 'US Total Market', assetClass: 'Equity', value: 1_240_000, weight: 41, dayChangePct: 0.62 },
  { symbol: 'VXUS', name: 'International Equity', assetClass: 'Equity', value: 520_000, weight: 17, dayChangePct: -0.18 },
  { symbol: 'BND', name: 'US Aggregate Bond', assetClass: 'Fixed Income', value: 760_000, weight: 25, dayChangePct: 0.07 },
  { symbol: 'MUB', name: 'Municipal Bonds', assetClass: 'Fixed Income', value: 300_000, weight: 10, dayChangePct: 0.04 },
  { symbol: 'CASH', name: 'Money Market', assetClass: 'Cash', value: 210_000, weight: 7, dayChangePct: 0.0 },
]

export const DEMO_PORTFOLIO_TOTAL = DEMO_PORTFOLIO.reduce((s, h) => s + h.value, 0)

/** Book-level AUM shown on the dashboard hero stat. */
export const DEMO_BOOK_AUM = 48_200_000

export interface DemoAttention {
  clientName: string
  reason: string
  severity: 'high' | 'medium'
}

export const DEMO_ATTENTION: DemoAttention[] = [
  { clientName: 'GenePoint', reason: 'Allocation drifted outside target risk band', severity: 'high' },
  { clientName: 'Grand Hotels & Resorts Ltd', reason: 'Annual review overdue by 14 days', severity: 'medium' },
  { clientName: 'Dickenson plc', reason: 'Goal funding behind schedule', severity: 'medium' },
]

export interface DemoPendingAction {
  id: string
  kind: 'task' | 'note'
  title: string
  clientName: string
  summary: string
}

// ---------- Calendar (week view) ----------

export interface DemoCalEvent {
  id: string
  day: number // 0 = Monday … 4 = Friday
  start: number // hour, 24h (e.g. 10.5 = 10:30)
  durationMin: number
  clientName: string
  type: DemoMeeting['type']
  status: 'upcoming' | 'now' | 'done'
}

export const DEMO_WEEK: DemoCalEvent[] = [
  { id: 'c1', day: 0, start: 9.5, durationMin: 45, clientName: 'Pyramid Construction Inc.', type: 'Check-in', status: 'done' },
  { id: 'c2', day: 0, start: 14, durationMin: 60, clientName: 'Dickenson plc', type: 'Annual review', status: 'done' },
  { id: 'c3', day: 1, start: 10.5, durationMin: 45, clientName: 'Edge Communications', type: 'Portfolio review', status: 'now' },
  { id: 'c4', day: 1, start: 13, durationMin: 30, clientName: 'Express Logistics and Transport', type: 'Check-in', status: 'upcoming' },
  { id: 'c5', day: 1, start: 14.5, durationMin: 60, clientName: 'GenePoint', type: 'Annual review', status: 'upcoming' },
  { id: 'c6', day: 2, start: 11, durationMin: 30, clientName: 'Grand Hotels & Resorts Ltd', type: 'Discovery', status: 'upcoming' },
  { id: 'c7', day: 3, start: 9, durationMin: 45, clientName: 'United Oil & Gas Corp.', type: 'Portfolio review', status: 'upcoming' },
  { id: 'c8', day: 3, start: 15, durationMin: 30, clientName: 'Burlington Textiles Corp of America', type: 'Check-in', status: 'upcoming' },
  { id: 'c9', day: 4, start: 10, durationMin: 60, clientName: 'GenePoint', type: 'Annual review', status: 'upcoming' },
]

// ---------- Meeting Room (live transcription simulation) ----------

export interface TranscriptLine {
  speaker: 'advisor' | 'client'
  text: string
}

export const DEMO_MEETING_CLIENT = 'Edge Communications'
export const DEMO_MEETING_TYPE = 'Portfolio review'

export const DEMO_TRANSCRIPT: TranscriptLine[] = [
  { speaker: 'advisor', text: 'Thanks for making time today. I wanted to walk through how the portfolio performed this quarter and where we go from here.' },
  { speaker: 'client', text: 'Sounds good. Honestly the market’s been making me a little nervous lately.' },
  { speaker: 'advisor', text: 'That’s fair. Your allocation is still in line with the moderate risk profile we set, but we did drift slightly overweight in equities after the rally.' },
  { speaker: 'client', text: 'Right. I’d like to be a bit more cautious — maybe shift some into bonds before year end.' },
  { speaker: 'advisor', text: 'We can do that. I’m also thinking we should revisit your retirement target; you mentioned wanting to retire two years earlier.' },
  { speaker: 'client', text: 'Yes — ideally at 62 now. And I want to make sure the kids’ education fund is still on track.' },
  { speaker: 'advisor', text: 'Both are doable. One compliance note: since we’re rebalancing, I’ll need to document the suitability rationale and send you the updated disclosure.' },
  { speaker: 'client', text: 'Perfect. Can you send me a summary of what we agreed and the ESG options we discussed?' },
]

export const DEMO_LIVE_GOALS = [
  'Retire two years earlier — target age 62',
  'Keep children’s education fund on track',
  'Shift toward a more conservative allocation',
]

export const DEMO_LIVE_CONCERNS = [
  'Market volatility / nervousness',
  'Equity overweight after the rally',
  'Suitability documentation for rebalance',
]

export const DEMO_LIVE_QUESTIONS = [
  'What target equity/bond split fits the new risk comfort?',
  'Does retiring at 62 change the funding gap?',
  'Which ESG funds meet the moderate risk profile?',
]

export const DEMO_MEETING_SUMMARY =
  'Quarterly portfolio review with Edge Communications. The client expressed concern about market volatility and asked to move toward a more conservative allocation, trimming the post-rally equity overweight into fixed income before year end. Retirement target was revised earlier to age 62, and the client wants confirmation the education fund remains on track. A rebalance was agreed, requiring updated suitability documentation and disclosure. The client requested a written summary and ESG fund options.'

export interface DemoMeetingAction {
  kind: 'task' | 'note'
  tool: string
  title: string
  detail: string
}

export const DEMO_MEETING_ACTIONS: DemoMeetingAction[] = [
  {
    kind: 'task',
    tool: 'create_followup_task',
    title: 'Send rebalance summary + ESG options',
    detail: 'Email Edge Communications the agreed summary and 2–3 ESG fund options · due in 3 days',
  },
  {
    kind: 'note',
    tool: 'log_meeting_note',
    title: 'Log portfolio review outcome',
    detail: 'Record rebalance decision, revised retirement age (62), and suitability rationale',
  },
  {
    kind: 'task',
    tool: 'create_followup_task',
    title: 'Prepare suitability disclosure',
    detail: 'Draft updated disclosure for the equity → fixed income shift · due in 5 days',
  },
]

export const DEMO_PENDING_ACTIONS: DemoPendingAction[] = [
  {
    id: 'a1',
    kind: 'task',
    title: 'Follow-up task',
    clientName: 'Edge Communications',
    summary: 'Send the Q2 portfolio review deck by Friday',
  },
  {
    id: 'a2',
    kind: 'note',
    title: 'Meeting note',
    clientName: 'GenePoint',
    summary: 'Log the rebalancing discussion from the annual review',
  },
]
