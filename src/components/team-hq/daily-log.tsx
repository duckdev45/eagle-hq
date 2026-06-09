'use client'

import { useState } from 'react'

import type { Lang, LogEntry, TeamMember } from '@/types/team'
import { HQ_I18N } from '@/data/i18n'

import { Scrim } from './pixel/scrim'

interface DailyLogProps {
  team: TeamMember[]
  logs: LogEntry[]
  today: string
  lang: Lang
  onSaveLog: (id: string, text: string) => void
  onClose: () => void
}

export function DailyLog({ team, logs, today, lang, onSaveLog, onClose }: DailyLogProps) {
  const t = HQ_I18N[lang]
  const zh = lang === 'zh'
  const todayMap = Object.fromEntries(
    logs.filter((l) => l.date === today).map((l) => [l.id, l])
  )
  const loggedCount = team.filter((m) => todayMap[m.id]).length
  const [drafts, setDrafts] = useState<Record<string, string>>({})

  const getVal = (id: string) =>
    drafts[id] !== undefined
      ? drafts[id]
      : todayMap[id]
      ? (zh ? todayMap[id].done : (todayMap[id].done_en || todayMap[id].done))
      : ''

  const hist = logs
    .filter((l) => l.date !== today)
    .sort((a, b) => (a.date < b.date ? 1 : -1))

  const nameOf = (id: string) => team.find((m) => m.id === id)?.name ?? id

  return (
    <Scrim onClose={onClose}>
      <div className='logsheet' onClick={(e) => e.stopPropagation()}>
        <header>
          <span className='lt'>{t.logTitle}</span>
          <span className='ld'>{today}</span>
          <span className='ld' style={{ color: 'var(--st-work)' }}>· {loggedCount}/{team.length}</span>
          <button className='x' onClick={onClose}>✕</button>
        </header>
        <div className='log-body'>
          <div>
            <div className='log-sec'>
              <span>{t.today}</span>
              <span className='cnt'>{loggedCount}/{team.length} {t.logged}</span>
            </div>
            <div className='log-today'>
              {team.map((m) => {
                const done = !!todayMap[m.id]
                return (
                  <div key={m.id} className={`log-row${done ? ' done' : ''}`}>
                    <div className='lav'>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={m.avatar} alt='' />
                    </div>
                    <div className='lmain'>
                      <div className='lname'>{m.name}</div>
                      <input
                        value={getVal(m.id)}
                        maxLength={60}
                        placeholder={done ? '' : t.noEntry}
                        onChange={(e) => setDrafts({ ...drafts, [m.id]: e.target.value })}
                        onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
                        onBlur={(e) => { const v = e.target.value.trim(); if (v) onSaveLog(m.id, v) }}
                      />
                    </div>
                    <span className={`ltag ${done ? 'don' : 'pen'}`}>
                      {done ? t.logged : t.pending}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
          {hist.length > 0 && (
            <div>
              <div className='log-sec'><span>{t.recent}</span></div>
              <div className='log-hist'>
                {hist.map((l, i) => (
                  <div key={i} className='hist-row'>
                    <span className='hd'>{l.date.slice(5)}</span>
                    <span className='hn'>{nameOf(l.id)}</span>
                    <span className='ht'>{zh ? l.done : (l.done_en || l.done)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Scrim>
  )
}
