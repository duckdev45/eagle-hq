import { NextResponse, after } from 'next/server'

import { jiraConfig } from '@/server/jira'
import { loadSnapshot } from '@/server/snapshot-store'
import { runSync } from '@/server/sync'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const STALE_MS = 10 * 60_000

/* per-instance guard so concurrent viewers don't stampede Jira */
let syncing = false

async function revalidate() {
  if (syncing) return
  syncing = true
  try {
    await runSync()
  } catch (err) {
    console.error('[snapshot] background revalidate failed:', err)
  } finally {
    syncing = false
  }
}

export async function GET() {
  const snapshot = await loadSnapshot()

  /* first run: no snapshot yet — sync inline so the first viewer still gets data */
  if (!snapshot) {
    if (!jiraConfig()) {
      return NextResponse.json({ error: 'no snapshot and Jira env not configured' }, { status: 404 })
    }
    try {
      return NextResponse.json(await runSync())
    } catch (err) {
      console.error('[snapshot] initial sync failed:', err)
      return NextResponse.json({ error: err instanceof Error ? err.message : 'sync failed' }, { status: 502 })
    }
  }

  /* stale-while-revalidate: serve current data, refresh in the background */
  const age = Date.now() - new Date(snapshot.generatedAt).getTime()
  if (age > STALE_MS && jiraConfig()) after(revalidate)

  return NextResponse.json(snapshot)
}
