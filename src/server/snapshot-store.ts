import 'server-only'

import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

import type { JiraSnapshot } from '@/types/jira'

/*
 * Vercel filesystem is read-only, so production uses Vercel Blob
 * (BLOB_READ_WRITE_TOKEN). Local dev falls back to .cache/snapshot.json.
 * NOTE: blob URLs are public-but-unguessable; switch to KV if that's a concern.
 */

const BLOB_PATH = 'eagle-hq/snapshot.json'
/* on Vercel without Blob, /tmp is the only writable dir — per-instance & ephemeral, lost on cold start */
const FILE_PATH = process.env.VERCEL
  ? '/tmp/eagle-hq-snapshot.json'
  : path.join(process.cwd(), '.cache', 'snapshot.json')

function useBlob() {
  return !!process.env.BLOB_READ_WRITE_TOKEN
}

export async function saveSnapshot(snapshot: JiraSnapshot): Promise<void> {
  const json = JSON.stringify(snapshot)
  if (useBlob()) {
    const { put } = await import('@vercel/blob')
    await put(BLOB_PATH, json, {
      access: 'public',
      contentType: 'application/json',
      addRandomSuffix: false,
      allowOverwrite: true,
      cacheControlMaxAge: 0,
    })
    return
  }
  await mkdir(path.dirname(FILE_PATH), { recursive: true })
  await writeFile(FILE_PATH, json, 'utf8')
}

export async function loadSnapshot(): Promise<JiraSnapshot | null> {
  if (useBlob()) {
    const { head } = await import('@vercel/blob')
    try {
      const meta = await head(BLOB_PATH)
      const res = await fetch(meta.url, { cache: 'no-store' })
      if (!res.ok) return null
      return (await res.json()) as JiraSnapshot
    } catch {
      return null
    }
  }
  try {
    return JSON.parse(await readFile(FILE_PATH, 'utf8')) as JiraSnapshot
  } catch {
    return null
  }
}
