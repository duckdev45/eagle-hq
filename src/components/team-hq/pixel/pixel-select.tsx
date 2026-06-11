'use client'

import { useEffect, useRef, useState } from 'react'

export interface PixelSelectOption {
  value: string
  label: string
  hint?: string
  /* 不可選取的群組標題列 */
  header?: boolean
}

interface PixelSelectProps {
  value: string
  options: PixelSelectOption[]
  onChange: (value: string) => void
}

export function PixelSelect({ value, options, onChange }: PixelSelectProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  const sel = options.find((o) => o.value === value)

  return (
    <div className='pxsel' ref={ref}>
      <button type='button' className={`pxsel-btn${open ? ' open' : ''}`} onClick={() => setOpen((v) => !v)}>
        <span className='pxsel-label'>{sel?.label ?? ''}</span>
        <span className='pxsel-caret'>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className='pxsel-menu'>
          {options.map((o) =>
            o.header
              ? (
                  <div key={o.value} className='pxsel-head'>
                    <span className='pxsel-opt-label'>{o.label}</span>
                    {o.hint && <span className='pxsel-opt-hint'>{o.hint}</span>}
                  </div>
                )
              : (
                  <button
                    type='button'
                    key={o.value}
                    className={`pxsel-opt${o.value === value ? ' on' : ''}`}
                    onClick={() => { onChange(o.value); setOpen(false) }}
                  >
                    <span className='pxsel-opt-label'>{o.label}</span>
                    {o.hint && <span className='pxsel-opt-hint'>{o.hint}</span>}
                  </button>
                )
          )}
        </div>
      )}
    </div>
  )
}
