export type Lang = 'zh' | 'en'
export type Light = 'g' | 'y' | 'r'
export type StatusKind = 'work' | 'review' | 'block' | 'rest' | 'leave' | 'wfh' | 'review-only'
export type BoardStyle = 'chalk' | 'led'
export type FloorTheme = 'wood' | 'gray' | 'moss' | 'light'
export type SprintItemType = 'done' | 'doing' | 'warn'

export interface StatusMeta {
  color: string
  away: boolean
  kind: StatusKind
  en: string
}

export interface TeamMember {
  id: string
  name: string
  role: string
  role_en: string
  avatar: string
  x: number
  y: number
  status: string
  task: string
  task_en: string
  note: string
  note_en: string
  updated_at: string
  leaveUntil?: string
}

export interface Project {
  id: string
  light: Light
  stat: string
  stat_en: string
  due: string
  note: string
  note_en: string
}

export interface SprintItem {
  type: SprintItemType
  tag: string
  txt: string
  txt_en: string
}

export interface Sprint {
  week: string
  end: string
  end_en: string
  items: SprintItem[]
}

export interface LogEntry {
  id: string
  date: string
  done: string
  done_en?: string
  created_at?: string
}

export interface Tweaks {
  floor: FloorTheme
  board: BoardStyle
  idle: 'on' | 'off'
}

export interface FloorThemeDef {
  id: FloorTheme
  name: string
  fa: string
  fb: string
  wall: string
  sw: string
}
