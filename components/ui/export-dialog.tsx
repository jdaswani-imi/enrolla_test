"use client"

import { useState } from "react"
import { Check, ClipboardList, List, FileText, Info, Download } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"

export type ExportFormatIcon = "rows" | "items" | "pdf"

export interface ExportFormat {
  id: string
  label: string
  description: string
  icon: ExportFormatIcon
  recommended?: boolean
}

interface ExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  recordCount: number
  formats: ExportFormat[]
  filters?: string
  totalCount?: number
}

const ICONS: Record<ExportFormatIcon, React.ComponentType<{ className?: string }>> = {
  rows: ClipboardList,
  items: List,
  pdf: FileText,
}

export function ExportDialog({
  open,
  onOpenChange,
  title,
  recordCount,
  formats,
  filters,
  totalCount,
}: ExportDialogProps) {
  const defaultFormatId = formats.find((f) => f.recommended)?.id ?? formats[0]?.id ?? ""
  const [selectedFormat, setSelectedFormat] = useState(defaultFormatId)
  const [scope, setScope] = useState<"current" | "all">("current")
  const [toast, setToast] = useState<string | null>(null)

  const allRecords = totalCount ?? recordCount

  function handleDownload() {
    setToast("Preparing export... your download will start shortly")
    window.setTimeout(() => setToast(null), 3200)
    onOpenChange(false)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg w-full">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>Choose your preferred export format</DialogDescription>
            {filters && (
              <div className="mt-2 inline-flex items-center gap-1.5 self-start rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                <Info className="h-3.5 w-3.5 text-slate-500" />
                <span>{filters}</span>
              </div>
            )}
          </DialogHeader>

          <div className="flex flex-col gap-5 p-6">
            <div className="grid grid-cols-2 gap-3">
              {formats.map((format) => {
                const Icon = ICONS[format.icon]
                const selected = selectedFormat === format.id
                return (
                  <button
                    key={format.id}
                    type="button"
                    onClick={() => setSelectedFormat(format.id)}
                    className={cn(
                      "relative rounded-xl border p-4 text-left transition-colors cursor-pointer",
                      "focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400",
                      selected
                        ? "border-amber-400 bg-amber-50/50"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50",
                    )}
                    aria-pressed={selected}
                  >
                    <span
                      className={cn(
                        "absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full border transition-all",
                        selected
                          ? "border-amber-400 bg-amber-400 text-white"
                          : "border-slate-300 bg-white",
                      )}
                    >
                      {selected && <Check className="h-3 w-3" strokeWidth={3} />}
                    </span>

                    <Icon className="mb-3 h-5 w-5 text-slate-700" />

                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold text-slate-800">{format.label}</span>
                      {format.recommended && (
                        <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                          Rec
                        </span>
                      )}
                    </div>

                    <p className="mt-1 text-xs leading-snug text-slate-500">{format.description}</p>
                  </button>
                )
              })}
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Export scope
              </span>
              <div className="flex flex-col gap-1.5">
                <ScopeRadio
                  label={`Current view (${recordCount.toLocaleString()} records)`}
                  checked={scope === "current"}
                  onChange={() => setScope("current")}
                />
                <ScopeRadio
                  label={`All records (${allRecords.toLocaleString()} records)`}
                  checked={scope === "all"}
                  onChange={() => setScope("all")}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="flex items-center justify-between gap-3">
            <p className="text-xs text-slate-500">Fields included: all visible columns</p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDownload}
                className="inline-flex items-center gap-1.5 rounded-lg bg-amber-400 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-amber-500 transition-colors cursor-pointer"
              >
                <Download className="h-4 w-4" />
                Download
              </button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {toast && (
        <div className="fixed bottom-6 right-6 z-[100] rounded-xl bg-slate-900 px-4 py-3 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}
    </>
  )
}

function ScopeRadio({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: () => void
}) {
  return (
    <label className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer">
      <span
        className={cn(
          "flex h-4 w-4 items-center justify-center rounded-full border transition-colors",
          checked ? "border-amber-400" : "border-slate-300",
        )}
      >
        {checked && <span className="h-2 w-2 rounded-full bg-amber-400" />}
      </span>
      <input
        type="radio"
        className="sr-only"
        checked={checked}
        onChange={onChange}
      />
      <span>{label}</span>
    </label>
  )
}
