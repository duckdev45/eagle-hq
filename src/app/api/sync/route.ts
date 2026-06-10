import { NextResponse } from 'next/server'

import { jiraConfig } from '@/server/jira'
import { runSync } from '@/server/sync'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET
  if (secret && req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  if (!jiraConfig()) {
    return NextResponse.json({ error: 'Jira env not configured (JIRA_BASE_URL / JIRA_USER_EMAIL / JIRA_API_TOKEN)' }, { status: 503 })
  }

  try {
    const snapshot = await runSync()
    return NextResponse.json({ ok: true, generatedAt: snapshot.generatedAt, summary: snapshot.summary })
  } catch (err) {
    console.error('[sync] failed:', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'sync failed' }, { status: 502 })
  }
}
