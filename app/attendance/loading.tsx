import {
  SkeletonPageHeader,
  SkeletonStatsRow,
  SkeletonFilterBar,
  SkeletonTable,
  SkeletonPulse,
} from "@/components/ui/skeleton-loader";

export default function AttendanceLoading() {
  return (
    <div>
      <SkeletonPageHeader actions={3} />
      <SkeletonStatsRow />

      {/* View toggle */}
      <div className="flex gap-2 mb-4">
        <SkeletonPulse className="h-9 w-24 rounded-md" />
        <SkeletonPulse className="h-9 w-24 rounded-md" />
        <SkeletonPulse className="h-9 w-24 rounded-md" />
      </div>

      <SkeletonFilterBar filters={3} />
      <SkeletonTable rows={12} columns={7} />
    </div>
  );
}
