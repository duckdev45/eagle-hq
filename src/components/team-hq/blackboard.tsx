import type { Lang, Sprint, SprintItemType } from '@/types/team'
import type { SprintHealth } from '@/types/jira'
import { HQ_I18N } from '@/data/i18n'
import { SYM } from '@/data/seed'
import { STATUS_DONE } from '@/types/jira'

import { PixelBoard } from './pixel/pixel-board'

interface BlackboardProps {
  sprint: Sprint
  jiraSprint?: SprintHealth | null
  led: boolean
  lang: Lang
  open: boolean
  onToggle: () => void
}

const fmtDate = (iso: string | null) => {
  if (!iso) return '?'
  const d = new Date(iso)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

/* story 本身完成、或其 sprint 子 task 全數達 DEV VERIFY 以上 → 顯示已完成 */
const lineType = (i: SprintHealth['issues'][number]): SprintItemType =>
  i.status === STATUS_DONE || i.devDone ? 'done' : i.light === 'red' ? 'warn' : 'doing'

export function Blackboard({ sprint, jiraSprint, led, lang, open, onToggle }: BlackboardProps) {
  const t = HQ_I18N[lang]
  const zh = lang === 'zh'

  return (
    <PixelBoard
      title='SPRINT'
      zhTitle={t.sprint}
      className='blackboard'
      bodyStyle={{ padding: 10 }}
      open={open}
      onToggle={onToggle}
    >
      <div className={`chalk-area${led ? ' led' : ''}`}>
        {jiraSprint
          ? (
              <>
                <div className='wk wk-stack'>
                  <span className='w1'>{jiraSprint.name}</span>
                  <span className='w2'>
                    {fmtDate(jiraSprint.startDate)} – {fmtDate(jiraSprint.endDate)} ·{' '}
                    {jiraSprint.counts.done}/{jiraSprint.counts.total} 完成
                  </span>
                </div>
                {jiraSprint.issues.map((i) => {
                  const type = lineType(i)
                  return (
                    <div key={i.key} className={`line ${type}`}>
                      <span className='sym'>{SYM[type]}</span>
                      <span className='txt'>
                        {i.summary} <span className='tag'>[{i.key}]</span>
                      </span>
                    </div>
                  )
                })}
              </>
            )
          : (
              <>
                <div className='wk'>
                  <span className='w1'>{sprint.week}</span>
                  <span className='w2'>{sprint.end}</span>
                </div>
                {sprint.items.map((it, i) => (
                  <div key={i} className={`line ${it.type}`}>
                    <span className='sym'>{SYM[it.type]}</span>
                    <span className='txt'>
                      {it.txt}{' '}
                      <span className='tag'>[{it.tag}]</span>
                    </span>
                  </div>
                ))}
              </>
            )}
      </div>
    </PixelBoard>
  )
}
