'use client'

import { useState } from 'react'

import type { Lang, TeamMember } from '@/types/team'
import type { SprintTask } from '@/types/jira'
import { STATUS_DEV_VERIFY, STATUS_IN_PROGRESS, STATUS_TODO, isDevDone } from '@/types/jira'
import { HQ_I18N } from '@/data/i18n'
import { STATUS, STATUS_ORDER } from '@/data/seed'

import { OptionGrid } from './pixel/option-grid'
import { PixelButton } from './pixel/pixel-button'
import { PixelField } from './pixel/pixel-field'
import { PixelSelect, type PixelSelectOption } from './pixel/pixel-select'
import { PixelSheet } from './pixel/pixel-sheet'
import { Scrim } from './pixel/scrim'

export interface JiraTransitionReq {
  issueKey: string
  targetStatus: string
}

interface MemberSheetProps {
  m: TeamMember
  tasks: SprintTask[]
  todayLog: string
  lang: Lang
  onSave: (id: string, patch: Partial<TeamMember>, daily: string, transition: JiraTransitionReq | null) => Promise<void>
  onClose: () => void
}

const PROGRESS_OPTS = [
  { value: STATUS_TODO, zh: '待辦事項', en: 'To do', color: '#9aa0a6' },
  { value: STATUS_IN_PROGRESS, zh: '進行中', en: 'In progress', color: 'var(--st-work)' },
  { value: STATUS_DEV_VERIFY, zh: 'DEV VERIFY', en: 'DEV VERIFY', color: '#7ec97e' },
]

/* Jira 狀態 → 三段進度（TBC 等中間狀態歸到待辦） */
function toProgress(status: string): string {
  if (isDevDone(status)) return STATUS_DEV_VERIFY
  if (status === STATUS_IN_PROGRESS) return STATUS_IN_PROGRESS
  return STATUS_TODO
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

export function MemberSheet({ m, tasks, todayLog, lang, onSave, onClose }: MemberSheetProps) {
  const t = HQ_I18N[lang]
  const zh = lang === 'zh'
  const initialKey = m.taskKey && tasks.some((tk) => tk.key === m.taskKey) ? m.taskKey : ''
  const [taskKey, setTaskKey] = useState(initialKey)
  const [task, setTask] = useState(zh ? m.task : (m.task_en || m.task))
  const [status, setStatus] = useState(m.status)
  const [progress, setProgress] = useState(() => {
    const sel = tasks.find((tk) => tk.key === initialKey)
    return sel ? toProgress(sel.status) : STATUS_TODO
  })
  const [note, setNote] = useState((zh ? m.note : (m.note_en ?? m.note)) || '')
  const [until, setUntil] = useState(m.leaveUntil || '')
  const [daily, setDaily] = useState(todayLog)
  const [busy, setBusy] = useState(false)

  const meta = STATUS[status] ?? {}
  const isLeave = meta.kind === 'leave'
  const accent = (STATUS[status] ?? {}).color ?? 'var(--st-work)'

  const selTask = tasks.find((tk) => tk.key === taskKey)
  const progressChanged = !!selTask && toProgress(selTask.status) !== progress
  const progressLabel = PROGRESS_OPTS.find((p) => p.value === progress)
  const logEntry = selTask && progressChanged && progressLabel
    ? `${selTask.summary} → ${zh ? progressLabel.zh : progressLabel.en}`
    : ''

  const statusOptions = STATUS_ORDER.map((s) => ({
    value: s,
    label: zh ? s : STATUS[s].en,
    color: STATUS[s].color,
  }))

  /* 依 story 分組：標題列 story [epic]，底下列 task */
  const taskOptions = (() => {
    const opts: PixelSelectOption[] = [{ value: '', label: t.manualTask }]
    const seen = new Set<string>()
    for (const tk of tasks) {
      const parent = tk.parentKey ?? '—'
      if (!seen.has(parent)) {
        seen.add(parent)
        opts.push({
          value: `__story_${parent}`,
          label: `${tk.parentSummary ?? parent}${tk.epicSummary ? `［${tk.epicSummary}］` : ''}`,
          hint: parent,
          header: true,
        })
      }
      opts.push({ value: tk.key, label: tk.summary, hint: `${tk.key} · ${tk.status}` })
    }
    return opts
  })()

  const pickTask = (key: string) => {
    setTaskKey(key)
    const sel = tasks.find((tk) => tk.key === key)
    if (sel) {
      setTask(sel.summary)
      setProgress(toProgress(sel.status))
    }
  }

  const save = async () => {
    if (busy) return
    const patch: Partial<TeamMember> = { status, leaveUntil: isLeave ? until : '', taskKey }
    if (zh) { patch.task = task; patch.note = note }
    else { patch.task_en = task; patch.note_en = note }

    let dailyOut = daily.trim()
    if (logEntry) dailyOut = dailyOut ? `${dailyOut}；${logEntry}` : logEntry

    const transition = selTask && progressChanged
      ? { issueKey: selTask.key, targetStatus: progress }
      : null

    setBusy(true)
    try {
      await onSave(m.id, patch, dailyOut, transition)
    } finally {
      setBusy(false)
    }
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
      <PixelButton variant='save' onClick={save} disabled={busy}>{busy ? t.saving : t.save}</PixelButton>
    </>
  )

  return (
    <Scrim onClose={onClose}>
      <PixelSheet headerContent={header} footer={footer} accent={accent} onClose={onClose}>
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

        {tasks.length > 0
          ? (
              <div className='pfield'>
                <label>{t.curTask}</label>
                <PixelSelect
                  value={taskKey}
                  onChange={pickTask}
                  options={taskOptions}
                />
                {taskKey === '' && (
                  <input
                    type='text'
                    value={task}
                    maxLength={44}
                    placeholder={t.taskPlace}
                    onChange={(e) => setTask(e.target.value)}
                    style={{ marginTop: 8 }}
                  />
                )}
              </div>
            )
          : (
              <PixelField
                label={t.curTask}
                value={task}
                maxLength={44}
                placeholder={t.taskPlace}
                onChange={(e) => setTask(e.target.value)}
              />
            )}

        {selTask && (
          <div className='pfield'>
            <label>
              {t.progress}{' '}
              <span className='daily-opt'>{t.progressOpt}</span>
            </label>
            <OptionGrid
              options={PROGRESS_OPTS.map((p) => ({ value: p.value, label: zh ? p.zh : p.en, color: p.color }))}
              selected={progress}
              onSelect={setProgress}
              columns={3}
            />
            {logEntry && (
              <div className='prog-hint'>{t.logPreview}：{logEntry}</div>
            )}
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
