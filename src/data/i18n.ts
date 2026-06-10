import type { Lang } from '@/types/team'

interface HqStrings {
  subtitle: string
  synced: string
  projects: string
  sprint: string
  needHead: string
  needTail: string
  tweaks: string
  floor: string
  board: string
  idle: string
  chalk: string
  led: string
  on: string
  off: string
  curTask: string
  status: string
  note: string
  backOn: string
  save: string
  cancel: string
  lastUpd: string
  signal: string
  statusNote: string
  due: string
  syncNote: string
  backPrefix: string
  notePlace: string
  taskPlace: string
  themes: Record<string, string>
  addProj: string
  delProj: string
  projId: string
  newProj: string
  daily: string
  dailyPlace: string
  dailyOpt: string
  logTitle: string
  today: string
  recent: string
  logged: string
  pending: string
  writeToday: string
  noEntry: string
  clock: string
  delConfirm: string
}

export const HQ_I18N: Record<Lang, HqStrings> = {
  zh: {
    subtitle: '團隊指揮中心 — 工地現況板',
    synced: '已同步', projects: '專案燈號', sprint: '本週黑板',
    needHead: '個專案需要', needTail: '決策',
    tweaks: 'TWEAKS', floor: '地板主題', board: '黑板風格', idle: '角色閒置動畫',
    chalk: '粉筆', led: 'LED 點陣', on: '開', off: '關',
    curTask: '目前工作', status: '狀態', note: '備註（選填）', backOn: '預計回來',
    save: '送出', cancel: '取消', lastUpd: '上次更新', signal: '燈號', statusNote: '說明', due: '預計完成',
    syncNote: '所有變更會同步至 Google Sheet', backPrefix: '回來',
    notePlace: '補一句話讓大家知道狀況', taskPlace: '例：site-report API 串接',
    themes: { wood: '暖木', gray: '灰調', moss: '苔綠', light: '明亮' },
    addProj: '新增專案', delProj: '刪除此專案', projId: '專案代號', newProj: '新專案',
    daily: '今天做了什麼', dailyPlace: '簡單敘述：今天完成或需要協助',
    dailyOpt: '（送出即記錄到今日日誌）',
    logTitle: 'Daily Log', today: 'today', recent: 'Recent', logged: '已紀錄', pending: '未紀錄',
    writeToday: '寫今天的紀錄', noEntry: '今天還沒紀錄', clock: '打卡鐘', delConfirm: '確定刪除？',
  },
  en: {
    subtitle: 'Team Command Center — site status board',
    synced: 'Synced', projects: 'SIGNALS', sprint: 'THIS WEEK',
    needHead: '', needTail: '',
    tweaks: 'TWEAKS', floor: 'FLOOR', board: 'BOARD', idle: 'IDLE ANIM',
    chalk: 'Chalk', led: 'LED', on: 'On', off: 'Off',
    curTask: 'Current task', status: 'Status', note: 'Note (optional)', backOn: 'Back on',
    save: 'SAVE', cancel: 'Cancel', lastUpd: 'Updated', signal: 'Signal', statusNote: 'Status note', due: 'Due',
    syncNote: 'All changes sync to Google Sheet', backPrefix: 'back',
    notePlace: 'Add a quick line for the team', taskPlace: 'e.g. Wiring site-report API',
    themes: { wood: 'Wood', gray: 'Gray', moss: 'Moss', light: 'Light' },
    addProj: 'New project', delProj: 'Delete project', projId: 'Project ID', newProj: 'New project',
    daily: 'What did you do today?', dailyPlace: 'One line: what you shipped or got stuck on',
    dailyOpt: '(saving logs it to today)',
    logTitle: 'Daily Log', today: 'Today', recent: 'Recent', logged: 'logged', pending: 'not yet',
    writeToday: 'Write today', noEntry: 'No entry today', clock: 'Punch clock', delConfirm: 'Delete this?',
  },
}
