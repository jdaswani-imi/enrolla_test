import {
  SkeletonPageHeader,
  SkeletonPulse,
  SkeletonTimetable,
} from "@/components/ui/skeleton-loader";

export default function TimetableLoading() {
  return (
    <div>
      <SkeletonPageHeader actions={3} />

      {/* Week navigation + view toggle */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <SkeletonPulse className="h-9 w-9 rounded-md" />
          <SkeletonPulse className="h-6 w-48" />
          <SkeletonPulse className="h-9 w-9 rounded-md" />
        </div>
        <div className="flex gap-2">
          <SkeletonPulse className="h-9 w-20 rounded-md" />
          <SkeletonPulse className="h-9 w-20 rounded-md" />
          <SkeletonPulse className="h-9 w-20 rounded-md" />
        </div>
      </div>

      <SkeletonTimetable />
    </div>
  );
}
