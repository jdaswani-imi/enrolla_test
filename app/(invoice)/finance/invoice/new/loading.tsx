import { SkeletonPulse } from "@/components/ui/skeleton-loader";

export default function InvoiceLoading() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-slate-200">
        <div className="flex items-center gap-3">
          <SkeletonPulse className="h-9 w-9 rounded-md" />
          <SkeletonPulse className="h-5 w-40" />
        </div>
        <div className="flex gap-2">
          <SkeletonPulse className="h-9 w-24 rounded-md" />
          <SkeletonPulse className="h-9 w-28 rounded-md" />
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Editor panel */}
        <div className="flex-1 p-6 space-y-5 overflow-y-auto">
          {/* Header section */}
          <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-4">
            <div className="flex justify-between">
              <SkeletonPulse className="h-6 w-32" />
              <SkeletonPulse className="h-4 w-24" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <SkeletonPulse className="h-4 w-24" />
                  <SkeletonPulse className="h-10 w-full rounded-md" />
                </div>
              ))}
            </div>
          </div>

          {/* Line items */}
          <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-3">
            <SkeletonPulse className="h-5 w-28" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="grid grid-cols-5 gap-3">
                <SkeletonPulse className="col-span-2 h-10 rounded-md" />
                <SkeletonPulse className="h-10 rounded-md" />
                <SkeletonPulse className="h-10 rounded-md" />
                <SkeletonPulse className="h-10 rounded-md" />
              </div>
            ))}
            <SkeletonPulse className="h-9 w-36 rounded-md mt-2" />
          </div>

          {/* Totals */}
          <div className="bg-white rounded-lg border border-slate-200 p-5">
            <div className="flex justify-end">
              <div className="w-64 space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex justify-between">
                    <SkeletonPulse className="h-4 w-20" />
                    <SkeletonPulse className="h-4 w-16" />
                  </div>
                ))}
                <SkeletonPulse className="h-px w-full" />
                <div className="flex justify-between">
                  <SkeletonPulse className="h-5 w-16" />
                  <SkeletonPulse className="h-5 w-20" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Preview panel */}
        <div className="w-[420px] flex-shrink-0 border-l border-slate-200 bg-slate-50 p-6">
          <SkeletonPulse className="h-5 w-24 mb-4" />
          <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-4">
            <SkeletonPulse className="h-8 w-32" />
            <SkeletonPulse className="h-px w-full" />
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonPulse key={i} className={`h-4 ${i % 3 === 0 ? "w-full" : i % 3 === 1 ? "w-3/4" : "w-1/2"}`} />
            ))}
            <SkeletonPulse className="h-px w-full" />
            <SkeletonPulse className="h-6 w-28 ml-auto" />
          </div>
        </div>
      </div>
    </div>
  );
}
