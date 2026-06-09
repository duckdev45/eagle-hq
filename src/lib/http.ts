import type { InternalAxiosRequestConfig } from 'axios'

import axios, { type AxiosError, type AxiosInstance } from 'axios'
import { toast } from 'sonner'

import { getTranslatedError } from '@/i18n/error-messages'
import { ENV, joinApi, joinBase } from '@/lib/env'
import { useAuthStore } from '@/store/auth.store'
import { useLanguageStore } from '@/store/language.store'

export function createHttpClient(
  baseURL: string,
  getToken?: () => string | null
): AxiosInstance {
  const instance = axios.create({
    baseURL,
    timeout: 15000,
  })

  instance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const token = getToken?.()
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    },
    (error: AxiosError) => Promise.reject(error)
  )

  instance.interceptors.response.use(
    (response) => {
      const { code, msg, data } = response.data

      if (code === 0) {
        return data
      }

      const errorMsg = getTranslatedError(code, msg)

      if (code === 10004) {
        toast.error(errorMsg)
        useAuthStore.getState().logout()
        if (typeof window !== 'undefined') {
          const locale = useLanguageStore.getState().locale
          window.location.href = joinBase(`/${locale}`)
          return new Promise(() => {})
        }
      }

      toast.error(errorMsg)
      return Promise.reject(new Error(errorMsg))
    },
    (error: AxiosError<{ code?: number; msg?: string }>) => {
      const responseData = error.response?.data
      const code = responseData?.code
      const msg = responseData?.msg || error.message

      const errorMsg = getTranslatedError(code, msg)

      if (code === 10004) {
        toast.error(errorMsg)
        useAuthStore.getState().logout()
        if (typeof window !== 'undefined') {
          const locale = useLanguageStore.getState().locale
          window.location.href = joinBase(`/${locale}`)
          return new Promise(() => {})
        }
      }

      toast.error(errorMsg)
      return Promise.reject(new Error(errorMsg))
    }
  )

  return instance
}

const getTokenFromStore = () => useAuthStore.getState().token

export const api = createHttpClient(ENV.API_BASE_URL, getTokenFromStore)

export const v1Api: AxiosInstance = createHttpClient(
  joinApi('/v1'),
  getTokenFromStore
)

export const services = [api, v1Api] as const
