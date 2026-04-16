'use client'
import { cn } from '@/lib/utils'

interface PaginationBarProps {
  total: number
  page: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
}

export function PaginationBar({ total, page, pageSize, onPageChange, onPageSizeChange }: PaginationBarProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, total)

  const pageButtons = getPageButtons(page, totalPages)

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-white flex-wrap gap-2">
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-500">Rows per page:</span>
        <select
          value={pageSize}
          onChange={e => { onPageSizeChange(Number(e.target.value)); onPageChange(1) }}
          className="border border-slate-200 rounded-lg px-2 py-1 text-sm text-slate-700 focus:outline-none focus:border-amber-400 cursor-pointer bg-white"
        >
          {[10, 20, 50, 100].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <span className="text-sm text-slate-500">
        {total === 0 ? 'No results' : `${start}–${end} of ${total}`}
      </span>

      <div className="flex items-center gap-1">
        <PageBtn onClick={() => onPageChange(1)} disabled={page === 1}>«</PageBtn>
        <PageBtn onClick={() => onPageChange(page - 1)} disabled={page === 1}>‹</PageBtn>

        {pageButtons.map((p, i) =>
          p === '...' ? (
            <span key={`ellipsis-${i}`} className="px-2 py-1 text-sm text-slate-400">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p as number)}
              className={cn(
                'min-w-[32px] px-2 py-1 text-sm rounded transition-colors cursor-pointer',
                p === page ? 'bg-amber-500 text-white font-medium' : 'text-slate-600 hover:bg-slate-100'
              )}
            >
              {p}
            </button>
          )
        )}

        <PageBtn onClick={() => onPageChange(page + 1)} disabled={page === totalPages}>›</PageBtn>
        <PageBtn onClick={() => onPageChange(totalPages)} disabled={page === totalPages}>»</PageBtn>
      </div>
    </div>
  )
}

function PageBtn({ onClick, disabled, children }: { onClick: () => void; disabled: boolean; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="px-2 py-1 text-sm text-slate-600 hover:bg-slate-100 rounded disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
    >
      {children}
    </button>
  )
}

function getPageButtons(page: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages: (number | '...')[] = []
  if (page <= 4) {
    pages.push(1, 2, 3, 4, 5, '...', total)
  } else if (page >= total - 3) {
    pages.push(1, '...', total - 4, total - 3, total - 2, total - 1, total)
  } else {
    pages.push(1, '...', page - 1, page, page + 1, '...', total)
  }
  return pages
}
