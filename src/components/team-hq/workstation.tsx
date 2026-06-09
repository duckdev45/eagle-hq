import type { Lang, StatusMeta, TeamMember } from '@/types/team'
import {
  AlertTriangle,
  ClipboardCheck,
  Coffee,
  Eye,
  MapPin, Plane,
  Thermometer,
  Wifi,
} from 'lucide-react'

import { STATUS } from '@/data/seed'

interface WorkstationProps {
  m: TeamMember
  onPick: (id: string) => void
  lang: Lang
}

function StatusIndicator({ status, meta }: { status: string; meta: StatusMeta }) {
  const sz = 16
  const sw = 2

  if (status === '被卡住')
    return <span className='st-ind ind-block'><AlertTriangle size={sz} strokeWidth={sw + 0.5} /></span>
  if (status === '休息中')
    return <span className='st-ind ind-rest'><Coffee size={sz} strokeWidth={sw} /></span>
  if (meta?.kind === 'wfh')
    return <span className='st-ind ind-wfh'><Wifi size={sz} strokeWidth={sw} /></span>
  if (status === '驗收中')
    return <span className='st-ind ind-review'><ClipboardCheck size={sz} strokeWidth={sw} /></span>
  if (status === '外出')
    return <span className='st-ind ind-ooo'><MapPin size={sz} strokeWidth={sw} /></span>
  if (status === '休假')
    return <span className='st-ind ind-vac'><Plane size={sz} strokeWidth={sw} /></span>
  if (status === '病假')
    return <span className='st-ind ind-sick'><Thermometer size={sz} strokeWidth={sw} /></span>
  if (status === '查閱中')
    return <span className='st-ind ind-oversee'><Eye size={sz} strokeWidth={sw} /></span>
  return null
}

export function Workstation({ m, onPick, lang }: WorkstationProps) {
  const meta = STATUS[m.status] ?? STATUS['施工中']
  const away = meta.away
  const isVacation = m.status === '休假'
  const leave = meta.kind === 'leave'
  const wfh = meta.kind === 'wfh'
  const zh = lang === 'zh'
  const stLabel = zh ? m.status : meta.en
  const task = zh ? m.task : (m.task_en || m.task)
  const back = m.leaveUntil ? (zh ? ` · 回來 ${m.leaveUntil}` : ` · back ${m.leaveUntil}`) : ''

  const cls = [
    'ws',
    !away && 'idle',
    meta.kind === 'work' && 'working',
    wfh && 'wfh',
    isVacation && 'vacation',
    away && !isVacation && 'away',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      className={cls}
      style={{ left: `${m.x}%`, top: `${m.y}%`, transform: 'translate(-50%,0)', '--accent': meta.color } as React.CSSProperties}
      onClick={() => onPick(m.id)}
      role='button'
      tabIndex={0}
    >
      <div className='seat'>
        <div className='badge'>
          <span className='bdot' />
          <span className='blabel'>{stLabel}</span>
        </div>
        <div className='avatar'>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={m.avatar} alt={m.name} draggable={false} />
        </div>
        <StatusIndicator status={m.status} meta={meta} />
        <div className='desk'>
          <div className='monitor'><div className='scr' /></div>
          <div className='top' />
          <div className='legs'><i /><i /></div>
        </div>
        <div className='nameplate'>
          <div className='nm'>{m.name}</div>
          <div className={`task-chip${leave ? ' leave' : ''}`}>
            {leave ? <>{stLabel}{back}</> : task}
          </div>
        </div>
      </div>
    </div>
  )
}
