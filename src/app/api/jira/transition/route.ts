import { NextResponse } from 'next/server'

import { STATUS_DEV_VERIFY, STATUS_IN_PROGRESS, STATUS_TODO } from '@/types/jira'
import { jiraConfig, transitionIssue } from '@/server/jira'
import { runSync } from '@/server/sync'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const ALLOWED_TARGETS = new Set([STATUS_TODO, STATUS_IN_PROGRESS, STATUS_DEV_VERIFY])

export async function POST(req: Request) {
  const cfg = jiraConfig()
  if (!cfg) {
    return NextResponse.json({ error: 'Jira env not configured' }, { status: 503 })
  }

  let body: { issueKey?: unknown; targetStatus?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 })
  }

  const { issueKey, targetStatus } = body
  if (typeof issueKey !== 'string' || !/^[A-Za-z][A-Za-z0-9_]*-\d+$/.test(issueKey)) {
    return NextResponse.json({ error: 'invalid issueKey' }, { status: 400 })
  }
  if (typeof targetStatus !== 'string' || !ALLOWED_TARGETS.has(targetStatus.toUpperCase())) {
    return NextResponse.json({ error: `targetStatus must be one of: ${[...ALLOWED_TARGETS].join(', ')}` }, { status: 400 })
  }

  const result = await transitionIssue(cfg, issueKey, targetStatus)
  if (!result.ok) {
    return NextResponse.json({ error: result.error, available: result.available ?? [] }, { status: 409 })
  }

  /* refresh the snapshot inline so the client's next refetch already sees the new status */
  try {
    await runSync()
  } catch (err) {
    console.error('[transition] post-transition sync failed:', err)
  }

  return NextResponse.json({ ok: true, status: result.status })
}
