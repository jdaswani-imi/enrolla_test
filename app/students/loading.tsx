import {
  SkeletonPageHeader,
  SkeletonStatsRow,
  SkeletonFilterBar,
  SkeletonTable,
} from "@/components/ui/skeleton-loader";

export default function StudentsLoading() {
  return (
    <div>
      <SkeletonPageHeader actions={3} />
      <SkeletonStatsRow />
      <SkeletonFilterBar filters={5} />
      <SkeletonTable rows={10} columns={7} />
    </div>
  );
}
