import 'server-only'

import { STATUS_TBC, VERIFY_STATUSES } from '@/types/jira'

export interface RawJiraIssue {
  key: string
  fields: {
    summary: string
    status: { name: string }
    assignee: { displayName: string } | null
    duedate: string | null
    parent?: { key: string }
  }
}

const FIELDS = ['summary', 'status', 'assignee', 'duedate', 'parent']

export function jiraConfig() {
  const baseUrl = process.env.JIRA_BASE_URL?.replace(/\/+$/, '')
  const email = process.env.JIRA_USER_EMAIL
  const token = process.env.JIRA_API_TOKEN
  const projectKey = process.env.JIRA_PROJECT_KEY ?? 'QMS'
  const tbcStuckDays = Number(process.env.JIRA_TBC_STUCK_DAYS ?? 3)
  const verifyStuckDays = Number(process.env.JIRA_VERIFY_STUCK_DAYS ?? 2)
  if (!baseUrl || !email || !token) return null
  return { baseUrl, email, token, projectKey, tbcStuckDays, verifyStuckDays }
}

type JiraConfig = NonNullable<ReturnType<typeof jiraConfig>>

const authHeader = (cfg: JiraConfig) =>
  `Basic ${Buffer.from(`${cfg.email}:${cfg.token}`).toString('base64')}`

async function searchJql(cfg: JiraConfig, jql: string, fields: string[] = FIELDS): Promise<RawJiraIssue[]> {
  const auth = Buffer.from(`${cfg.email}:${cfg.token}`).toString('base64')
  const issues: RawJiraIssue[] = []
  let nextPageToken: string | undefined

  do {
    const res = await fetch(`${cfg.baseUrl}/rest/api/3/search/jql`, {
      method: 'POST',
      headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ jql, fields, maxResults: 100, nextPageToken }),
      cache: 'no-store',
    })
    if (!res.ok) {
      const body = await res.text()
      throw new Error(`Jira search failed (${res.status}): ${body.slice(0, 300)}`)
    }
    const data = (await res.json()) as { issues?: RawJiraIssue[]; nextPageToken?: string }
    issues.push(...(data.issues ?? []))
    nextPageToken = data.nextPageToken
  } while (nextPageToken)

  return issues
}

/** all epics not yet done */
export function fetchOpenEpics(cfg: JiraConfig) {
  return searchJql(
    cfg,
    `project = "${cfg.projectKey}" AND issuetype = Epic AND statusCategory != Done ORDER BY duedate ASC`
  )
}

/** child issues of the given epics (chunked: JQL "parent in" has practical length limits) */
export async function fetchEpicChildren(cfg: JiraConfig, epicKeys: string[]): Promise<RawJiraIssue[]> {
  const out: RawJiraIssue[] = []
  for (let i = 0; i < epicKeys.length; i += 50) {
    const chunk = epicKeys.slice(i, i + 50)
    out.push(...(await searchJql(cfg, `parent in (${chunk.join(', ')}) ORDER BY duedate ASC`)))
  }
  return out
}

export interface RawSprint {
  id: number
  name: string
  state: 'active' | 'future' | 'closed'
  startDate?: string
  endDate?: string
}

async function agileGet<T>(cfg: JiraConfig, path: string): Promise<T> {
  const res = await fetch(`${cfg.baseUrl}${path}`, {
    headers: { Authorization: authHeader(cfg) },
    cache: 'no-store',
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Jira agile API failed (${res.status}): ${body.slice(0, 300)}`)
  }
  return (await res.json()) as T
}

/** latest sprint on the project's board (active preferred, else newest future) + its issues */
export async function fetchLatestSprint(
  cfg: JiraConfig
): Promise<{ sprint: RawSprint; issues: RawJiraIssue[]; subtasks: RawJiraIssue[] } | null> {
  const boards = await agileGet<{ values: { id: number }[] }>(
    cfg,
    `/rest/agile/1.0/board?projectKeyOrId=${encodeURIComponent(cfg.projectKey)}`
  )
  const board = boards.values?.[0]
  if (!board) return null

  const sprints = await agileGet<{ values: RawSprint[] }>(
    cfg,
    `/rest/agile/1.0/board/${board.id}/sprint?state=active,future`
  )
  const list = sprints.values ?? []
  if (list.length === 0) return null
  const sprint = list.find((s) => s.state === 'active') ?? list[list.length - 1]

  // work items and subtasks fetched separately — issue counts still match Jira's backlog view
  const [issues, subtasks] = await Promise.all([
    searchJql(cfg, `sprint = ${sprint.id} AND issuetype not in subTaskIssueTypes()`),
    searchJql(cfg, `sprint = ${sprint.id} AND issuetype in subTaskIssueTypes() ORDER BY parent ASC`),
  ])
  return { sprint, issues, subtasks }
}

/** board backlog（不在任何 sprint 的票），排除子任務與已完成 */
export async function fetchBacklog(cfg: JiraConfig): Promise<RawJiraIssue[]> {
  const boards = await agileGet<{ values: { id: number }[] }>(
    cfg,
    `/rest/agile/1.0/board?projectKeyOrId=${encodeURIComponent(cfg.projectKey)}`
  )
  const board = boards.values?.[0]
  if (!board) return []

  const jql = encodeURIComponent('issuetype not in subTaskIssueTypes() AND statusCategory != Done')
  const issues: RawJiraIssue[] = []
  let startAt = 0
  for (;;) {
    const page = await agileGet<{ issues?: RawJiraIssue[]; total: number }>(
      cfg,
      `/rest/agile/1.0/board/${board.id}/backlog?startAt=${startAt}&maxResults=100&fields=${FIELDS.join(',')}&jql=${jql}`
    )
    const batch = page.issues ?? []
    issues.push(...batch)
    startAt += batch.length
    if (batch.length === 0 || startAt >= page.total) break
  }
  return issues
}

interface RawTransition {
  id: string
  name: string
  to: { name: string }
}

export type TransitionResult =
  | { ok: true; status: string }
  | { ok: false; error: string; available?: string[] }

/** move an issue to the workflow status whose name matches targetStatus (case-insensitive) */
export async function transitionIssue(cfg: JiraConfig, issueKey: string, targetStatus: string): Promise<TransitionResult> {
  const url = `${cfg.baseUrl}/rest/api/3/issue/${encodeURIComponent(issueKey)}/transitions`
  const headers = { Authorization: authHeader(cfg), 'Content-Type': 'application/json' }

  const listRes = await fetch(url, { headers, cache: 'no-store' })
  if (!listRes.ok) {
    const body = await listRes.text()
    return { ok: false, error: `fetch transitions failed (${listRes.status}): ${body.slice(0, 200)}` }
  }
  const { transitions = [] } = (await listRes.json()) as { transitions?: RawTransition[] }

  const want = targetStatus.toUpperCase()
  const target = transitions.find((t) => t.to.name.toUpperCase() === want)
  if (!target) {
    return {
      ok: false,
      error: `no transition to "${targetStatus}" from current status`,
      available: transitions.map((t) => t.to.name),
    }
  }

  const doRes = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ transition: { id: target.id } }),
    cache: 'no-store',
  })
  if (!doRes.ok) {
    const body = await doRes.text()
    return { ok: false, error: `transition failed (${doRes.status}): ${body.slice(0, 200)}` }
  }
  return { ok: true, status: target.to.name }
}

/**
 * issues stuck in a status, detected in Jira itself via JQL history operators —
 * avoids fetching per-issue changelogs.
 */
export async function fetchStuckKeys(cfg: JiraConfig): Promise<{ stuckTbc: Set<string>; stuckVerify: Set<string> }> {
  const verifyList = VERIFY_STATUSES.map((s) => `"${s}"`).join(', ')
  const [tbc, verify] = await Promise.all([
    searchJql(
      cfg,
      `project = "${cfg.projectKey}" AND status = "${STATUS_TBC}" AND NOT status CHANGED AFTER -${cfg.tbcStuckDays}d AND created <= -${cfg.tbcStuckDays}d`,
      ['status']
    ),
    searchJql(
      cfg,
      `project = "${cfg.projectKey}" AND status in (${verifyList}) AND NOT status CHANGED AFTER -${cfg.verifyStuckDays}d AND created <= -${cfg.verifyStuckDays}d`,
      ['status']
    ),
  ])
  return {
    stuckTbc: new Set(tbc.map((i) => i.key)),
    stuckVerify: new Set(verify.map((i) => i.key)),
  }
}
