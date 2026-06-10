import type { Lang, TeamMember } from '@/types/team'

import { frameSrc, MEMBER_START, SPRITE_H, SPRITE_W, zOf } from '@/data/office'
import { STATUS } from '@/data/seed'

interface MemberSpriteProps {
  m: TeamMember
  lang: Lang
  selected: boolean
  onSelect: () => void
  onOpen: () => void
  setContainerRef: (el: HTMLDivElement | null) => void
  setImgRef: (el: HTMLImageElement | null) => void
}

export function MemberSprite({ m, lang, selected, onSelect, onOpen, setContainerRef, setImgRef }: MemberSpriteProps) {
  const meta = STATUS[m.status] ?? STATUS['施工中']
  const away = meta.away
  const isVacation = m.status === '休假'
  const leave = meta.kind === 'leave'
  const zh = lang === 'zh'
  const stLabel = zh ? m.status : meta.en
  const task = zh ? m.task : (m.task_en || m.task)
  const back = m.leaveUntil ? (zh ? ` · 回來 ${m.leaveUntil}` : ` · back ${m.leaveUntil}`) : ''
  const start = MEMBER_START[m.id] ?? { x: 480, y: 300 }

  const cls = [
    'ws',
    selected && 'sel',
    away && !isVacation && 'away',
    meta.kind === 'wfh' && 'wfh',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      className={cls}
      ref={setContainerRef}
      style={{ left: start.x, top: start.y, zIndex: zOf(start.y), '--accent': meta.color } as React.CSSProperties}
      onClick={(e) => { e.stopPropagation(); onSelect() }}
      onDoubleClick={(e) => { e.stopPropagation(); onOpen() }}
      role='button'
      tabIndex={0}
      title={zh ? '單擊移動 · 雙擊編輯' : 'click to move · double-click to edit'}
    >
      <div className='badge'>
        <span className='bdot' />
        <span className='blabel'>{stLabel}</span>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={setImgRef}
        className='sprite'
        src={frameSrc(m.id, 'down', 0)}
        alt={m.name}
        width={SPRITE_W}
        height={SPRITE_H}
        draggable={false}
      />
      <div className='nameplate'>
        <div className='nm'>{m.name}</div>
        <div className={`task-chip${leave ? ' leave' : ''}`}>
          {leave ? <>{stLabel}{back}</> : task}
        </div>
      </div>
    </div>
  )
}
