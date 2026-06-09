'use client'

import { useState } from 'react'

import type { Lang, TeamMember } from '@/types/team'
import { HQ_I18N } from '@/data/i18n'
import { STATUS, STATUS_ORDER } from '@/data/seed'

import { OptionGrid } from './pixel/option-grid'
import { PixelButton } from './pixel/pixel-button'
import { PixelField } from './pixel/pixel-field'
import { PixelSheet } from './pixel/pixel-sheet'
import { Scrim } from './pixel/scrim'

interface MemberSheetProps {
  m: TeamMember
  todayLog: string
  lang: Lang
  onSave: (id: string, patch: Partial<TeamMember>, daily: string) => void
  onClose: () => void
}

function fmtTs(iso: string) {
  try {
    const d = new Date(iso)
    const p = (n: number) => String(n).padStart(2, '0')
    return `${p(d.getMonth() + 1)}/${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
  } catch {
    return iso
  }
}

export function MemberSheet({ m, todayLog, lang, onSave, onClose }: MemberSheetProps) {
  const t = HQ_I18N[lang]
  const zh = lang === 'zh'
  const [task, setTask] = useState(zh ? m.task : (m.task_en || m.task))
  const [status, setStatus] = useState(m.status)
  const [note, setNote] = useState((zh ? m.note : (m.note_en ?? m.note)) || '')
  const [until, setUntil] = useState(m.leaveUntil || '')
  const [daily, setDaily] = useState(todayLog)

  const meta = STATUS[status] ?? {}
  const isLeave = meta.kind === 'leave'
  const accent = (STATUS[status] ?? {}).color ?? 'var(--st-work)'

  const statusOptions = STATUS_ORDER.map((s) => ({
    value: s,
    label: zh ? s : STATUS[s].en,
    color: STATUS[s].color,
  }))

  const save = () => {
    const patch: Partial<TeamMember> = { status, leaveUntil: isLeave ? until : '' }
    if (zh) { patch.task = task; patch.note = note }
    else { patch.task_en = task; patch.note_en = note }
    onSave(m.id, patch, daily.trim())
  }

  const header = (
    <>
      <div className='av'>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={m.avatar} alt='' />
      </div>
      <div className='who'>
        <div className='nm'>{m.name}</div>
        <div className='rl'>{zh ? m.role : m.role_en}</div>
      </div>
    </>
  )

  const footer = (
    <>
      <span className='ts'>{t.lastUpd} {fmtTs(m.updated_at)}</span>
      <PixelButton variant='ghost' onClick={onClose}>{t.cancel}</PixelButton>
      <PixelButton variant='save' onClick={save}>{t.save}</PixelButton>
    </>
  )

  return (
    <Scrim onClose={onClose}>
      <PixelSheet headerContent={header} footer={footer} accent={accent} onClose={onClose}>
        <PixelField
          label={t.curTask}
          value={task}
          maxLength={44}
          placeholder={t.taskPlace}
          onChange={(e) => setTask(e.target.value)}
        />
        <div className='pfield'>
          <label>{t.status}</label>
          <OptionGrid options={statusOptions} selected={status} onSelect={setStatus} />
        </div>
        {isLeave && (
          <div className='pfield leave-date'>
            <label>{t.backOn}</label>
            <div>
              <input
                type='text'
                value={until}
                placeholder={zh ? '例：6/15' : 'e.g. 6/15'}
                onChange={(e) => setUntil(e.target.value)}
              />
            </div>
          </div>
        )}
        <PixelField
          label={t.note}
          value={note}
          maxLength={54}
          placeholder={t.notePlace}
          onChange={(e) => setNote(e.target.value)}
        />
        <div className='daily-section'>
          <label>
            {t.daily}{' '}
            <span className='daily-opt'>{t.dailyOpt}</span>
          </label>
          <input
            type='text'
            value={daily}
            maxLength={60}
            placeholder={t.dailyPlace}
            onChange={(e) => setDaily(e.target.value)}
            style={{ width: '100%', padding: '12px 13px', background: '#11140f', color: 'var(--ink)', border: '3px solid var(--chrome-line)', fontFamily: 'var(--font-zh, sans-serif)', fontSize: 16 }}
          />
        </div>
      </PixelSheet>
    </Scrim>
  )
}
