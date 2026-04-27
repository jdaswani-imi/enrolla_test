import {
  SkeletonKpi,
  SkeletonChart,
  SkeletonTable,
  SkeletonPageHeader,
} from "@/components/ui/skeleton-loader";

export default function DashboardLoading() {
  return (
    <div>
      <SkeletonPageHeader actions={1} />

      {/* KPI grid */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonKpi key={i} />
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="col-span-2">
          <SkeletonChart height={240} />
        </div>
        <SkeletonChart height={240} />
      </div>

      {/* Table */}
      <SkeletonTable rows={6} columns={6} />
    </div>
  );
}
