import { useLanguageStore } from '@/store/language.store'

const errorCodeToKeyMap: Record<number, string> = {
  // AUTHORIZATION (10001 - 12000)
  10001: 'Errors.JWT_ERROR',
  10002: 'Errors.JWT_EXPIRED',
  10003: 'Errors.INVALID_USER',
  10004: 'Errors.NO_AUTHORIZATION',
  10005: 'Errors.INVALID_SYSTEM',
  10006: 'Errors.USER_NOT_FOUND',

  // DATA CHECK (20000 - 21999)
  20001: 'Errors.DATA_NOT_FOUND',
  20002: 'Errors.BLOB_DATA_NOT_FOUND',
  20003: 'Errors.DUPLICATED_DATA',

  // FILE
  40001: 'Errors.BLOB_FILE_NOT_FOUND',
  40002: 'Errors.BLOB_FILE_PATH_TYPE_ERROR',
  40003: 'Errors.BLOB_FILE_MAIL_ONE_FILE_SIZE_LIMIT',
  40004: 'Errors.BLOB_FILE_MAIL_TOTAL_FILE_SIZE_LIMIT',

  // ELSE
  90001: 'Errors.API_LOG_ERROR',
  90002: 'Errors.CHECK_BASE64_ERROR',

  [-1]: 'Errors.SYSTEM_ERROR',
}

const translations: Record<string, Record<string, string>> = {
  en: {
    'Errors.JWT_ERROR': 'JWT Error',
    'Errors.JWT_EXPIRED': 'Token Expired',
    'Errors.INVALID_USER': 'Invalid User',
    'Errors.NO_AUTHORIZATION': 'No permission. Logging out...',
    'Errors.INVALID_SYSTEM': 'Invalid System',
    'Errors.USER_NOT_FOUND': 'User not found',
    'Errors.DATA_NOT_FOUND': 'Data not found',
    'Errors.BLOB_DATA_NOT_FOUND': 'Blob Data not found',
    'Errors.DUPLICATED_DATA': 'Duplicated Data',
    'Errors.BLOB_FILE_NOT_FOUND': 'Blob file not found',
    'Errors.BLOB_FILE_PATH_TYPE_ERROR': 'File path type error.',
    'Errors.BLOB_FILE_MAIL_ONE_FILE_SIZE_LIMIT':
      'Email file size limit (20mb) exceeded.',
    'Errors.BLOB_FILE_MAIL_TOTAL_FILE_SIZE_LIMIT':
      'Email total file size (20mb) exceeded.',
    'Errors.API_LOG_ERROR': 'API Log Error',
    'Errors.CHECK_BASE64_ERROR': 'Base64 Validation failed',
    'Errors.SYSTEM_ERROR': 'System error',
    'Errors.UNKNOWN': 'An unknown error occurred',
  },
  'zh-TW': {
    'Errors.JWT_ERROR': 'JWT 驗證錯誤',
    'Errors.JWT_EXPIRED': 'Token 已過期，請重新登入',
    'Errors.INVALID_USER': '無效的使用者',
    'Errors.NO_AUTHORIZATION': '您沒有權限，將自動登出',
    'Errors.INVALID_SYSTEM': '無效的系統',
    'Errors.USER_NOT_FOUND': '找不到使用者',
    'Errors.DATA_NOT_FOUND': '找不到資料',
    'Errors.BLOB_DATA_NOT_FOUND': '找不到 Blob 資料',
    'Errors.DUPLICATED_DATA': '資料重複',
    'Errors.BLOB_FILE_NOT_FOUND': '找不到 Blob 檔案',
    'Errors.BLOB_FILE_PATH_TYPE_ERROR': '檔案路徑類型不符合系統設計',
    'Errors.BLOB_FILE_MAIL_ONE_FILE_SIZE_LIMIT': '單一郵件檔案大小上限為 20mb',
    'Errors.BLOB_FILE_MAIL_TOTAL_FILE_SIZE_LIMIT': '郵件總檔案大小上限為 20mb',
    'Errors.API_LOG_ERROR': 'API Log 錯誤',
    'Errors.CHECK_BASE64_ERROR': 'Base64 驗證失敗',
    'Errors.SYSTEM_ERROR': '系統發生錯誤，請稍後再試',
    'Errors.UNKNOWN': '發生未知的錯誤',
  },
}

export function getTranslatedError(
  code: number | undefined,
  fallbackMsg: string
): string {
  const locale = useLanguageStore.getState().locale || 'zh-TW'
  const langMessages = translations[locale] || translations['en']

  if (code === undefined) {
    return langMessages['Errors.UNKNOWN']
  }

  const key = errorCodeToKeyMap[code]
  if (!key) {
    return fallbackMsg || langMessages['Errors.UNKNOWN']
  }

  return langMessages[key] || fallbackMsg
}
