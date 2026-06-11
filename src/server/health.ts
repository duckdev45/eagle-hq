import 'server-only'

import type { EpicHealth, HealthLight, JiraIssueLite, JiraSnapshot, MemberLoad, SprintHealth, SprintTask } from '@/types/jira'
import { STATUS_DONE, isDevDone } from '@/types/jira'
import type { RawJiraIssue, RawSprint } from '@/server/jira'

/* Jira assignee displayName → office member id（'自動' 是 bot，不對應人） */
export const ASSIGNEE_TO_MEMBER: Record<string, string> = {
  duck: 'duck',
  'Lee Pan': 'lee',
  Wesley: 'wesley',
  Jared: 'jared',
  Margaret: 'margaret',
}

const EPIC_RED_THRESHOLD = 3 // 紅燈票數 ≥ 3 → epic 紅燈

function isOverdue(dueDate: string | null, status: string, today: string): boolean {
  return !!dueDate && dueDate < today && status !== STATUS_DONE
}

function judgeIssue(
  raw: RawJiraIssue,
  stuckTbc: Set<string>,
  stuckVerify: Set<string>,
  tbcStuckDays: number,
  verifyStuckDays: number,
  today: string
): JiraIssueLite {
  const status = raw.fields.status.name
  const dueDate = raw.fields.duedate
  const reasons: string[] = []
  let light: HealthLight = 'green'

  if (stuckTbc.has(raw.key)) {
    light = 'red'
    reasons.push(`卡在 TBC ≥ ${tbcStuckDays} 天`)
  }
  if (isOverdue(dueDate, status, today)) {
    light = 'red'
    reasons.push(`已過期（${dueDate}）`)
  }
  if (light !== 'red' && stuckVerify.has(raw.key)) {
    light = 'yellow'
    reasons.push(`${status} 超過 ${verifyStuckDays} 天未推進`)
  }

  return {
    key: raw.key,
    summary: raw.fields.summary,
    status,
    assignee: raw.fields.assignee?.displayName ?? null,
    dueDate,
    light,
    reasons,
  }
}

function judgeEpic(epic: RawJiraIssue, issues: JiraIssueLite[], today: string): EpicHealth {
  const status = epic.fields.status.name
  const dueDate = epic.fields.duedate
  const red = issues.filter((i) => i.light === 'red').length
  const yellow = issues.filter((i) => i.light === 'yellow').length
  const done = issues.filter((i) => i.status === STATUS_DONE).length
  const byStatus: Record<string, number> = {}
  for (const i of issues) byStatus[i.status] = (byStatus[i.status] ?? 0) + 1

  const reasons: string[] = []
  let light: HealthLight = 'green'

  if (isOverdue(dueDate, status, today)) {
    light = 'red'
    reasons.push(`Epic 已過期（${dueDate}）`)
  }
  if (red >= EPIC_RED_THRESHOLD) {
    light = 'red'
    reasons.push(`${red} 張紅燈票`)
  }
  if (light !== 'red' && red > 0) {
    light = 'yellow'
    reasons.push(`${red} 張紅燈票`)
  }
  if (light !== 'red' && yellow >= 3) {
    light = 'yellow'
    reasons.push(`${yellow} 張票卡在 VERIFY`)
  }

  return {
    key: epic.key,
    summary: epic.fields.summary,
    status,
    dueDate,
    light,
    reasons,
    counts: { total: issues.length, done, red, yellow, byStatus },
    issues,
  }
}

function aggregateMembers(epics: EpicHealth[]): MemberLoad[] {
  const map = new Map<string, MemberLoad>()
  for (const epic of epics) {
    for (const i of epic.issues) {
      if (!i.assignee || i.status === STATUS_DONE) continue
      const m = map.get(i.assignee) ?? {
        assignee: i.assignee,
        memberId: ASSIGNEE_TO_MEMBER[i.assignee] ?? null,
        red: 0,
        yellow: 0,
        total: 0,
      }
      m.total += 1
      if (i.light === 'red') m.red += 1
      if (i.light === 'yellow') m.yellow += 1
      map.set(i.assignee, m)
    }
  }
  return [...map.values()].sort((a, b) => b.red - a.red || b.yellow - a.yellow)
}

function judgeSprint(
  raw: { sprint: RawSprint; issues: RawJiraIssue[]; subtasks: RawJiraIssue[] } | null,
  judge: (issue: RawJiraIssue) => JiraIssueLite,
  epicSummaries: Map<string, string>
): SprintHealth | null {
  if (!raw) return null

  const storySummary = new Map(raw.issues.map((i) => [i.key, i.fields.summary]))
  const storyEpic = new Map(raw.issues.map((i) => [i.key, i.fields.parent?.key]))

  const tasks: SprintTask[] = raw.subtasks.map((t) => {
    const assignee = t.fields.assignee?.displayName ?? null
    const parentKey = t.fields.parent?.key ?? null
    const epicKey = parentKey ? storyEpic.get(parentKey) : undefined
    return {
      key: t.key,
      summary: t.fields.summary,
      status: t.fields.status.name,
      assignee,
      memberId: assignee ? ASSIGNEE_TO_MEMBER[assignee] ?? null : null,
      parentKey,
      parentSummary: parentKey ? storySummary.get(parentKey) ?? null : null,
      epicSummary: epicKey ? epicSummaries.get(epicKey) ?? null : null,
    }
  })

  const byParent = new Map<string, SprintTask[]>()
  for (const t of tasks) {
    if (!t.parentKey) continue
    const list = byParent.get(t.parentKey) ?? []
    list.push(t)
    byParent.set(t.parentKey, list)
  }

  const issues = raw.issues.map((i) => {
    const lite = judge(i)
    const subs = byParent.get(i.key) ?? []
    if (subs.length > 0 && subs.every((t) => isDevDone(t.status))) lite.devDone = true
    return lite
  })

  return {
    id: raw.sprint.id,
    name: raw.sprint.name,
    state: raw.sprint.state,
    /* full ISO — Jira sprint dates are UTC (16:00Z = next-day midnight in Taipei), client formats in local TZ */
    startDate: raw.sprint.startDate ?? null,
    endDate: raw.sprint.endDate ?? null,
    counts: {
      total: issues.length,
      done: issues.filter((i) => i.status === STATUS_DONE || i.devDone).length,
      red: issues.filter((i) => i.light === 'red').length,
      yellow: issues.filter((i) => i.light === 'yellow').length,
    },
    issues,
    tasks,
  }
}

export function buildSnapshot(input: {
  projectKey: string
  baseUrl: string
  epics: RawJiraIssue[]
  children: RawJiraIssue[]
  sprint?: { sprint: RawSprint; issues: RawJiraIssue[]; subtasks: RawJiraIssue[] } | null
  stuckTbc: Set<string>
  stuckVerify: Set<string>
  tbcStuckDays: number
  verifyStuckDays: number
}): JiraSnapshot {
  const today = new Date().toISOString().slice(0, 10)
  const judge = (raw: RawJiraIssue) =>
    judgeIssue(raw, input.stuckTbc, input.stuckVerify, input.tbcStuckDays, input.verifyStuckDays, today)

  const byEpic = new Map<string, JiraIssueLite[]>()
  for (const raw of input.children) {
    const parent = raw.fields.parent?.key
    if (!parent) continue
    const lite = judge(raw)
    const list = byEpic.get(parent) ?? []
    list.push(lite)
    byEpic.set(parent, list)
  }

  const order: Record<HealthLight, number> = { red: 0, yellow: 1, green: 2 }
  const epics = input.epics
    .map((e) => judgeEpic(e, byEpic.get(e.key) ?? [], today))
    .sort((a, b) => order[a.light] - order[b.light])

  return {
    generatedAt: new Date().toISOString(),
    projectKey: input.projectKey,
    baseUrl: input.baseUrl,
    summary: {
      epics: epics.length,
      red: epics.filter((e) => e.light === 'red').length,
      yellow: epics.filter((e) => e.light === 'yellow').length,
      green: epics.filter((e) => e.light === 'green').length,
    },
    epics,
    members: aggregateMembers(epics),
    sprint: judgeSprint(
      input.sprint ?? null,
      judge,
      new Map(input.epics.map((e) => [e.key, e.fields.summary]))
    ),
  }
}
