'use client'
import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MultiSelectFilterProps {
  label: string
  options: string[]
  selected: string[]
  onChange: (selected: string[]) => void
}

export function MultiSelectFilter({ label, options, selected, onChange }: MultiSelectFilterProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function toggle(option: string) {
    if (selected.includes(option)) {
      onChange(selected.filter(s => s !== option))
    } else {
      onChange([...selected, option])
    }
  }

  const isActive = selected.length > 0
  const displayLabel = isActive
    ? selected.length > 1
      ? `${label}: ${selected[0]} +${selected.length - 1}`
      : `${label}: ${selected[0]}`
    : label

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all cursor-pointer whitespace-nowrap',
          isActive
            ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
            : 'bg-white text-slate-600 border-slate-200 hover:border-amber-300 hover:text-amber-700'
        )}
      >
        {displayLabel}
        <ChevronDown className={cn('w-3.5 h-3.5 transition-transform duration-150', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg z-50 min-w-[160px] overflow-hidden">
          {options.map(opt => (
            <div
              key={opt}
              onClick={() => toggle(opt)}
              className="flex items-center justify-between px-3 py-2 hover:bg-slate-50 cursor-pointer text-sm text-slate-700"
            >
              <span>{opt}</span>
              {selected.includes(opt) && <Check className="w-3.5 h-3.5 text-amber-500" />}
            </div>
          ))}
          {selected.length > 0 && (
            <>
              <div className="border-t border-slate-100" />
              <div
                onClick={() => onChange([])}
                className="px-3 py-2 text-xs text-slate-400 hover:text-slate-600 cursor-pointer hover:bg-slate-50"
              >
                Clear selection
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
