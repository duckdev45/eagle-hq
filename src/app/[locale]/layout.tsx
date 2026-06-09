import type { Metadata } from 'next'

import React from 'react'
import { Noto_Sans_TC, Press_Start_2P } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'

import { QueryProvider } from '@/components/query-provider'
import { ThemeProvider } from '@/components/theme-provider'

import '../globals.css'

const pixelFont = Press_Start_2P({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-px',
  display: 'swap',
})

const zhFont = Noto_Sans_TC({
  weight: ['400', '700', '900'],
  subsets: ['latin'],
  variable: '--font-zh',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Eagle HQ',
  description: 'Eagle HQ',
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const messages = await getMessages()

  return (
    <html lang={locale} suppressHydrationWarning className={`${pixelFont.variable} ${zhFont.variable}`}>
      <body>
        <NextIntlClientProvider messages={messages}>
          <QueryProvider>
            <ThemeProvider
              attribute='class'
              defaultTheme='system'
              enableSystem
              disableTransitionOnChange
            >
              {children}
            </ThemeProvider>
          </QueryProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
