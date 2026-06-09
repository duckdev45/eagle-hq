'use client'

import { useEffect, useRef, useState } from 'react'

import type { Lang, Light, Project, TeamMember } from '@/types/team'
import { FLOOR_THEMES, SEED_SPRINT } from '@/data/seed'
import { useTeamStore } from '@/store/team.store'

import { Blackboard } from './blackboard'
import { DailyLog } from './daily-log'
import { MemberSheet } from './member-sheet'
import { ProjectBoard } from './project-board'
import { ProjectSheet } from './project-sheet'
import { Room } from './room'
import { TitleBar } from './title-bar'
import { TweaksPanel } from './tweaks-panel'

const EMPTY_PROJECT: Project = { id: '', light: 'y', stat: '', stat_en: '', due: '', note: '', note_en: '' }

export function Cabinet() {
  const scalerRef = useRef<HTMLDivElement>(null)
  const { team, projects, logs, tweaks, lang, syncTs, updateMember, saveProject, deleteProject, addLog, setTweaks, setLang, updateSyncTs } =
    useTeamStore()

  const [pickMember, setPickMember] = useState<string | null>(null)
  const [pickProject, setPickProject] = useState<string | null>(null)
  const [newProj, setNewProj] = useState(false)
  const [logOpen, setLogOpen] = useState(false)
  const [tweaksOpen, setTweaksOpen] = useState(false)
  const [clock, setClock] = useState('')

  // Letterbox scaler
  useEffect(() => {
    const scaler = scalerRef.current
    if (!scaler) return
    const scale = () => {
      const s = Math.min(window.innerWidth / 1360, window.innerHeight / 860)
      scaler.style.transform = `scale(${s})`
    }
    scale()
    window.addEventListener('resize', scale)
    return () => window.removeEventListener('resize', scale)
  }, [])

  // Live clock
  useEffect(() => {
    const tick = () => {
      const d = new Date()
      const p = (n: number) => String(n).padStart(2, '0')
      setClock(`${p(d.getHours())}:${p(d.getMinutes())}`)
    }
    tick()
    const id = setInterval(tick, 15000)
    return () => clearInterval(id)
  }, [])

  const today = new Date().toISOString().slice(0, 10)
  const theme = FLOOR_THEMES.find((t) => t.id === tweaks.floor) ?? FLOOR_THEMES[0]
  const mSel = team.find((m) => m.id === pickMember)
  const pSel = projects.find((p) => p.id === pickProject)

  const nowSync = () => {
    const d = new Date()
    const p = (n: number) => String(n).padStart(2, '0')
    updateSyncTs(`${p(d.getHours())}:${p(d.getMinutes())}`)
  }

  const handleSaveMember = (id: string, patch: Partial<TeamMember>, daily: string) => {
    updateMember(id, patch)
    if (daily) addLog(id, daily, lang)
    nowSync()
    setPickMember(null)
  }

  const handleSaveProject = (origId: string | null, patch: Omit<Project, 'stat' | 'stat_en'> & { light: Light }) => {
    saveProject(origId, patch)
    nowSync()
    setPickProject(null)
    setNewProj(false)
  }

  const handleDeleteProject = (id: string) => {
    deleteProject(id)
    nowSync()
    setPickProject(null)
  }

  const handleSaveLog = (id: string, text: string) => {
    addLog(id, text, lang)
    nowSync()
  }

  const myTodayLog = (id: string) => {
    const l = logs.find((x) => x.id === id && x.date === today)
    return l ? (lang === 'zh' ? l.done : (l.done_en || l.done)) : ''
  }

  const todayLogged = new Set(logs.filter((l) => l.date === today).map((l) => l.id))
  const loggedToday = team.filter((m) => todayLogged.has(m.id)).length

  return (
    <div className='hq-stage'>
      <div ref={scalerRef} className='hq-scaler'>
        <div className={`cabinet${tweaks.idle === 'off' ? ' noidle' : ''}`}>
          <TitleBar
            lang={lang}
            syncTs={syncTs}
            clock={clock}
            onLangChange={(l: Lang) => setLang(l)}
            onTweaksOpen={() => setTweaksOpen(true)}
          />
          <div className='cab-body'>
            <Room
              team={team}
              onPick={setPickMember}
              theme={theme}
              lang={lang}
              onOpenLog={() => setLogOpen(true)}
              loggedToday={loggedToday}
            />
            <div className='rail'>
              <ProjectBoard
                projects={projects}
                onPick={setPickProject}
                onAdd={() => setNewProj(true)}
                lang={lang}
              />
              <Blackboard sprint={SEED_SPRINT} led={tweaks.board === 'led'} lang={lang} />
            </div>
          </div>

          {mSel && (
            <MemberSheet
              m={mSel}
              todayLog={myTodayLog(mSel.id)}
              lang={lang}
              onSave={handleSaveMember}
              onClose={() => setPickMember(null)}
            />
          )}
          {pSel && (
            <ProjectSheet
              p={pSel}
              lang={lang}
              onSave={handleSaveProject}
              onDelete={handleDeleteProject}
              onClose={() => setPickProject(null)}
            />
          )}
          {newProj && (
            <ProjectSheet
              p={EMPTY_PROJECT}
              isNew
              lang={lang}
              onSave={handleSaveProject}
              onClose={() => setNewProj(false)}
            />
          )}
          {logOpen && (
            <DailyLog
              team={team}
              logs={logs}
              today={today}
              lang={lang}
              onSaveLog={handleSaveLog}
              onClose={() => setLogOpen(false)}
            />
          )}
          {tweaksOpen && (
            <TweaksPanel
              tw={tweaks}
              lang={lang}
              onClose={() => setTweaksOpen(false)}
              onChangeTweaks={setTweaks}
            />
          )}
        </div>
      </div>
    </div>
  )
}
