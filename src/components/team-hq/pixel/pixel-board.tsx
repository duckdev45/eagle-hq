import React, { ReactNode } from 'react'

interface PixelBoardProps {
  title: string
  zhTitle?: string
  headerRight?: ReactNode
  children: ReactNode
  className?: string
  bodyStyle?: React.CSSProperties
}

export function PixelBoard({ title, zhTitle, headerRight, children, className, bodyStyle }: PixelBoardProps) {
  return (
    <div className={`board ${className ?? ''}`}>
      <h3>
        <span>{title}</span>
        {(zhTitle || headerRight) && (
          <span className='h3-right'>
            {zhTitle && <span className='zh'>{zhTitle}</span>}
            {headerRight}
          </span>
        )}
      </h3>
      <div className='body' style={bodyStyle}>
        {children}
      </div>
    </div>
  )
}
