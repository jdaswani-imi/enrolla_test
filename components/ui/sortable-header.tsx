'use client'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface SortableHeaderProps {
  label: string
  field: string
  sortField: string | null
  sortDir: 'asc' | 'desc'
  onSort: (field: string) => void
  className?: string
  align?: 'left' | 'right' | 'center'
}

export function SortableHeader({ label, field, sortField, sortDir, onSort, className, align = 'left' }: SortableHeaderProps) {
  const active = sortField === field
  return (
    <th
      className={cn(
        'px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide cursor-pointer select-none hover:text-slate-700 group whitespace-nowrap',
        align === 'right' && 'text-right',
        align === 'center' && 'text-center',
        className
      )}
      onClick={() => onSort(field)}
    >
      <div className={cn('flex items-center gap-1', align === 'right' && 'justify-end', align === 'center' && 'justify-center')}>
        {label}
        <span className={cn('transition-colors', active ? 'text-amber-500' : 'text-slate-300 group-hover:text-slate-400')}>
          {active && sortDir === 'asc' ? '↑' : active && sortDir === 'desc' ? '↓' : '↕'}
        </span>
      </div>
    </th>
  )
}

export function useSortState(initial: string | null = null) {
  const [sortField, setSortField] = useState<string | null>(initial)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  function toggleSort(field: string) {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  function sortData<T extends Record<string, unknown>>(data: T[]): T[] {
    if (!sortField) return data
    return [...data].sort((a, b) => {
      const av = a[sortField]
      const bv = b[sortField]
      if (av == null) return 1
      if (bv == null) return -1
      const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true })
      return sortDir === 'asc' ? cmp : -cmp
    })
  }

  return { sortField, sortDir, toggleSort, sortData }
}
