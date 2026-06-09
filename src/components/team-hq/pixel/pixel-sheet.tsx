import type { CSSProperties, ReactNode } from 'react'

interface PixelSheetProps {
  headerContent: ReactNode
  children: ReactNode
  footer: ReactNode
  accent?: string
  onClose: () => void
  wide?: boolean
}

export function PixelSheet({ headerContent, children, footer, accent, onClose, wide }: PixelSheetProps) {
  const style: CSSProperties = {
    ...(accent ? { ['--accent' as string]: accent } : {}),
    ...(wide ? { width: 640 } : {}),
  }

  return (
    <div className='sheet' style={style} onClick={(e) => e.stopPropagation()}>
      <header>
        {headerContent}
        <button className='x' onClick={onClose}>✕</button>
      </header>
      <div className='form'>{children}</div>
      <footer>{footer}</footer>
    </div>
  )
}
