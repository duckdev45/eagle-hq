import Cookies from 'js-cookie'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

interface LanguageState {
  locale: string
  setLocale: (locale: string) => void
}

export const useLanguageStore = create(
  persist<LanguageState>(
    (set) => ({
      locale: 'zh-TW',
      setLocale: (locale: string) => {
        set({ locale })
        Cookies.set('NEXT_LOCALE', locale)
      },
    }),
    {
      name: 'language-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
