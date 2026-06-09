import type { InputHTMLAttributes, ReactNode } from 'react'

interface PixelFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: ReactNode
  wrapperClassName?: string
}

export function PixelField({ label, wrapperClassName, ...inputProps }: PixelFieldProps) {
  return (
    <div className={`pfield ${wrapperClassName ?? ''}`}>
      <label>{label}</label>
      <input type='text' {...inputProps} />
    </div>
  )
}
