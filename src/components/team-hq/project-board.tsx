import type { Lang, Project } from '@/types/team'
import type { EpicHealth } from '@/types/jira'
import { HQ_I18N } from '@/data/i18n'

import { PixelBoard } from './pixel/pixel-board'

interface ProjectBoardProps {
  projects: Project[]
  epics?: EpicHealth[] | null
  onPickEpic?: (key: string) => void
  onPick: (id: string) => void
  onAdd: () => void
  led: boolean
  lang: Lang
  open: boolean
  onToggle: () => void
}

const LAMP_TXT: Record<string, string> = { g: '🟢 ', y: '🟡 ', r: '🔴 ' }

const epicLine = (e: EpicHealth) => {
  if (e.light === 'red') return { cls: 'warn', sym: '!' }
  if (e.counts.total > 0 && e.counts.done === e.counts.total) return { cls: 'done', sym: '✓' }
  return { cls: 'doing', sym: '→' }
}

export function ProjectBoard({ projects, epics, onPickEpic, onPick, onAdd, led, lang, open, onToggle }: ProjectBoardProps) {
  const t = HQ_I18N[lang]
  const zh = lang === 'zh'
  const jiraMode = !!epics && epics.length > 0
  const reds = jiraMode ? epics.filter((e) => e.light === 'red') : projects.filter((p) => p.light === 'r')
  const greens = jiraMode ? epics.filter((e) => e.light === 'green').length : 0

  const addButton = jiraMode
    ? <span className='jira-src'>JIRA</span>
    : <button className='add-btn' onClick={onAdd} title={t.addProj}>＋</button>

  return (
    <PixelBoard
      title='PROJECTS'
      zhTitle={t.projects}
      headerRight={addButton}
      className='lights'
      bodyStyle={jiraMode ? { padding: 10 } : undefined}
      open={open}
      onToggle={onToggle}
    >
      {jiraMode
        ? (
            <div className={`chalk-area${led ? ' led' : ''}`}>
              <div className='wk'>
                <span className='w1'>{epics.length} EPIC</span>
                <span className='w2'>{greens}/{epics.length} {zh ? '綠燈' : 'green'}</span>
              </div>
              {reds.length > 0 && (
                <div className='line warn'>
                  <span className='sym'>!</span>
                  <span className='txt'>
                    {zh
                      ? `${reds.length} ${t.needHead} PM ${t.needTail}`
                      : `${reds.length} need PM's call`}
                  </span>
                </div>
              )}
              {epics.map((e) => {
                const { cls, sym } = epicLine(e)
                return (
                  <div key={e.key} className={`line ${cls} clickable`} onClick={() => onPickEpic?.(e.key)}>
                    <span className='sym'>{sym}</span>
                    <span className='txt'>
                      {e.summary}{' '}
                      <span className='tag'>
                        [{e.key} · {e.counts.done}/{e.counts.total}{e.dueDate ? ` · ${e.dueDate}` : ''}]
                      </span>
                    </span>
                  </div>
                )
              })}
            </div>
          )
        : (
            <>
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
            </>
          )}
    </PixelBoard>
  )
}
