import { useTranslations } from 'next-intl'

export default function HomePage() {
  const t = useTranslations('HomePage')

  return (
    <main className='flex min-h-screen flex-col items-center justify-center gap-4'>
      <h1 className='text-4xl font-bold'>{t('title')}</h1>
      <p className='text-muted-foreground'>{t('subtitle')}</p>
    </main>
  )
}
