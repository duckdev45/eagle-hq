import { NextResponse } from 'next/server'

import { buildSnapshot } from '@/server/health'
import { fetchEpicChildren, fetchLatestSprint, fetchOpenEpics, fetchStuckKeys, jiraConfig } from '@/server/jira'
import { saveSnapshot } from '@/server/snapshot-store'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET
  if (secret && req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const cfg = jiraConfig()
  if (!cfg) {
    return NextResponse.json({ error: 'Jira env not configured (JIRA_BASE_URL / JIRA_USER_EMAIL / JIRA_API_TOKEN)' }, { status: 503 })
  }

  try {
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
    return NextResponse.json({ ok: true, generatedAt: snapshot.generatedAt, summary: snapshot.summary })
  } catch (err) {
    console.error('[sync] failed:', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'sync failed' }, { status: 502 })
  }
}
