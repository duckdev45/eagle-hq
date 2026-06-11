'use client'

import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'

import { useTeamStore } from '@/store/team.store'
import type { LogEntry, RemoteMemberStatus, RemoteTeamState, TeamMember } from '@/types/team'

/* 定時拉取 Sheet 端狀態並合併進 store；未設定 GSHEET_* 時（503）安靜停用 */
export function useTeamSync() {
  const applyRemote = useTeamStore((s) => s.applyRemote)
  const { data } = useQuery<RemoteTeamState | null>({
    queryKey: ['team-state'],
    queryFn: async () => {
      const res = await fetch('/api/team-state', { cache: 'no-store' })
      if (!res.ok) return null
      return (await res.json()) as RemoteTeamState
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
    retry: 1,
  })

  useEffect(() => {
    if (data) applyRemote(data)
  }, [data, applyRemote])
}

export function toRemoteStatus(m: TeamMember): RemoteMemberStatus {
  return {
    id: m.id,
    status: m.status,
    task: m.task,
    task_en: m.task_en,
    taskKey: m.taskKey ?? '',
    note: m.note,
    note_en: m.note_en,
    leaveUntil: m.leaveUntil ?? '',
    updated_at: m.updated_at,
  }
}

/* fire-and-forget 推送，失敗不阻斷 UI */
export function pushTeamState(payload: { statuses?: RemoteMemberStatus[]; logs?: LogEntry[] }) {
  if (!payload.statuses?.length && !payload.logs?.length) return
  fetch('/api/team-state', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
    .then(async (res) => {
      if (!res.ok && res.status !== 503) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null
        console.error('[team-sync] push failed:', data?.error ?? res.status)
      }
    })
    .catch((err) => console.error('[team-sync] push failed:', err))
}
