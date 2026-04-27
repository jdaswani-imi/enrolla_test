import {
  SkeletonKpi,
  SkeletonChart,
  SkeletonTable,
  SkeletonPageHeader,
  SkeletonFilterBar,
} from "@/components/ui/skeleton-loader";

export default function FinanceLoading() {
  return (
    <div>
      <SkeletonPageHeader actions={2} />

      {/* KPI row */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonKpi key={i} />
        ))}
      </div>

      {/* Chart + mini table */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="col-span-2">
          <SkeletonChart height={220} />
        </div>
        <SkeletonChart height={220} />
      </div>

      <SkeletonFilterBar filters={4} />
      <SkeletonTable rows={8} columns={8} />
    </div>
  );
}
