import {
  SkeletonKpi,
  SkeletonChart,
  SkeletonTable,
  SkeletonPageHeader,
  SkeletonFilterBar,
} from "@/components/ui/skeleton-loader";

export default function AnalyticsLoading() {
  return (
    <div>
      <SkeletonPageHeader actions={2} />
      <SkeletonFilterBar filters={3} />

      {/* KPI row */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonKpi key={i} />
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <SkeletonChart height={260} />
        <SkeletonChart height={260} />
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <SkeletonChart height={200} />
        <SkeletonChart height={200} />
        <SkeletonChart height={200} />
      </div>

      <SkeletonTable rows={7} columns={7} />
    </div>
  );
}
