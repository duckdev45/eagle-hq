import type { Lang } from '@/types/team'
import { HQ_I18N } from '@/data/i18n'

interface TitleBarProps {
  lang: Lang
  syncTs: string
  clock: string
  onLangChange: (lang: Lang) => void
  onTweaksOpen: () => void
}

export function TitleBar({ lang, syncTs, clock, onLangChange, onTweaksOpen }: TitleBarProps) {
  const t = HQ_I18N[lang]
  return (
    <div className='titlebar'>
      <div className='title-txt'>
        <span className='t1'>EAGLE AI · TEAM HQ</span>
        {/*<span className='t2'>{t.subtitle}</span>*/}
      </div>
      <div className='spacer' />
      <div className='lang-toggle'>
        <button className={lang === 'zh' ? 'on' : ''} onClick={() => onLangChange('zh')}>TW</button>
        <button className={lang === 'en' ? 'on' : ''} onClick={() => onLangChange('en')}>EN</button>
      </div>
      <div className='sync'>
        <span className='dot' />
        <span>{t.synced}</span>
        <span className='meta'> {syncTs}</span>
      </div>
      <div className='now-clock'>{clock}</div>
      <button className='tw-btn' onClick={onTweaksOpen}>{t.tweaks}</button>
    </div>
  )
}
