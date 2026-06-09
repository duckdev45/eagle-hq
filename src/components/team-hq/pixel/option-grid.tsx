interface Option {
  value: string
  label: string
  color?: string
}

interface OptionGridProps {
  options: Option[]
  selected: string
  onSelect: (value: string) => void
  columns?: 3 | 4
}

export function OptionGrid({ options, selected, onSelect, columns = 4 }: OptionGridProps) {
  return (
    <div className={`opt-grid${columns === 3 ? ' cols-3' : ''}`}>
      {options.map((o) => (
        <button
          key={o.value}
          className={`stbtn${selected === o.value ? ' on' : ''}`}
          style={selected === o.value && o.color ? { borderColor: o.color } : undefined}
          onClick={() => onSelect(o.value)}
        >
          {o.color && <span className='sd' style={{ background: o.color }} />}
          {o.label}
        </button>
      ))}
    </div>
  )
}
