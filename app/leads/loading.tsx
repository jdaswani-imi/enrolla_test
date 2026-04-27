import {
  SkeletonPageHeader,
  SkeletonStatsRow,
  SkeletonFilterBar,
  SkeletonTable,
} from "@/components/ui/skeleton-loader";

export default function LeadsLoading() {
  return (
    <div>
      <SkeletonPageHeader actions={3} />
      <SkeletonStatsRow />
      <SkeletonFilterBar filters={5} />
      <SkeletonTable rows={10} columns={8} />
    </div>
  );
}
