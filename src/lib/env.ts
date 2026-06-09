import { z } from 'zod'

export type AppEnv = 'DEV' | 'QAS' | 'PRD'

declare global {
  interface Window {
    __ENV__?: {
      APP_ENV: AppEnv
      API_BASE_URL: string
      APP_PUBLIC_URL?: string
    }
  }
}

const EnvSchema = z.object({
  APP_ENV: z.enum(['DEV', 'QAS', 'PRD']),
  API_BASE_URL: z.string().min(1),
  APP_PUBLIC_URL: z.string().optional(),
})

type Env = z.infer<typeof EnvSchema>

const isBrowser: boolean = typeof window !== 'undefined'

function trimTrailingSlash(u: string): string {
  return u.endsWith('/') ? u.replace(/\/+$/, '') : u
}

function readRaw(): unknown {
  if (!isBrowser) {
    return {
      APP_ENV: process.env.NEXT_PUBLIC_APP_ENV,
      API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
      APP_PUBLIC_URL: process.env.NEXT_PUBLIC_APP_PUBLIC_URL,
    }
  }

  if (window.__ENV__ && window.__ENV__.API_BASE_URL) {
    return window.__ENV__
  }

  return {
    APP_ENV: process.env.NEXT_PUBLIC_APP_ENV ?? 'DEV',
    API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL ?? '',
    APP_PUBLIC_URL: process.env.NEXT_PUBLIC_APP_PUBLIC_URL,
  }
}

let cachedEnv: Env | null = null

export function getEnv(): Env {
  if (cachedEnv) return cachedEnv

  if (process.env.SKIP_ENV_VALIDATION === 'true') {
    return {
      APP_ENV: 'DEV',
      API_BASE_URL: 'http://build-placeholder',
      APP_PUBLIC_URL: undefined,
    }
  }

  const raw = readRaw()
  const parsed = EnvSchema.safeParse(raw)

  if (!parsed.success) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[ENV] fallback in dev:', parsed.error.flatten().fieldErrors)
      cachedEnv = {
        APP_ENV: 'DEV',
        API_BASE_URL: '',
        APP_PUBLIC_URL: undefined,
      }
      return cachedEnv
    }
    throw new Error(
      `[ENV] Validation failed. Errors: ${JSON.stringify(parsed.error.flatten().fieldErrors)}`
    )
  }

  cachedEnv = {
    ...parsed.data,
    API_BASE_URL: trimTrailingSlash(parsed.data.API_BASE_URL),
  }

  return cachedEnv
}

export function joinApi(path: string): string {
  const { API_BASE_URL } = getEnv()
  const p = path.startsWith('/') ? path : `/${path}`
  return `${API_BASE_URL}${p}`
}

export function joinBase(path: string): string {
  return path.startsWith('/') ? path : `/${path}`
}

export const ENV = getEnv()
