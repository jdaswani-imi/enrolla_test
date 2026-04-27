import {
  SkeletonPageHeader,
  SkeletonStatsRow,
  SkeletonFilterBar,
  SkeletonTable,
} from "@/components/ui/skeleton-loader";

export default function EnrolmentLoading() {
  return (
    <div>
      <SkeletonPageHeader actions={2} />
      <SkeletonStatsRow />
      <SkeletonFilterBar filters={4} />
      <SkeletonTable rows={10} columns={7} />
    </div>
  );
}
