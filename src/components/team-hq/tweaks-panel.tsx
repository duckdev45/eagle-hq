import type { Lang, Tweaks } from '@/types/team'
import { FLOOR_THEMES } from '@/data/seed'
import { HQ_I18N } from '@/data/i18n'

import { Scrim } from './pixel/scrim'

interface TweaksPanelProps {
  tw: Tweaks
  lang: Lang
  onClose: () => void
  onChangeTweaks: (tw: Tweaks) => void
}

export function TweaksPanel({ tw, lang, onClose, onChangeTweaks }: TweaksPanelProps) {
  const t = HQ_I18N[lang]
  const zh = lang === 'zh'

  return (
    <Scrim onClose={onClose} align='end'>
      <div className='tweaks-panel' onClick={(e) => e.stopPropagation()}>
        <h4>
          TWEAKS <button onClick={onClose}>✕</button>
        </h4>
        <div className='tw-body'>
          <div className='tw-group'>
            <label>{t.floor}</label>
            <div className='tw-opts'>
              {FLOOR_THEMES.map((th) => (
                <div
                  key={th.id}
                  className={`tw-swatch${tw.floor === th.id ? ' on' : ''}`}
                  title={zh ? th.name : t.themes[th.id]}
                  style={{ background: th.sw }}
                  onClick={() => onChangeTweaks({ ...tw, floor: th.id })}
                />
              ))}
            </div>
          </div>
          <div className='tw-group'>
            <label>{t.board}</label>
            <div className='tw-opts'>
              {([['chalk', t.chalk], ['led', t.led]] as const).map(([v, lbl]) => (
                <div
                  key={v}
                  className={`tw-opt${tw.board === v ? ' on' : ''}`}
                  onClick={() => onChangeTweaks({ ...tw, board: v })}
                >
                  {lbl}
                </div>
              ))}
            </div>
          </div>
          <div className='tw-group'>
            <label>{t.idle}</label>
            <div className='tw-opts'>
              {([['on', t.on], ['off', t.off]] as const).map(([v, lbl]) => (
                <div
                  key={v}
                  className={`tw-opt${tw.idle === v ? ' on' : ''}`}
                  onClick={() => onChangeTweaks({ ...tw, idle: v })}
                >
                  {lbl}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Scrim>
  )
}
