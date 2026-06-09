import type { Lang, Sprint } from '@/types/team'
import { HQ_I18N } from '@/data/i18n'
import { SYM } from '@/data/seed'

import { PixelBoard } from './pixel/pixel-board'

interface BlackboardProps {
  sprint: Sprint
  led: boolean
  lang: Lang
}

export function Blackboard({ sprint, led, lang }: BlackboardProps) {
  const t = HQ_I18N[lang]
  const zh = lang === 'zh'

  return (
    <PixelBoard
      title='SPRINT'
      zhTitle={t.sprint}
      className='blackboard'
      bodyStyle={{ padding: 10 }}
    >
      <div className={`chalk-area${led ? ' led' : ''}`}>
        <div className='wk'>
          <span className='w1'>{sprint.week}</span>
          <span className='w2'>{zh ? sprint.end : sprint.end_en}</span>
        </div>
        {sprint.items.map((it, i) => (
          <div key={i} className={`line ${it.type}`}>
            <span className='sym'>{SYM[it.type]}</span>
            <span className='txt'>
              {zh ? it.txt : it.txt_en}{' '}
              <span className='tag'>[{it.tag}]</span>
            </span>
          </div>
        ))}
      </div>
    </PixelBoard>
  )
}
