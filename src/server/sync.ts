import 'server-only'

import type { JiraSnapshot } from '@/types/jira'
import { buildSnapshot } from '@/server/health'
import { fetchEpicChildren, fetchLatestSprint, fetchOpenEpics, fetchStuckKeys, jiraConfig } from '@/server/jira'
import { saveSnapshot } from '@/server/snapshot-store'

export async function runSync(): Promise<JiraSnapshot> {
  const cfg = jiraConfig()
  if (!cfg) throw new Error('Jira env not configured (JIRA_BASE_URL / JIRA_USER_EMAIL / JIRA_API_TOKEN)')

  const epics = await fetchOpenEpics(cfg)
  const [children, { stuckTbc, stuckVerify }, sprint] = await Promise.all([
    fetchEpicChildren(cfg, epics.map((e) => e.key)),
    fetchStuckKeys(cfg),
    fetchLatestSprint(cfg),
  ])

  const snapshot = buildSnapshot({
    projectKey: cfg.projectKey,
    baseUrl: cfg.baseUrl,
    epics,
    children,
    sprint,
    stuckTbc,
    stuckVerify,
    tbcStuckDays: cfg.tbcStuckDays,
    verifyStuckDays: cfg.verifyStuckDays,
  })

  await saveSnapshot(snapshot)
  return snapshot
}
