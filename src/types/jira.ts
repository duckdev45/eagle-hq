export type HealthLight = 'red' | 'yellow' | 'green'

/* QMS workflow: 待辦事項 → TBC → 進行中 → DEV VERIFY → PM VERIFY → PO VERIFY → 完成 */
export const STATUS_DONE = '完成'
export const STATUS_TBC = 'TBC'
export const VERIFY_STATUSES = ['Dev Verify', 'Pm Verify', 'Po Verify'] as const

export interface JiraIssueLite {
  key: string
  summary: string
  status: string
  assignee: string | null
  dueDate: string | null
  light: HealthLight
  reasons: string[]
}

export interface EpicHealth {
  key: string
  summary: string
  status: string
  dueDate: string | null
  light: HealthLight
  reasons: string[]
  counts: {
    total: number
    done: number
    red: number
    yellow: number
    byStatus: Record<string, number>
  }
  issues: JiraIssueLite[]
}

export interface SprintHealth {
  id: number
  name: string
  state: 'active' | 'future' | 'closed'
  startDate: string | null
  endDate: string | null
  counts: { total: number; done: number; red: number; yellow: number }
  issues: JiraIssueLite[]
}

export interface MemberLoad {
  assignee: string
  memberId: string | null
  red: number
  yellow: number
  total: number
}

export interface JiraSnapshot {
  generatedAt: string
  projectKey: string
  /* Jira site URL, for building browse links in the UI */
  baseUrl: string
  summary: {
    epics: number
    red: number
    yellow: number
    green: number
  }
  epics: EpicHealth[]
  members: MemberLoad[]
  sprint: SprintHealth | null
}
