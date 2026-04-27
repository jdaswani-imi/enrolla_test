import {
  SkeletonPageHeader,
  SkeletonFilterBar,
  SkeletonCard,
  SkeletonTable,
} from "@/components/ui/skeleton-loader";

export default function PeopleLoading() {
  return (
    <div>
      <SkeletonPageHeader actions={2} />
      <SkeletonFilterBar filters={3} />

      {/* Segment cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>

      <SkeletonTable rows={8} columns={6} />
    </div>
  );
}
