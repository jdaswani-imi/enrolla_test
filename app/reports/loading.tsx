import {
  SkeletonPageHeader,
  SkeletonFilterBar,
  SkeletonCard,
  SkeletonTable,
} from "@/components/ui/skeleton-loader";

export default function ReportsLoading() {
  return (
    <div>
      <SkeletonPageHeader actions={2} />
      <SkeletonFilterBar filters={3} />

      {/* Report cards grid */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>

      <SkeletonTable rows={6} columns={5} />
    </div>
  );
}
