import {
  SkeletonPageHeader,
  SkeletonFilterBar,
  SkeletonChart,
  SkeletonTable,
} from "@/components/ui/skeleton-loader";

export default function ProgressLoading() {
  return (
    <div>
      <SkeletonPageHeader actions={2} />
      <SkeletonFilterBar filters={3} />

      <div className="grid grid-cols-2 gap-4 mb-6">
        <SkeletonChart height={220} />
        <SkeletonChart height={220} />
      </div>

      <SkeletonTable rows={8} columns={7} />
    </div>
  );
}
