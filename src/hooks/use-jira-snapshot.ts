'use client'

import { useQuery } from '@tanstack/react-query'

import type { JiraSnapshot } from '@/types/jira'

/* null = no snapshot yet (Jira not configured / never synced) → UI falls back to seed data */
export function useJiraSnapshot(): { snapshot: JiraSnapshot | null; loading: boolean } {
  const { data, isLoading } = useQuery<JiraSnapshot | null>({
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
  return { snapshot: data ?? null, loading: isLoading }
}
