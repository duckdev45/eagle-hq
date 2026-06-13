'use client'

import { useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'

import type { Lang, Light, Project, TeamMember } from '@/types/team'
import type { MemberLoad } from '@/types/jira'
import { FLOOR_THEMES, SEED_SPRINT, STATUS } from '@/data/seed'
import { useJiraSnapshot } from '@/hooks/use-jira-snapshot'
import { pushTeamState, toRemoteStatus, useTeamSync } from '@/hooks/use-team-sync'
import { useTeamStore } from '@/store/team.store'

import { BacklogSheet } from './backlog-sheet'
import { PhotoAlbum } from './photo-album'
import { Blackboard } from './blackboard'
import { DailyLog } from './daily-log'
import { LoadingScreen } from './loading-screen'
import { MemberSheet, type JiraTransitionReq } from './member-sheet'
import { ProjectBoard } from './project-board'
import { ProjectSheet } from './project-sheet'
import { Room } from './room'
import { TaskBoard } from './task-board'
import { TeamLog } from './team-log'
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
    const status = load.red > 0 ? '被卡住' : load.yellow > 0 ? '驗收中' : '開發中'
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
  const [teamLogOpen, setTeamLogOpen] = useState(false)
  const [backlogOpen, setBacklogOpen] = useState(false)
  const [albumOpen, setAlbumOpen] = useState(false)
  const [tweaksOpen, setTweaksOpen] = useState(false)
  const [railOpen, setRailOpen] = useState<'projects' | 'sprint' | 'tasks'>('sprint')
  const [clock, setClock] = useState('')
  const { snapshot, loading: jiraLoading } = useJiraSnapshot()
  const queryClient = useQueryClient()
  const { loading: sheetLoading } = useTeamSync()

  // 開機載入畫面：載完後輸入密碼放行（latch，refetch 不會再出現）
  const [booted, setBooted] = useState(false)

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

  const handleSaveMember = async (
    id: string,
    patch: Partial<TeamMember>,
    daily: string,
    transition: JiraTransitionReq | null
  ) => {
    if (transition) {
      try {
        const res = await fetch('/api/jira/transition', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(transition),
        })
        if (!res.ok) {
          const data = (await res.json().catch(() => null)) as { error?: string; available?: string[] } | null
          const hint = data?.available?.length ? `\n${lang === 'zh' ? '可用狀態' : 'Available'}: ${data.available.join(', ')}` : ''
          alert(`${lang === 'zh' ? 'Jira 回寫失敗' : 'Jira write-back failed'}: ${data?.error ?? res.status}${hint}`)
          return
        }
        await queryClient.invalidateQueries({ queryKey: ['jira-snapshot'] })
      } catch {
        alert(lang === 'zh' ? 'Jira 回寫失敗：連線錯誤' : 'Jira write-back failed: network error')
        return
      }
    }
    updateMember(id, patch)
    if (daily) addLog(id, daily, lang)
    const st = useTeamStore.getState()
    const me = st.team.find((m) => m.id === id)
    const log = daily ? st.logs.find((l) => l.id === id && l.date === today) : undefined
    pushTeamState({ statuses: me ? [toRemoteStatus(me)] : [], logs: log ? [log] : [] })
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
    const log = useTeamStore.getState().logs.find((l) => l.id === id && l.date === today)
    pushTeamState({ logs: log ? [log] : [] })
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
        {!booted && (
          <LoadingScreen
            jiraDone={!jiraLoading}
            sheetDone={!sheetLoading}
            onUnlock={() => setBooted(true)}
          />
        )}
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
              onOpenTeamLog={() => setTeamLogOpen(true)}
              onOpenBacklog={() => setBacklogOpen(true)}
              onOpenAlbum={() => setAlbumOpen(true)}
              loggedToday={loggedToday}
            />
            <div className='rail'>
              <ProjectBoard
                projects={projects}
                epics={snapshot?.epics}
                onPickEpic={(key) => window.open(`${snapshot!.baseUrl}/browse/${key}`, '_blank', 'noopener')}
                onPick={setPickProject}
                onAdd={() => setNewProj(true)}
                led={tweaks.board === 'led'}
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
              {(snapshot?.sprint?.tasks?.length ?? 0) > 0 && (
                <TaskBoard
                  sprint={snapshot!.sprint!}
                  team={team}
                  led={tweaks.board === 'led'}
                  lang={lang}
                  open={railOpen === 'tasks'}
                  onToggle={() => setRailOpen('tasks')}
                />
              )}
            </div>
          </div>

          {mSel && (
            <MemberSheet
              m={mSel}
              tasks={(snapshot?.sprint?.tasks ?? []).filter((tk) => tk.memberId === mSel.id)}
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
          {albumOpen && (
            <PhotoAlbum
              lang={lang}
              onClose={() => setAlbumOpen(false)}
            />
          )}
          {backlogOpen && (
            <BacklogSheet
              items={snapshot?.backlog ?? []}
              baseUrl={snapshot?.baseUrl}
              lang={lang}
              onClose={() => setBacklogOpen(false)}
            />
          )}
          {teamLogOpen && (
            <TeamLog
              team={team}
              logs={logs}
              lang={lang}
              onClose={() => setTeamLogOpen(false)}
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
