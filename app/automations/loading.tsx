import {
  SkeletonPageHeader,
  SkeletonFilterBar,
  SkeletonAutomationCard,
} from "@/components/ui/skeleton-loader";

export default function AutomationsLoading() {
  return (
    <div>
      <SkeletonPageHeader actions={2} />
      <SkeletonFilterBar filters={2} />

      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonAutomationCard key={i} />
        ))}
      </div>
    </div>
  );
}
