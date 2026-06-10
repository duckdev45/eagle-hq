import React, { ReactNode } from 'react'

interface PixelBoardProps {
  title: string
  zhTitle?: string
  headerRight?: ReactNode
  children: ReactNode
  className?: string
  bodyStyle?: React.CSSProperties
  open?: boolean
  onToggle?: () => void
}

export function PixelBoard({ title, zhTitle, headerRight, children, className, bodyStyle, open = true, onToggle }: PixelBoardProps) {
  const accordion = onToggle !== undefined
  return (
    <div className={`board ${className ?? ''}${accordion ? (open ? ' open' : ' closed') : ''}`}>
      <h3 className={accordion ? 'clickable' : undefined} onClick={onToggle}>
        <span>
          {accordion && <span className='caret'>{open ? '▼' : '▶'}</span>}
          {title}
        </span>
        {(zhTitle || headerRight) && (
          <span className='h3-right'>
            {zhTitle && <span className='zh'>{zhTitle}</span>}
            {headerRight && <span onClick={(e) => e.stopPropagation()}>{headerRight}</span>}
          </span>
        )}
      </h3>
      <div className='body' style={bodyStyle} onClick={accordion && !open ? onToggle : undefined}>
        {children}
      </div>
    </div>
  )
}
