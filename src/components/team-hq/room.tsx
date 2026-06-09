import type { FloorThemeDef, Lang, TeamMember } from '@/types/team'
import { HQ_I18N } from '@/data/i18n'

import { Workstation } from './workstation'
import React from "react";

interface RoomProps {
  team: TeamMember[]
  onPick: (id: string) => void
  theme: FloorThemeDef
  lang: Lang
  onOpenLog: () => void
  loggedToday: number
}

export function Room({ team, onPick, theme, lang, onOpenLog, loggedToday }: RoomProps) {
  const t = HQ_I18N[lang]
  return (
    <div
      className='room'
      style={
        {
          '--room-floor-a': theme.fa,
          '--room-floor-b': theme.fb,
          '--room-wall': theme.wall,
        } as React.CSSProperties
      }
    >
      <div className='wall' />

      {/* wall decor */}
      <div className='decor window' style={{ left: '7%', top: 24 }}>
        <div className='disc' /><div className='mull' />
      </div>
      <div className='decor wclock' style={{ left: '50%', top: 30, transform: 'translateX(-50%)' }}>
        <span className='hh' /><span className='mm' />
      </div>
      <div className='decor poster' style={{ right: '8%', top: 26 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src='/logo-square.svg' alt='Eagle AI' />
        <span className='ptxt'>EAGLE</span>
      </div>

      <div className='floor' />
      <div className='rug' style={{ left: '14%', top: '34%', right: '14%', bottom: '14%' }} />
      <div className='baseboard' />

      {/* floor decor */}
      <div className='decor plant' style={{ left: '3%', top: '40%' }}>
        <div className='leaf' /><div className='pot' />
      </div>
      <div className='decor cooler' style={{ left: '3%', top: '70%' }}>
        <div className='jug' /><div className='body' />
      </div>
      <div className='decor shelf' style={{ left: '45%', top: '66%', transform: 'translateX(-50%)' }}>
        <span /><span /><span /><span /><span />
      </div>
      <div className='decor coffee' style={{ right: '3%', top: '52%' }}>
        <div className='machine' /><div className='lbl'>COFFEE</div>
      </div>

      {/* punch clock / daily log */}
      <div
        className='decor pclock'
        style={{ right: '3%', top: '76%', position: 'absolute' }}
        onClick={(e) => { e.stopPropagation(); onOpenLog() }}
        role='button'
        tabIndex={0}
        title={t.logTitle}
      >
        <div className='pc-box'><span className='pc-face' /></div>
        <div className='pc-badge'>{loggedToday}/{team.length}</div>
        <div className='lbl'>{t.clock}</div>
      </div>

      {team.map((m) => (
        <Workstation key={m.id} m={m} onPick={onPick} lang={lang} />
      ))}
    </div>
  )
}
