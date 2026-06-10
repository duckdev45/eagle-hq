import type { Lang, Project } from '@/types/team'
import { HQ_I18N } from '@/data/i18n'

import { PixelBoard } from './pixel/pixel-board'

interface ProjectBoardProps {
  projects: Project[]
  onPick: (id: string) => void
  onAdd: () => void
  lang: Lang
  open: boolean
  onToggle: () => void
}

const LAMP_TXT: Record<string, string> = { g: '🟢 ', y: '🟡 ', r: '🔴 ' }

export function ProjectBoard({ projects, onPick, onAdd, lang, open, onToggle }: ProjectBoardProps) {
  const t = HQ_I18N[lang]
  const zh = lang === 'zh'
  const reds = projects.filter((p) => p.light === 'r')

  const addButton = (
    <button className='add-btn' onClick={onAdd} title={t.addProj}>＋</button>
  )

  return (
    <PixelBoard
      title='PROJECTS'
      zhTitle={t.projects}
      headerRight={addButton}
      className='lights'
      open={open}
      onToggle={onToggle}
    >
      {reds.length > 0 && (
        <div className='r-banner'>
          <b>● {reds.length}</b>
          {zh
            ? <> {t.needHead} PM {t.needTail}</>
            : <> need PM&apos;s call</>}
        </div>
      )}
      {projects.map((p) => (
        <div key={p.id} className={`proj ${p.light}`} onClick={() => onPick(p.id)}>
          <span className='lamp' />
          <div className='pinfo'>
            <div className='pname'>{p.id}</div>
            <div className='pstat'>
              {LAMP_TXT[p.light]}{zh ? p.stat : (p.stat_en || p.stat)}
            </div>
          </div>
          <div className='pdue'>{p.due}</div>
          {p.light !== 'g' && (
            <div className='note'>{zh ? p.note : (p.note_en || p.note)}</div>
          )}
        </div>
      ))}
    </PixelBoard>
  )
}
