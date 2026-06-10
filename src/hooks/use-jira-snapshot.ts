'use client'

import { useQuery } from '@tanstack/react-query'

import type { JiraSnapshot } from '@/types/jira'

/* null = no snapshot yet (Jira not configured / never synced) → UI falls back to seed data */
export function useJiraSnapshot(): JiraSnapshot | null {
  const { data } = useQuery<JiraSnapshot | null>({
    queryKey: ['jira-snapshot'],
    queryFn: async () => {
      const res = await fetch('/api/snapshot', { cache: 'no-store' })
      if (!res.ok) return null
      return (await res.json()) as JiraSnapshot
    },
    refetchInterval: 5 * 60_000,
    staleTime: 60_000,
    retry: 1,
  })
  return data ?? null
}
