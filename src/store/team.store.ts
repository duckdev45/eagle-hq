import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import { PROJ_DEF, SEED_LOGS, SEED_PROJECTS, SEED_TEAM, SEED_TWEAKS } from '@/data/seed'
import type { Lang, LogEntry, Project, RemoteTeamState, TeamMember, Tweaks } from '@/types/team'

const LS_KEY = 'eagle_hq_state_v1'

const MUT_KEYS: (keyof TeamMember)[] = ['task', 'task_en', 'taskKey', 'status', 'note', 'note_en', 'leaveUntil', 'updated_at']

interface TeamState {
  team: TeamMember[]
  projects: Project[]
  logs: LogEntry[]
  tweaks: Tweaks
  lang: Lang
  syncTs: string

  updateMember: (id: string, patch: Partial<TeamMember>) => void
  applyRemote: (remote: RemoteTeamState) => void
  saveProject: (origId: string | null, patch: Omit<Project, 'stat' | 'stat_en'> & { light: Project['light'] }) => void
  deleteProject: (id: string) => void
  addLog: (id: string, text: string, lang: Lang) => void
  setTweaks: (tweaks: Tweaks) => void
  setLang: (lang: Lang) => void
  updateSyncTs: (ts: string) => void
}

export const useTeamStore = create<TeamState>()(
  persist(
    (set, get) => ({
      team: SEED_TEAM,
      projects: SEED_PROJECTS,
      logs: SEED_LOGS,
      tweaks: SEED_TWEAKS,
      lang: 'zh',
      syncTs: '09:12',

      updateMember: (id, patch) => {
        set((s) => ({
          team: s.team.map((m) =>
            m.id === id ? { ...m, ...patch, updated_at: new Date().toISOString() } : m
          ),
        }))
      },

      applyRemote: ({ statuses, logs }) => {
        const today = new Date().toISOString().slice(0, 10)
        set((s) => {
          /* 狀態：updated_at 較新者為準（雙向同步的衝突解法） */
          const byId = new Map(statuses.map((r) => [r.id, r]))
          const team = s.team.map((m) => {
            const r = byId.get(m.id)
            if (!r || !r.updated_at || r.updated_at <= m.updated_at) return m
            return {
              ...m,
              status: r.status || m.status,
              task: r.task,
              task_en: r.task_en,
              taskKey: r.taskKey,
              note: r.note,
              note_en: r.note_en,
              leaveUntil: r.leaveUntil,
              updated_at: r.updated_at,
            }
          })

          /* 日誌：Sheet 為歷史來源，僅保留今日尚未同步完成的本地較新項 */
          const merged = new Map<string, LogEntry>()
          for (const l of logs) merged.set(`${l.id}|${l.date}`, l)
          for (const l of s.logs) {
            if (l.date !== today) continue
            const key = `${l.id}|${l.date}`
            const r = merged.get(key)
            if (!r || (l.created_at ?? '') > (r.created_at ?? '')) merged.set(key, l)
          }
          const mergedLogs = [...merged.values()].sort((a, b) =>
            a.date === b.date ? (a.created_at ?? '') < (b.created_at ?? '') ? 1 : -1 : a.date < b.date ? 1 : -1
          )

          return { team, logs: mergedLogs }
        })
      },

      saveProject: (origId, patch) => {
        const light = patch.light
        const full: Project = {
          ...patch,
          stat: PROJ_DEF[light].zh,
          stat_en: PROJ_DEF[light].en,
        }
        set((s) => {
          if (origId === null) {
            const ids = new Set(s.projects.map((p) => p.id))
            let id = patch.id || 'new-project'
            let n = 2
            while (ids.has(id)) {
              id = `${patch.id || 'project'}-${n++}`
            }
            return { projects: [...s.projects, { ...full, id }] }
          }
          return { projects: s.projects.map((p) => (p.id === origId ? { ...p, ...full } : p)) }
        })
      },

      deleteProject: (id) => {
        set((s) => ({ projects: s.projects.filter((p) => p.id !== id) }))
      },

      addLog: (id, text, lang) => {
        const today = new Date().toISOString().slice(0, 10)
        set((s) => {
          const entry: LogEntry = {
            id,
            date: today,
            created_at: new Date().toISOString(),
            done: text,
            ...(lang === 'en' ? { done_en: text } : {}),
          }
          const others = s.logs.filter((l) => !(l.id === id && l.date === today))
          return { logs: [entry, ...others] }
        })
      },

      setTweaks: (tweaks) => set({ tweaks }),
      setLang: (lang) => set({ lang }),
      updateSyncTs: (ts) => set({ syncTs: ts }),
    }),
    {
      name: LS_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        team: s.team.map((m) => {
          const mutable = {} as Partial<TeamMember>
          MUT_KEYS.forEach((k) => {
            if (m[k] !== undefined) (mutable as Record<string, unknown>)[k] = m[k]
          })
          return { id: m.id, ...mutable }
        }),
        projects: s.projects,
        logs: s.logs,
        tweaks: s.tweaks,
        lang: s.lang,
        syncTs: s.syncTs,
      }),
      merge: (persisted, current) => {
        const p = persisted as Partial<TeamState>
        const memberMap: Record<string, Partial<TeamMember>> = {}
        if (p.team) {
          ;(p.team as Array<{ id: string } & Partial<TeamMember>>).forEach((m) => {
            memberMap[m.id] = m
          })
        }
        return {
          ...current,
          team: SEED_TEAM.map((m) => ({ ...m, ...(memberMap[m.id] || {}) })),
          projects: p.projects || current.projects,
          logs: p.logs || current.logs,
          tweaks: p.tweaks || current.tweaks,
          lang: p.lang || current.lang,
          syncTs: p.syncTs || current.syncTs,
        }
      },
    }
  )
)
