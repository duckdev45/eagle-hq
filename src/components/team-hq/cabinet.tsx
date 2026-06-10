'use client'

import { useEffect, useRef, useState } from 'react'

import type { Lang, Light, Project, TeamMember } from '@/types/team'
import type { MemberLoad } from '@/types/jira'
import { FLOOR_THEMES, SEED_SPRINT, STATUS } from '@/data/seed'
import { useJiraSnapshot } from '@/hooks/use-jira-snapshot'
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

/* Jira 票況 → 成員頭頂狀態（手動請假/外出優先，不被覆蓋） */
function applyJiraLoad(team: TeamMember[], members: MemberLoad[] | undefined): TeamMember[] {
  if (!members?.length) return team
  const byId = new Map(members.filter((m) => m.memberId).map((m) => [m.memberId!, m]))
  return team.map((m) => {
    const load = byId.get(m.id)
    if (!load || STATUS[m.status]?.away) return m
    const status = load.red > 0 ? '被卡住' : load.yellow > 0 ? '驗收中' : '施工中'
    return {
      ...m,
      status,
      task: `${load.total} 票進行中${load.red > 0 ? ` · ${load.red} 紅` : ''}`,
      task_en: `${load.total} active${load.red > 0 ? ` · ${load.red} red` : ''}`,
    }
  })
}

export function Cabinet() {
  const scalerRef = useRef<HTMLDivElement>(null)
  const { team, projects, logs, tweaks, lang, syncTs, updateMember, saveProject, deleteProject, addLog, setTweaks, setLang, updateSyncTs } =
    useTeamStore()

  const [pickMember, setPickMember] = useState<string | null>(null)
  const [pickProject, setPickProject] = useState<string | null>(null)
  const [newProj, setNewProj] = useState(false)
  const [logOpen, setLogOpen] = useState(false)
  const [tweaksOpen, setTweaksOpen] = useState(false)
  const [railOpen, setRailOpen] = useState<'projects' | 'sprint'>('sprint')
  const [clock, setClock] = useState('')
  const snapshot = useJiraSnapshot()

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

  const displayTeam = applyJiraLoad(team, snapshot?.members)
  const jiraSyncTs = snapshot
    ? new Date(snapshot.generatedAt).toTimeString().slice(0, 5)
    : null
  const delayed = snapshot ? snapshot.summary.red + snapshot.summary.yellow : 0
  const bossNote = snapshot
    ? delayed > 0
      ? lang === 'zh'
        ? `⚠ ${delayed}/${snapshot.summary.epics} EPIC 有狀況`
        : `⚠ ${delayed}/${snapshot.summary.epics} epics at risk`
      : lang === 'zh'
        ? `✓ ${snapshot.summary.epics} EPIC 全綠`
        : `✓ all ${snapshot.summary.epics} epics green`
    : null

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
            syncTs={jiraSyncTs ?? syncTs}
            clock={clock}
            onLangChange={(l: Lang) => setLang(l)}
            onTweaksOpen={() => setTweaksOpen(true)}
          />
          <div className='cab-body'>
            <Room
              team={displayTeam}
              onPick={setPickMember}
              theme={theme}
              lang={lang}
              onOpenLog={() => setLogOpen(true)}
              loggedToday={loggedToday}
              bossNote={bossNote}
            />
            <div className='rail'>
              <ProjectBoard
                projects={projects}
                epics={snapshot?.epics}
                onPickEpic={(key) => window.open(`${snapshot!.baseUrl}/browse/${key}`, '_blank', 'noopener')}
                onPick={setPickProject}
                onAdd={() => setNewProj(true)}
                lang={lang}
                open={railOpen === 'projects'}
                onToggle={() => setRailOpen('projects')}
              />
              <Blackboard
                sprint={SEED_SPRINT}
                jiraSprint={snapshot?.sprint}
                led={tweaks.board === 'led'}
                lang={lang}
                open={railOpen === 'sprint'}
                onToggle={() => setRailOpen('sprint')}
              />
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
