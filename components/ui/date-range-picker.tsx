'use client'
import { useState, useRef, useEffect } from 'react'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface DateRange {
  from: Date | null
  to: Date | null
}

interface DateRangePickerProps {
  value: DateRange
  onChange: (range: DateRange) => void
  presets?: { label: string; getValue: () => DateRange }[]
  placeholder?: string
}

export function DateRangePicker({ value, onChange, presets, placeholder = 'Date range' }: DateRangePickerProps) {
  const [open, setOpen] = useState(false)
  const [month, setMonth] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })
  const [selecting, setSelecting] = useState<'from' | 'to'>('from')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const days = getDaysInMonth(month)
  const label = value.from && value.to
    ? `${formatDate(value.from)} – ${formatDate(value.to)}`
    : value.from
    ? `From ${formatDate(value.from)}`
    : placeholder

  function handleDayClick(day: Date) {
    if (selecting === 'from') {
      onChange({ from: day, to: null })
      setSelecting('to')
    } else {
      if (value.from && day < value.from) {
        onChange({ from: day, to: value.from })
      } else {
        onChange({ from: value.from, to: day })
      }
      setSelecting('from')
      setOpen(false)
    }
  }

  const isActive = value.from || value.to

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
        <Calendar className="w-3.5 h-3.5" />
        {label}
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-50 w-72 p-4">
          {presets && (
            <div className="flex flex-wrap gap-1.5 mb-3 pb-3 border-b border-slate-100">
              {presets.map(p => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => { onChange(p.getValue()); setOpen(false) }}
                  className="px-2 py-1 text-xs rounded-md bg-slate-100 hover:bg-amber-100 hover:text-amber-700 text-slate-600 transition-colors cursor-pointer"
                >
                  {p.label}
                </button>
              ))}
              {isActive && (
                <button
                  type="button"
                  onClick={() => { onChange({ from: null, to: null }); setOpen(false) }}
                  className="px-2 py-1 text-xs rounded-md bg-slate-100 hover:bg-slate-200 text-slate-500 cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
          )}

          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={() => setMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
              className="p-1 hover:bg-slate-100 rounded cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4 text-slate-600" />
            </button>
            <span className="text-sm font-medium text-slate-700">
              {month.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </span>
            <button
              type="button"
              onClick={() => setMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
              className="p-1 hover:bg-slate-100 rounded cursor-pointer"
            >
              <ChevronRight className="w-4 h-4 text-slate-600" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-0.5 text-center">
            {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(d => (
              <div key={d} className="text-xs text-slate-400 py-1">{d}</div>
            ))}
            {days.map((day, i) => {
              if (!day) return <div key={i} />
              const isFrom = value.from && isSameDay(day, value.from)
              const isTo = value.to && isSameDay(day, value.to)
              const inRange = value.from && value.to && day > value.from && day < value.to
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleDayClick(day)}
                  className={cn(
                    'text-xs py-1.5 rounded transition-colors cursor-pointer',
                    isFrom || isTo ? 'bg-amber-500 text-white' :
                    inRange ? 'bg-amber-100 text-amber-800' :
                    'hover:bg-slate-100 text-slate-700'
                  )}
                >
                  {day.getDate()}
                </button>
              )
            })}
          </div>

          <p className="text-xs text-slate-400 mt-3 text-center">
            {selecting === 'from' ? 'Select start date' : 'Select end date'}
          </p>
        </div>
      )}
    </div>
  )
}

export const DATE_PRESETS = [
  { label: 'Today', getValue: () => ({ from: new Date(), to: new Date() }) },
  { label: 'This week', getValue: () => {
    const now = new Date()
    const mon = new Date(now); mon.setDate(now.getDate() - ((now.getDay() + 6) % 7))
    const sun = new Date(mon); sun.setDate(mon.getDate() + 6)
    return { from: mon, to: sun }
  }},
  { label: 'This month', getValue: () => {
    const now = new Date()
    return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: new Date(now.getFullYear(), now.getMonth() + 1, 0) }
  }},
  { label: 'Last month', getValue: () => {
    const now = new Date()
    return { from: new Date(now.getFullYear(), now.getMonth() - 1, 1), to: new Date(now.getFullYear(), now.getMonth(), 0) }
  }},
  { label: 'This term', getValue: () => ({ from: new Date(2025, 3, 14), to: new Date(2025, 6, 25) }) },
]

function getDaysInMonth(month: Date): (Date | null)[] {
  const year = month.getFullYear()
  const m = month.getMonth()
  const firstDay = new Date(year, m, 1).getDay()
  const offset = firstDay === 0 ? 6 : firstDay - 1
  const daysInMonth = new Date(year, m + 1, 0).getDate()
  const days: (Date | null)[] = Array(offset).fill(null)
  for (let d = 1; d <= daysInMonth; d++) days.push(new Date(year, m, d))
  return days
}

function isSameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString()
}

function formatDate(d: Date) {
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}
