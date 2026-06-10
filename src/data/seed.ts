import type { FloorThemeDef, LogEntry, Project, Sprint, StatusMeta, TeamMember, Tweaks } from '@/types/team'

export const STATUS: Record<string, StatusMeta> = {
  '施工中':  { color: 'var(--st-work)',   away: false, kind: 'work',        en: 'Building'   },
  '驗收中':  { color: 'var(--st-review)', away: false, kind: 'review',      en: 'Reviewing'  },
  '被卡住':  { color: 'var(--st-block)',  away: false, kind: 'block',       en: 'Blocked'    },
  '休息中':  { color: 'var(--st-rest)',   away: true,  kind: 'rest',        en: 'On break'   },
  '外出':    { color: 'var(--st-ooo)',    away: true,  kind: 'leave',       en: 'Out (OOO)'  },
  '在家工作': { color: 'var(--st-wfh)',   away: false, kind: 'wfh',         en: 'WFH'        },
  '休假':    { color: 'var(--st-vac)',    away: true,  kind: 'leave',       en: 'Vacation'   },
  '病假':    { color: 'var(--st-sick)',   away: true,  kind: 'leave',       en: 'Sick leave' },
  '查閱中':  { color: 'var(--st-rest)',   away: false, kind: 'review-only', en: 'Overseeing' },
}

export const STATUS_ORDER = ['施工中', '在家工作', '驗收中', '被卡住', '休息中', '外出', '休假', '病假']

export const PROJ_DEF: Record<string, { zh: string; en: string }> = {
  g: { zh: '照計畫進行', en: 'On track' },
  y: { zh: '有風險',     en: 'At risk' },
  r: { zh: '需要 PM 決策', en: "Needs PM's call" },
}

export const SYM: Record<string, string> = { done: '✓', doing: '→', warn: '!' }

export const FLOOR_THEMES: FloorThemeDef[] = [
  { id: 'wood',  name: '暖木', fa: '#2b2723', fb: '#322d28', wall: '#20242a', sw: '#322d28' },
  { id: 'gray',  name: '灰調', fa: '#2a2d31', fb: '#313539', wall: '#232830', sw: '#313539' },
  { id: 'moss',  name: '苔綠', fa: '#232c25', fb: '#29332b', wall: '#1e2622', sw: '#29332b' },
  { id: 'light', name: '明亮', fa: '#cfc7bb', fb: '#dcd5ca', wall: '#bdb5a8', sw: '#dcd5ca' },
]

export const SEED_TEAM: TeamMember[] = [
  {
    id: 'wesley', name: 'WESLEY', role: '建築師 · Boss', role_en: 'Architect · Boss',
    avatar: '/avatars/wesley.png', x: 17, y: 15, status: '查閱中',
    task: '巡視各專案燈號', task_en: 'Scan project signals',
    note: '只看紅燈，其餘交給團隊', note_en: 'Only acts on red lights',
    updated_at: '2026-06-09T09:12:00',
  },
  {
    id: 'margaret', name: 'MARGARET', role: '建築師 · PO', role_en: 'Architect · Product Owner',
    avatar: '/avatars/margaret.png', x: 50, y: 15, status: '施工中',
    task: '整理本週待辦', task_en: 'Grooming the backlog',
    note: '和廠商確認 data 規格中', note_en: 'Confirming data spec w/ vendor',
    updated_at: '2026-06-09T10:20:00',
  },
  {
    id: 'lee', name: 'LEE', role: '後端 · Team Lead', role_en: 'Backend · Team Lead',
    avatar: '/avatars/lee.png', x: 83, y: 15, status: '施工中',
    task: 'site-report API 串接', task_en: 'Wiring site-report API',
    note: '今天可完成匯出端點', note_en: 'Export endpoint should land today',
    updated_at: '2026-06-09T10:48:00',
  },
  {
    id: 'jared', name: 'JARED', role: 'UI / UX', role_en: 'UI / UX',
    avatar: '/avatars/jared.png', x: 30, y: 56, status: '驗收中',
    task: 'app-onsite 拍照流程驗收', task_en: 'Reviewing capture flow',
    note: '等 Duck 修兩個對齊', note_en: 'Waiting on 2 alignment fixes',
    updated_at: '2026-06-09T11:05:00',
  },
  {
    id: 'duck', name: 'DUCK', role: '前端', role_en: 'Frontend',
    avatar: '/avatars/duck.png', x: 66, y: 56, status: '被卡住',
    task: 'data-training 標註介面', task_en: 'data-training labeling UI',
    note: '廠商資料還沒進來，卡住了', note_en: 'Blocked — vendor data not in yet',
    updated_at: '2026-06-09T11:30:00',
  },
]

export const SEED_PROJECTS: Project[] = [
  {
    id: 'app-onsite', light: 'g', stat: '照計畫進行', stat_en: 'On track', due: '6/20',
    note: '拍照上傳 + 離線快取已完成，本週收尾驗收。',
    note_en: 'Capture + offline cache done; final review this week.',
  },
  {
    id: 'data-training', light: 'r', stat: '需要 PM 決策', stat_en: "Needs PM's call", due: '6/13',
    note: '廠商標註資料逾期兩天，是否改用內部樣本？需老闆拍板。',
    note_en: 'Vendor labels 2 days late — switch to internal samples? Needs the boss.',
  },
  {
    id: 'site-report', light: 'y', stat: '有風險', stat_en: 'At risk', due: '6/18',
    note: 'PDF 匯出格式 A/B 未定，等規格確認，目前先做 A。',
    note_en: 'PDF export format A/B undecided; building A for now.',
  },
]

export const SEED_SPRINT: Sprint = {
  week: 'WEEK 24', end: '結束 6/13 (五)', end_en: 'ends Fri 6/13',
  items: [
    { type: 'done',  tag: 'app-onsite',    txt: '拍照上傳模組完成',              txt_en: 'Photo-upload module done' },
    { type: 'doing', tag: 'site-report',   txt: 'PDF 匯出端點開發中',            txt_en: 'PDF export endpoint in progress' },
    { type: 'doing', tag: 'app-onsite',    txt: '離線驗收兩個對齊修正',          txt_en: '2 alignment fixes in offline review' },
    { type: 'warn',  tag: 'data-training', txt: '廠商標註資料逾期 — 等 PM 拍板', txt_en: 'Vendor labels late — awaiting PM' },
  ],
}

export const SEED_LOGS: LogEntry[] = [
  { id: 'lee',      date: '2026-06-09', done: '完成匯出端點骨架，明天接 PDF 樣板', done_en: 'Export endpoint skeleton done; PDF template tomorrow' },
  { id: 'jared',    date: '2026-06-09', done: '驗收 app-onsite 兩個對齊，回報給 Duck', done_en: 'Reviewed 2 alignments on app-onsite; handed to Duck' },
  { id: 'margaret', date: '2026-06-09', done: '跟廠商開會確認 data 規格', done_en: 'Met vendor to confirm data spec' },
  { id: 'lee',      date: '2026-06-08', done: 'site-report schema 定案', done_en: 'Finalized site-report schema' },
  { id: 'duck',     date: '2026-06-08', done: '等廠商資料，先把標註 UI 框架做完', done_en: 'Built labeling UI shell while waiting on vendor data' },
  { id: 'jared',    date: '2026-06-08', done: '拍照流程高保真稿交付', done_en: 'Delivered hi-fi for capture flow' },
]

export const SEED_TWEAKS: Tweaks = { floor: 'wood', board: 'chalk', idle: 'on' }
