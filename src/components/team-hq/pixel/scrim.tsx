import type { CSSProperties, ReactNode } from 'react'

interface ScrimProps {
  onClose: () => void
  children: ReactNode
  align?: 'center' | 'end'
}

export function Scrim({ onClose, children, align = 'center' }: ScrimProps) {
  const style: CSSProperties = align === 'end' ? { justifyItems: 'center' } : {}
  return (
    <div className='scrim' style={style} onClick={onClose}>
      {children}
    </div>
  )
}
