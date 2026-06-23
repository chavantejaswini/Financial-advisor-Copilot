import { CalendarDays, LayoutDashboard, Mic, Sparkles, Users } from 'lucide-react'
import type { ViewId } from '../../types'

export interface NavItem {
  id: ViewId
  label: string
  icon: typeof LayoutDashboard
  /** screens still being built in later slices */
  comingSoon?: boolean
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'clients', label: 'Clients', icon: Users },
  { id: 'meeting-prep', label: 'Meeting Prep', icon: Sparkles },
  { id: 'calendar', label: 'Calendar', icon: CalendarDays },
  { id: 'meeting-room', label: 'Meeting Room', icon: Mic },
]

export const VIEW_TITLES: Record<ViewId, string> = {
  dashboard: 'Dashboard',
  clients: 'Clients',
  'meeting-prep': 'Meeting Prep',
  calendar: 'Calendar',
  'meeting-room': 'Meeting Room',
}
