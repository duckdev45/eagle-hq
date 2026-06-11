/**
 * Eagle HQ — 團隊狀態與每日日誌同步（Google Apps Script）
 *
 * 部署步驟：
 * 1. 建立一份新的 Google Sheet（分頁會自動建立，不用手動加）
 * 2. 擴充功能 → Apps Script，貼上本檔全部內容
 * 3. 左側「專案設定」→ 指令碼屬性 → 新增屬性：SECRET = 一串自訂亂數
 * 4. 部署 → 新增部署 → 類型「網頁應用程式」
 *    - 執行身分：我
 *    - 誰可以存取：任何人
 * 5. 複製網頁應用程式 URL，連同 SECRET 填入專案 .env.local：
 *    GSHEET_WEBAPP_URL=https://script.google.com/macros/s/xxxx/exec
 *    GSHEET_SECRET=與步驟 3 相同的字串
 *
 * 資料設計（兩個分頁皆為 append-only，每一次變更都留一列，完整保留每日歷史）：
 * - status：updated_at, id, status, task, task_en, task_key, note, note_en, leave_until
 * - logs  ：date, id, done, done_en, created_at
 * API 讀取時 status 取每人最新一列、logs 取每人每日最新一列（近 60 天）。
 */

var STATUS_SHEET = 'status'
var LOG_SHEET = 'logs'
var STATUS_HEADERS = ['updated_at', 'id', 'status', 'task', 'task_en', 'task_key', 'note', 'note_en', 'leave_until']
var LOG_HEADERS = ['date', 'id', 'done', 'done_en', 'created_at']
var LOG_DAYS = 60

function getSecret_() {
  return PropertiesService.getScriptProperties().getProperty('SECRET')
}

function sheet_(name, headers) {
  var ss = SpreadsheetApp.getActiveSpreadsheet()
  var sh = ss.getSheetByName(name)
  if (!sh) {
    sh = ss.insertSheet(name)
    sh.appendRow(headers)
    sh.setFrozenRows(1)
  }
  return sh
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON)
}

/* Sheets 會把日期樣字串自動轉成 Date，讀回時一律正規化成 yyyy-MM-dd / ISO */
function isDate_(v) {
  return v instanceof Date || Object.prototype.toString.call(v) === '[object Date]'
}

function isoTs_(v) {
  if (isDate_(v)) return v.toISOString()
  return String(v || '')
}

function isoDate_(v) {
  if (isDate_(v)) return Utilities.formatDate(v, Session.getScriptTimeZone(), 'yyyy-MM-dd')
  var s = String(v || '')
  var m = s.match(/^(\d{4}-\d{2}-\d{2})/)
  if (m) return m[1]
  var d = new Date(s)
  if (!isNaN(d.getTime())) return Utilities.formatDate(d, Session.getScriptTimeZone(), 'yyyy-MM-dd')
  return s
}

function doGet(e) {
  if (!e || !e.parameter || e.parameter.secret !== getSecret_()) {
    return json_({ error: 'unauthorized' })
  }
  return json_({ statuses: latestStatuses_(), logs: recentLogs_(LOG_DAYS) })
}

function doPost(e) {
  var body
  try {
    body = JSON.parse(e.postData.contents)
  } catch (err) {
    return json_({ error: 'bad json' })
  }
  if (body.secret !== getSecret_()) return json_({ error: 'unauthorized' })

  var lock = LockService.getScriptLock()
  lock.waitLock(10000)
  try {
    var statusSheet = sheet_(STATUS_SHEET, STATUS_HEADERS)
    ;(body.statuses || []).forEach(function (s) {
      if (!s || !s.id) return
      statusSheet.appendRow([
        s.updated_at || new Date().toISOString(),
        s.id,
        s.status || '',
        s.task || '',
        s.task_en || '',
        s.taskKey || '',
        s.note || '',
        s.note_en || '',
        s.leaveUntil || '',
      ])
    })
    var logSheet = sheet_(LOG_SHEET, LOG_HEADERS)
    ;(body.logs || []).forEach(function (l) {
      if (!l || !l.id || !l.date) return
      logSheet.appendRow([
        l.date,
        l.id,
        l.done || '',
        l.done_en || '',
        l.created_at || new Date().toISOString(),
      ])
    })
  } finally {
    lock.releaseLock()
  }
  return json_({ ok: true })
}

/* 每位成員最新一列狀態 */
function latestStatuses_() {
  var rows = sheet_(STATUS_SHEET, STATUS_HEADERS).getDataRange().getValues()
  var latest = {}
  for (var i = 1; i < rows.length; i++) {
    var r = rows[i]
    var id = String(r[1] || '')
    if (!id) continue
    var ts = isoTs_(r[0])
    if (!latest[id] || ts > latest[id].updated_at) {
      latest[id] = {
        id: id,
        status: String(r[2] || ''),
        task: String(r[3] || ''),
        task_en: String(r[4] || ''),
        taskKey: String(r[5] || ''),
        note: String(r[6] || ''),
        note_en: String(r[7] || ''),
        leaveUntil: String(r[8] || ''),
        updated_at: ts,
      }
    }
  }
  return Object.keys(latest).map(function (k) { return latest[k] })
}

/* 近 N 天、每人每日最新一筆 */
function recentLogs_(days) {
  var rows = sheet_(LOG_SHEET, LOG_HEADERS).getDataRange().getValues()
  var cutoff = new Date(Date.now() - days * 86400000)
  var cutoffStr = Utilities.formatDate(cutoff, Session.getScriptTimeZone(), 'yyyy-MM-dd')
  var latest = {}
  for (var i = 1; i < rows.length; i++) {
    var r = rows[i]
    var date = isoDate_(r[0])
    var id = String(r[1] || '')
    if (!id || !date || date < cutoffStr) continue
    var key = id + '|' + date
    var created = isoTs_(r[4])
    if (!latest[key] || created > latest[key].created_at) {
      latest[key] = {
        id: id,
        date: date,
        done: String(r[2] || ''),
        done_en: String(r[3] || ''),
        created_at: created,
      }
    }
  }
  return Object.keys(latest).map(function (k) { return latest[k] })
}
