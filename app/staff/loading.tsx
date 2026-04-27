import {
  SkeletonPageHeader,
  SkeletonFilterBar,
  SkeletonStaffCard,
  SkeletonTable,
} from "@/components/ui/skeleton-loader";

export default function StaffLoading() {
  return (
    <div>
      <SkeletonPageHeader actions={2} />
      <SkeletonFilterBar filters={3} />

      {/* Staff card grid */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonStaffCard key={i} />
        ))}
      </div>

      <SkeletonTable rows={6} columns={6} />
    </div>
  );
}
