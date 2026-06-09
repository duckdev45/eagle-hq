import type { ButtonHTMLAttributes } from 'react'

interface PixelButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'save' | 'ghost' | 'danger'
}

export function PixelButton({ variant = 'ghost', className, children, ...props }: PixelButtonProps) {
  return (
    <button className={`btn-px ${variant} ${className ?? ''}`} {...props}>
      {children}
    </button>
  )
}
