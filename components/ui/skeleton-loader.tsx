// Reusable skeleton shimmer components
// Usage: <SkeletonLoader rows={5} columns={4} />
// Exports: SkeletonPulse, SkeletonCard, SkeletonTable, SkeletonKpi, SkeletonPageHeader, SkeletonFilterBar, etc.

export function SkeletonPulse({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-slate-200 rounded ${className ?? ""}`} />
  );
}

export function SkeletonKpi() {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5 h-[140px] flex flex-col justify-between">
      <SkeletonPulse className="h-5 w-5 rounded-md" />
      <div className="space-y-1.5">
        <SkeletonPulse className="h-3 w-24" />
        <SkeletonPulse className="h-7 w-28" />
      </div>
      <SkeletonPulse className="h-3 w-20" />
    </div>
  );
}

export function SkeletonTableRow({ columns = 6 }: { columns?: number }) {
  return (
    <tr className="border-b border-slate-100">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <SkeletonPulse className={`h-4 ${i === 0 ? "w-36" : "w-20"}`} />
        </td>
      ))}
    </tr>
  );
}

export function SkeletonTable({ rows = 5, columns = 6 }: { rows?: number; columns?: number }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      <div className="border-b border-slate-200 px-4 py-3 bg-slate-50 flex items-center gap-4">
        {Array.from({ length: columns }).map((_, i) => (
          <SkeletonPulse key={i} className={`h-4 ${i === 0 ? "w-36" : "w-20"}`} />
        ))}
      </div>
      <table className="w-full">
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <SkeletonTableRow key={i} columns={columns} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-3">
      <SkeletonPulse className="h-5 w-40" />
      <SkeletonPulse className="h-4 w-full" />
      <SkeletonPulse className="h-4 w-3/4" />
      <div className="flex gap-2 pt-1">
        <SkeletonPulse className="h-6 w-16 rounded-full" />
        <SkeletonPulse className="h-6 w-20 rounded-full" />
      </div>
    </div>
  );
}

// ─── Page-level skeleton building blocks ─────────────────────────────────────

export function SkeletonPageHeader({ actions = 2 }: { actions?: number }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="space-y-1.5">
        <SkeletonPulse className="h-7 w-52" />
        <SkeletonPulse className="h-4 w-36" />
      </div>
      <div className="flex gap-2">
        {Array.from({ length: actions }).map((_, i) => (
          <SkeletonPulse key={i} className="h-9 w-28 rounded-md" />
        ))}
      </div>
    </div>
  );
}

export function SkeletonFilterBar({ filters = 4 }: { filters?: number }) {
  return (
    <div className="flex items-center gap-2 mb-4 flex-wrap">
      <SkeletonPulse className="h-9 w-60 rounded-md" />
      {Array.from({ length: filters }).map((_, i) => (
        <SkeletonPulse key={i} className={`h-9 rounded-md ${i % 2 === 0 ? "w-28" : "w-32"}`} />
      ))}
      <SkeletonPulse className="h-9 w-24 rounded-md ml-auto" />
    </div>
  );
}

export function SkeletonStatsRow() {
  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-white rounded-lg border border-slate-200 p-4 flex items-center gap-3">
          <SkeletonPulse className="h-10 w-10 rounded-lg flex-shrink-0" />
          <div className="space-y-1.5 flex-1">
            <SkeletonPulse className="h-3 w-24" />
            <SkeletonPulse className="h-6 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonChart({ height = 220 }: { height?: number }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <SkeletonPulse className="h-5 w-40" />
        <SkeletonPulse className="h-8 w-24 rounded-md" />
      </div>
      <div className="animate-pulse bg-slate-200 rounded w-full" style={{ height }} />
    </div>
  );
}

export function SkeletonTimetable() {
  const days = 5;
  const slots = 8;
  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      {/* Day header row */}
      <div className="flex border-b border-slate-200">
        <div className="w-[60px] flex-shrink-0 border-r border-slate-200 p-2" />
        {Array.from({ length: days }).map((_, i) => (
          <div key={i} className="flex-1 p-3 border-r border-slate-200 last:border-r-0 space-y-1">
            <SkeletonPulse className="h-3 w-8 mx-auto" />
            <SkeletonPulse className="h-5 w-6 mx-auto" />
          </div>
        ))}
      </div>
      {/* Time grid */}
      <div className="flex">
        <div className="w-[60px] flex-shrink-0 border-r border-slate-200">
          {Array.from({ length: slots }).map((_, i) => (
            <div key={i} className="h-16 border-b border-slate-100 flex items-start justify-end pr-2 pt-1">
              <SkeletonPulse className="h-3 w-8" />
            </div>
          ))}
        </div>
        <div className="flex-1 grid" style={{ gridTemplateColumns: "repeat(5, 1fr)" }}>
          {Array.from({ length: days }).map((_, di) => (
            <div key={di} className="border-r border-slate-200 last:border-r-0">
              {Array.from({ length: slots }).map((_, si) => (
                <div key={si} className="h-16 border-b border-slate-100 p-1">
                  {(di * 3 + si) % 4 < 2 && (
                    <SkeletonPulse className="h-12 w-full rounded" />
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function SkeletonKanban() {
  const columns = [
    { label: "w-20", cards: 3 },
    { label: "w-24", cards: 4 },
    { label: "w-16", cards: 2 },
    { label: "w-20", cards: 3 },
  ];
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {columns.map((col, ci) => (
        <div key={ci} className="flex-shrink-0 w-64 bg-slate-50 rounded-lg border border-slate-200 p-3 space-y-2">
          <div className="flex items-center justify-between mb-3">
            <SkeletonPulse className={`h-4 ${col.label}`} />
            <SkeletonPulse className="h-5 w-7 rounded-full" />
          </div>
          {Array.from({ length: col.cards }).map((_, ki) => (
            <div key={ki} className="bg-white rounded border border-slate-200 p-3 space-y-2">
              <SkeletonPulse className="h-4 w-full" />
              <SkeletonPulse className="h-3 w-3/4" />
              <div className="flex gap-1.5 pt-1">
                <SkeletonPulse className="h-5 w-14 rounded-full" />
                <SkeletonPulse className="h-5 w-12 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonTabsForm({ tabs = 6, fields = 5 }: { tabs?: number; fields?: number } = {}) {
  return (
    <div className="space-y-6">
      <div className="flex gap-1 border-b border-slate-200">
        {Array.from({ length: tabs }).map((_, i) => (
          <SkeletonPulse key={i} className={`h-9 rounded-t-md ${i === 0 ? "w-28" : "w-24"}`} />
        ))}
      </div>
      <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-5">
        <SkeletonPulse className="h-5 w-40 mb-2" />
        {Array.from({ length: fields }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <SkeletonPulse className="h-4 w-28" />
            <SkeletonPulse className="h-10 w-full rounded-md" />
          </div>
        ))}
        <div className="flex gap-2 pt-2">
          <SkeletonPulse className="h-9 w-28 rounded-md" />
          <SkeletonPulse className="h-9 w-24 rounded-md" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonProfileCard() {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6 flex items-start gap-5 mb-6">
      <SkeletonPulse className="h-20 w-20 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <SkeletonPulse className="h-6 w-48" />
        <SkeletonPulse className="h-4 w-32" />
        <SkeletonPulse className="h-4 w-40" />
        <div className="flex gap-2 pt-2">
          <SkeletonPulse className="h-8 w-24 rounded-md" />
          <SkeletonPulse className="h-8 w-28 rounded-md" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonStaffCard() {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-3">
      <div className="flex items-center gap-3">
        <SkeletonPulse className="h-10 w-10 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-1.5">
          <SkeletonPulse className="h-4 w-32" />
          <SkeletonPulse className="h-3 w-24" />
        </div>
        <SkeletonPulse className="h-6 w-16 rounded-full" />
      </div>
      <SkeletonPulse className="h-px w-full" />
      <div className="space-y-1.5">
        <SkeletonPulse className="h-3 w-full" />
        <SkeletonPulse className="h-3 w-4/5" />
      </div>
      <div className="flex gap-2">
        <SkeletonPulse className="h-5 w-14 rounded-full" />
        <SkeletonPulse className="h-5 w-16 rounded-full" />
      </div>
    </div>
  );
}

export function SkeletonAutomationCard() {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-3">
      <div className="flex items-start justify-between">
        <div className="space-y-1.5 flex-1">
          <SkeletonPulse className="h-5 w-48" />
          <SkeletonPulse className="h-3 w-64" />
        </div>
        <SkeletonPulse className="h-6 w-12 rounded-full" />
      </div>
      <div className="flex gap-2">
        <SkeletonPulse className="h-6 w-20 rounded-full" />
        <SkeletonPulse className="h-6 w-24 rounded-full" />
      </div>
      <SkeletonPulse className="h-px w-full" />
      <div className="flex items-center justify-between">
        <SkeletonPulse className="h-3 w-32" />
        <SkeletonPulse className="h-3 w-20" />
      </div>
    </div>
  );
}
