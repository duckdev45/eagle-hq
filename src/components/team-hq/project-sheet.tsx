'use client'

import { useState } from 'react'

import type { Lang, Light, Project } from '@/types/team'
import { HQ_I18N } from '@/data/i18n'

import { OptionGrid } from './pixel/option-grid'
import { PixelButton } from './pixel/pixel-button'
import { PixelField } from './pixel/pixel-field'
import { PixelSheet } from './pixel/pixel-sheet'
import { Scrim } from './pixel/scrim'

interface ProjectSheetProps {
  p: Project
  isNew?: boolean
  lang: Lang
  onSave: (origId: string | null, patch: Omit<Project, 'stat' | 'stat_en'> & { light: Light }) => void
  onDelete?: (id: string) => void
  onClose: () => void
}

const LIGHT_COLORS: Record<string, string> = {
  g: 'var(--lite-green)',
  y: 'var(--lite-yellow)',
  r: 'var(--lite-red)',
}

export function ProjectSheet({ p, isNew, lang, onSave, onDelete, onClose }: ProjectSheetProps) {
  const t = HQ_I18N[lang]
  const zh = lang === 'zh'
  const [pid, setPid] = useState(p.id)
  const [light, setLight] = useState<Light>(p.light)
  const [note, setNote] = useState(zh ? p.note : (p.note_en || p.note))
  const [due, setDue] = useState(p.due)

  const signalOptions = [
    { value: 'g', label: zh ? '🟢 照計畫進行' : '🟢 On track' },
    { value: 'y', label: zh ? '🟡 有風險' : '🟡 At risk' },
    { value: 'r', label: zh ? '🔴 需 PM 決策' : '🔴 Needs PM' },
  ]

  const save = () => {
    const id = (pid || '').trim() || 'new-project'
    const patch = { id, light, due, note: '', note_en: '' }
    if (zh) patch.note = note; else patch.note_en = note
    onSave(isNew ? null : p.id, patch)
  }

  const header = (
    <div className='who'>
      <div className='nm'>{isNew ? t.newProj : p.id}</div>
      <div className='rl'>{t.projects}</div>
    </div>
  )

  const footer = (
    <>
      {!isNew && onDelete && (
        <PixelButton variant='danger' style={{ marginRight: 'auto' }} onClick={() => onDelete(p.id)}>
          {t.delProj}
        </PixelButton>
      )}
      {isNew && <span className='ts'>{t.syncNote}</span>}
      <PixelButton variant='ghost' onClick={onClose}>{t.cancel}</PixelButton>
      <PixelButton variant='save' onClick={save}>{t.save}</PixelButton>
    </>
  )

  return (
    <Scrim onClose={onClose}>
      <PixelSheet headerContent={header} footer={footer} accent={LIGHT_COLORS[light]} onClose={onClose}>
        {isNew && (
          <PixelField
            label={t.projId}
            value={pid}
            maxLength={24}
            placeholder='e.g. new-feature'
            onChange={(e) => setPid(e.target.value)}
          />
        )}
        <div className='pfield'>
          <label>{t.signal}</label>
          <OptionGrid options={signalOptions} selected={light} onSelect={(v) => setLight(v as Light)} columns={3} />
        </div>
        <PixelField
          label={t.statusNote}
          value={note}
          maxLength={52}
          onChange={(e) => setNote(e.target.value)}
        />
        <PixelField
          label={t.due}
          value={due}
          placeholder='6/20'
          onChange={(e) => setDue(e.target.value)}
        />
      </PixelSheet>
    </Scrim>
  )
}
