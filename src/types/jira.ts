export type HealthLight = 'red' | 'yellow' | 'green'

/* QMS workflow: 待辦事項 → TBC → 進行中 → DEV VERIFY → PM VERIFY → PO VERIFY → 完成 */
export const STATUS_DONE = '完成'
export const STATUS_TBC = 'TBC'
export const STATUS_TODO = '待辦事項'
export const STATUS_IN_PROGRESS = '進行中'
export const STATUS_DEV_VERIFY = 'DEV VERIFY'
export const VERIFY_STATUSES = ['Dev Verify', 'Pm Verify', 'Po Verify'] as const

/* Dev Verify 以上（含 PM/PO Verify、完成）視為開發端已完成 */
export function isDevDone(status: string): boolean {
  const s = status.toUpperCase()
  return s === STATUS_DONE || VERIFY_STATUSES.some((v) => v.toUpperCase() === s)
}

export interface JiraIssueLite {
  key: string
  summary: string
  status: string
  assignee: string | null
  dueDate: string | null
  light: HealthLight
  reasons: string[]
  /* sprint story：所有子 task 皆達 Dev Verify 以上 */
  devDone?: boolean
}

export interface SprintTask {
  key: string
  summary: string
  status: string
  assignee: string | null
  /* 對應到 office member id（ASSIGNEE_TO_MEMBER 映射） */
  memberId: string | null
  /* 所屬 story */
  parentKey: string | null
  parentSummary: string | null
  /* story 所屬 epic */
  epicSummary: string | null
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
  tasks: SprintTask[]
}

export interface MemberLoad {
  assignee: string
  memberId: string | null
  red: number
  yellow: number
  total: number
}

export interface BacklogItem extends JiraIssueLite {
  epicKey: string | null
  epicSummary: string | null
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
  backlog?: BacklogItem[]
}
