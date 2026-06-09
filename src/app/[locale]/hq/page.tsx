import type { Metadata } from 'next'

import { Cabinet } from '@/components/team-hq/cabinet'

import '@/components/team-hq/team-hq.css'

export const metadata: Metadata = {
  title: 'Eagle AI · Team HQ',
  description: 'Team Command Center',
}

export default function HqPage() {
  return <Cabinet />
}
