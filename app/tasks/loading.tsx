import {
  SkeletonPageHeader,
  SkeletonFilterBar,
  SkeletonPulse,
  SkeletonKanban,
} from "@/components/ui/skeleton-loader";

export default function TasksLoading() {
  return (
    <div>
      <SkeletonPageHeader actions={2} />

      {/* View toggle */}
      <div className="flex items-center gap-2 mb-4">
        <SkeletonPulse className="h-9 w-20 rounded-md" />
        <SkeletonPulse className="h-9 w-20 rounded-md" />
        <SkeletonPulse className="h-9 w-20 rounded-md" />
      </div>

      <SkeletonFilterBar filters={4} />
      <SkeletonKanban />
    </div>
  );
}
