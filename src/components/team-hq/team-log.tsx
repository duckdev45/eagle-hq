'use client'

import { useState } from 'react'

import type { Lang, LogEntry, TeamMember } from '@/types/team'
import { HQ_I18N } from '@/data/i18n'

import { Scrim } from './pixel/scrim'

interface TeamLogProps {
  team: TeamMember[]
  logs: LogEntry[]
  lang: Lang
  onClose: () => void
}

const RANGES = [7, 14, 30]

export function TeamLog({ team, logs, lang, onClose }: TeamLogProps) {
  const t = HQ_I18N[lang]
  const zh = lang === 'zh'
  const [days, setDays] = useState(7)

  const cutoff = new Date(Date.now() - (days - 1) * 86400000).toISOString().slice(0, 10)
  const order = new Map(team.map((m, i) => [m.id, i]))
  const byDate = new Map<string, LogEntry[]>()
  for (const l of logs) {
    if (l.date < cutoff) continue
    const arr = byDate.get(l.date)
    if (arr) arr.push(l)
    else byDate.set(l.date, [l])
  }
  const dates = [...byDate.keys()].sort((a, b) => (a < b ? 1 : -1))

  const memberOf = (id: string) => team.find((m) => m.id === id)

  return (
    <Scrim onClose={onClose}>
      <div className='logsheet' onClick={(e) => e.stopPropagation()}>
        <header>
          <span className='lt'>{t.teamLog}</span>
          <div className='tlog-range'>
            {RANGES.map((n) => (
              <button key={n} className={days === n ? 'on' : ''} onClick={() => setDays(n)}>
                {zh ? `${n}天` : `${n}D`}
              </button>
            ))}
          </div>
          <button className='x' onClick={onClose}>✕</button>
        </header>
        <div className='log-body'>
          {dates.length === 0 && <div className='tlog-empty'>{t.noLogs}</div>}
          {dates.map((date) => (
            <div key={date}>
              <div className='log-sec'>
                <span>{date}</span>
                <span className='cnt'>{byDate.get(date)!.length}/{team.length}</span>
              </div>
              <div className='log-hist'>
                {byDate
                  .get(date)!
                  .sort((a, b) => (order.get(a.id) ?? 99) - (order.get(b.id) ?? 99))
                  .map((l) => {
                    const m = memberOf(l.id)
                    return (
                      <div key={l.id} className='hist-row tlog-row'>
                        <span className='hav'>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          {m && <img src={m.avatar} alt='' />}
                        </span>
                        <span className='hn'>{m?.name ?? l.id}</span>
                        <span className='ht'>{zh ? l.done : (l.done_en || l.done)}</span>
                      </div>
                    )
                  })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Scrim>
  )
}
