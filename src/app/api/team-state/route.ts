import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

function sheetConfig() {
  const url = process.env.GSHEET_WEBAPP_URL
  const secret = process.env.GSHEET_SECRET
  if (!url || !secret) return null
  return { url, secret }
}

export async function GET() {
  const cfg = sheetConfig()
  if (!cfg) return NextResponse.json({ error: 'sheet sync not configured' }, { status: 503 })

  try {
    const res = await fetch(`${cfg.url}?secret=${encodeURIComponent(cfg.secret)}`, {
      cache: 'no-store',
      redirect: 'follow',
    })
    if (!res.ok) {
      return NextResponse.json({ error: `sheet fetch failed (${res.status})` }, { status: 502 })
    }
    const data = (await res.json()) as { error?: string; statuses?: unknown[]; logs?: unknown[] }
    if (data.error) return NextResponse.json({ error: data.error }, { status: 502 })
    /* 舊版 Apps Script 可能把日期切成 "Thu Jun 11"（丟失年份、無法還原）— 這種列剔除；Sheet 內原始資料不受影響 */
    const logs = (data.logs ?? []).flatMap((l) => {
      const date = String((l as { date?: unknown }).date ?? '')
      const m = date.match(/^(\d{4}-\d{2}-\d{2})/)
      return m ? [{ ...(l as object), date: m[1] }] : []
    })
    return NextResponse.json({ statuses: data.statuses ?? [], logs })
  } catch (err) {
    console.error('[team-state] GET failed:', err)
    return NextResponse.json({ error: 'sheet unreachable' }, { status: 502 })
  }
}

export async function POST(req: Request) {
  const cfg = sheetConfig()
  if (!cfg) return NextResponse.json({ error: 'sheet sync not configured' }, { status: 503 })

  let body: { statuses?: unknown; logs?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 })
  }
  const statuses = Array.isArray(body.statuses) ? body.statuses.slice(0, 50) : []
  const logs = Array.isArray(body.logs) ? body.logs.slice(0, 50) : []
  if (statuses.length === 0 && logs.length === 0) {
    return NextResponse.json({ error: 'nothing to write' }, { status: 400 })
  }

  try {
    /* Apps Script web apps respond via 302; text/plain body avoids extra handling on their side */
    const res = await fetch(cfg.url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ secret: cfg.secret, statuses, logs }),
      redirect: 'follow',
      cache: 'no-store',
    })
    if (!res.ok) {
      return NextResponse.json({ error: `sheet write failed (${res.status})` }, { status: 502 })
    }
    const data = (await res.json()) as { ok?: boolean; error?: string }
    if (!data.ok) return NextResponse.json({ error: data.error ?? 'sheet write rejected' }, { status: 502 })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[team-state] POST failed:', err)
    return NextResponse.json({ error: 'sheet unreachable' }, { status: 502 })
  }
}
