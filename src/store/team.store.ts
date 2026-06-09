import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import { PROJ_DEF, SEED_LOGS, SEED_PROJECTS, SEED_TEAM, SEED_TWEAKS } from '@/data/seed'
import type { Lang, LogEntry, Project, TeamMember, Tweaks } from '@/types/team'

const LS_KEY = 'eagle_hq_state_v1'

const MUT_KEYS: (keyof TeamMember)[] = ['task', 'task_en', 'status', 'note', 'note_en', 'leaveUntil', 'updated_at']

interface TeamState {
  team: TeamMember[]
  projects: Project[]
  logs: LogEntry[]
  tweaks: Tweaks
  lang: Lang
  syncTs: string

  updateMember: (id: string, patch: Partial<TeamMember>) => void
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
