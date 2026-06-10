import { NextResponse } from 'next/server'

import { loadSnapshot } from '@/server/snapshot-store'

export const dynamic = 'force-dynamic'

export async function GET() {
  const snapshot = await loadSnapshot()
  if (!snapshot) {
    return NextResponse.json({ error: 'no snapshot yet — run /api/sync first' }, { status: 404 })
  }
  return NextResponse.json(snapshot)
}
