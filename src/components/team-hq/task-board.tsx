import type { Lang, TeamMember } from '@/types/team'
import type { SprintHealth, SprintTask } from '@/types/jira'
import { STATUS_IN_PROGRESS, isDevDone } from '@/types/jira'
import { HQ_I18N } from '@/data/i18n'

import { PixelBoard } from './pixel/pixel-board'

interface TaskBoardProps {
  sprint: SprintHealth
  team: TeamMember[]
  led: boolean
  lang: Lang
  open: boolean
  onToggle: () => void
}

const taskLine = (task: SprintTask) =>
  isDevDone(task.status)
    ? { cls: 'done', sym: '✓' }
    : task.status === STATUS_IN_PROGRESS
      ? { cls: 'doing', sym: '→' }
      : { cls: 'todo', sym: '·' }

export function TaskBoard({ sprint, team, led, lang, open, onToggle }: TaskBoardProps) {
  const t = HQ_I18N[lang]
  const zh = lang === 'zh'

  /* 依團隊順序分組，未對應的 assignee 與未指派排最後 */
  const groups: { label: string; tasks: SprintTask[] }[] = []
  for (const member of team) {
    const mine = sprint.tasks.filter((task) => task.memberId === member.id)
    if (mine.length) groups.push({ label: member.name, tasks: mine })
  }
  const others = sprint.tasks.filter((task) => !task.memberId)
  const byName = new Map<string, SprintTask[]>()
  for (const task of others) {
    const name = task.assignee ?? t.unassigned
    const list = byName.get(name) ?? []
    list.push(task)
    byName.set(name, list)
  }
  for (const [label, tasks] of byName) groups.push({ label, tasks })

  const doneCount = sprint.tasks.filter((task) => isDevDone(task.status)).length

  return (
    <PixelBoard
      title='TASKS'
      zhTitle={t.tasksBoard}
      headerRight={<span className='jira-src'>JIRA</span>}
      className='taskboard'
      bodyStyle={{ padding: 10 }}
      open={open}
      onToggle={onToggle}
    >
      <div className={`chalk-area${led ? ' led' : ''}`}>
        {/*<div className='wk'>*/}
        {/*  <span className='w1'>{sprint.name}</span>*/}
        {/*  <span className='w2'>{doneCount}/{sprint.tasks.length} {zh ? '完成' : 'done'}</span>*/}
        {/*</div>*/}
        {groups.map((g) => (
          <div key={g.label} className='task-group'>
            <div className='tg-head'>
              {g.label}
              <span className='tg-count'>
                {g.tasks.filter((task) => isDevDone(task.status)).length}/{g.tasks.length}
              </span>
            </div>
            {g.tasks.map((task) => {
              const { cls, sym } = taskLine(task)
              const done = cls === 'done'
              return (
                <div key={task.key} className={`line ${cls}`}>
                  <span className='sym'>{sym}</span>
                  <span className='txt'>
                    {task.summary}{' '}
                    <span className='tag'>[{task.key} · {task.status}]</span>
                    {done && <span className='done-tag'>{t.doneTag}</span>}
                  </span>
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </PixelBoard>
  )
}
