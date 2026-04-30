"use client"

import { useEffect, useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { getAvatarPalette, getInitials } from "@/lib/avatar-utils"

type HistoryEntry = {
  id: string
  changed_by_name: string
  previous_status: string
  new_status: string
  changed_at: string
}

const STAGE_BADGE: Record<string, string> = {
  New:                 "bg-slate-100 text-slate-700 border-slate-200",
  Contacted:           "bg-blue-100 text-blue-700 border-blue-200",
  "Assessment Booked": "bg-purple-100 text-purple-700 border-purple-200",
  "Assessment Done":   "bg-indigo-100 text-indigo-700 border-indigo-200",
  "Trial Booked":      "bg-amber-100 text-amber-700 border-amber-200",
  "Trial Done":        "bg-emerald-100 text-emerald-700 border-emerald-200",
  "Schedule Offered":  "bg-orange-100 text-orange-700 border-orange-200",
  "Schedule Confirmed":"bg-cyan-100 text-cyan-700 border-cyan-200",
  "Invoice Sent":      "bg-teal-100 text-teal-700 border-teal-200",
  Won:                 "bg-green-100 text-green-700 border-green-200",
  Lost:                "bg-red-100 text-red-700 border-red-200",
}

function stageBadge(stage: string) {
  return STAGE_BADGE[stage] ?? "bg-slate-100 text-slate-600 border-slate-200"
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return "just now"
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}

const PAGE_SIZE = 10

export function ActivityTimeline({
  leadId,
  refreshKey,
}: {
  leadId: string
  refreshKey?: string
}) {
  const [history, setHistory] = useState<HistoryEntry[] | null>(null)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    setHistory(null)
    setExpanded(false)
    fetch(`/api/status-history?entity_type=lead&entity_id=${leadId}`)
      .then((r) => r.json())
      .then(({ data }) => setHistory(data ?? []))
      .catch(() => setHistory([]))
  }, [leadId, refreshKey])

  const recent = history?.slice(0, PAGE_SIZE) ?? []
  const older = history?.slice(PAGE_SIZE) ?? []
  const hasMore = older.length > 0

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
        Stage History
      </p>

      {history === null ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="w-6 h-6 rounded-full bg-slate-200 shrink-0" />
              <div className="h-3.5 bg-slate-200 rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : history.length === 0 ? (
        <p className="text-sm text-slate-400 italic">No stage changes recorded yet.</p>
      ) : (
        <div className="space-y-3.5">
          {recent.map((entry) => (
            <TimelineRow key={entry.id} entry={entry} />
          ))}

          {hasMore && expanded && (
            <>
              <div className="flex items-center gap-2 py-1">
                <div className="flex-1 h-px bg-slate-100" />
                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider whitespace-nowrap">
                  older entries
                </span>
                <div className="flex-1 h-px bg-slate-100" />
              </div>
              {older.map((entry) => (
                <TimelineRow key={entry.id} entry={entry} />
              ))}
            </>
          )}

          {hasMore && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-slate-700 transition-colors duration-150 cursor-pointer mt-0.5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-400 rounded"
            >
              {expanded ? (
                <>
                  <ChevronUp className="w-3 h-3" />
                  Show less
                </>
              ) : (
                <>
                  <ChevronDown className="w-3 h-3" />
                  Show full history ({older.length} older)
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function TimelineRow({ entry }: { entry: HistoryEntry }) {
  const p = getAvatarPalette(entry.changed_by_name)
  return (
    <div className="flex items-start gap-3">
      <div
        className={cn(
          "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5",
          p.bg,
          p.text
        )}
      >
        {getInitials(entry.changed_by_name)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-1.5 text-sm leading-snug">
          <span className="font-semibold text-slate-700">{entry.changed_by_name}</span>
          <span className="text-slate-400">moved stage from</span>
          <span
            className={cn(
              "px-1.5 py-0.5 rounded text-[11px] font-medium border",
              stageBadge(entry.previous_status)
            )}
          >
            {entry.previous_status}
          </span>
          <span className="text-slate-400">→</span>
          <span
            className={cn(
              "px-1.5 py-0.5 rounded text-[11px] font-medium border",
              stageBadge(entry.new_status)
            )}
          >
            {entry.new_status}
          </span>
        </div>
        <p className="text-[11px] text-slate-400 mt-0.5">{timeAgo(entry.changed_at)}</p>
      </div>
    </div>
  )
}
