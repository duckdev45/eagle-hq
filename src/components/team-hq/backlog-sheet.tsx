'use client'

import type { BacklogItem } from '@/types/jira'
import type { Lang } from '@/types/team'
import { HQ_I18N } from '@/data/i18n'

import { Scrim } from './pixel/scrim'

interface BacklogSheetProps {
  items: BacklogItem[]
  baseUrl?: string
  lang: Lang
  onClose: () => void
}

const LIGHT_COLOR: Record<string, string | undefined> = {
  red: 'var(--lite-red)',
  yellow: 'var(--lite-yellow)',
}

export function BacklogSheet({ items, baseUrl, lang, onClose }: BacklogSheetProps) {
  const t = HQ_I18N[lang]

  const groups = new Map<string, BacklogItem[]>()
  for (const it of items) {
    const key = it.epicSummary ?? t.noEpic
    const list = groups.get(key)
    if (list) list.push(it)
    else groups.set(key, [it])
  }

  return (
    <Scrim onClose={onClose}>
      <div className='logsheet' onClick={(e) => e.stopPropagation()}>
        <header>
          <span className='lt'>{t.backlog}</span>
          <span className='ld'>{items.length}</span>
          <button className='x' onClick={onClose}>✕</button>
        </header>
        <div className='log-body'>
          {items.length === 0 && <div className='tlog-empty'>{t.noBacklog}</div>}
          {[...groups].map(([epic, list]) => (
            <div key={epic}>
              <div className='log-sec'>
                <span>{epic}</span>
                <span className='cnt'>{list.length}</span>
              </div>
              <div className='log-hist'>
                {list.map((it) => (
                  <div
                    key={it.key}
                    className='hist-row bl-row'
                    onClick={baseUrl ? () => window.open(`${baseUrl}/browse/${it.key}`, '_blank', 'noopener') : undefined}
                    title={it.reasons.join('；') || undefined}
                  >
                    <span className='hd'>{it.key}</span>
                    <span className='ht'>{it.summary}</span>
                    <span className='bl-st' style={{ color: LIGHT_COLOR[it.light] }}>
                      {it.status}
                      {it.assignee ? ` · ${it.assignee}` : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Scrim>
  )
}
