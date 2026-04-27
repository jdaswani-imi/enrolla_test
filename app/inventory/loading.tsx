import {
  SkeletonPageHeader,
  SkeletonStatsRow,
  SkeletonFilterBar,
  SkeletonTable,
} from "@/components/ui/skeleton-loader";

export default function InventoryLoading() {
  return (
    <div>
      <SkeletonPageHeader actions={2} />
      <SkeletonStatsRow />
      <SkeletonFilterBar filters={3} />
      <SkeletonTable rows={10} columns={7} />
    </div>
  );
}
