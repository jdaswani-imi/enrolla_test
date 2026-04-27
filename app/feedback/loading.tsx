import {
  SkeletonPageHeader,
  SkeletonFilterBar,
  SkeletonTable,
} from "@/components/ui/skeleton-loader";

export default function FeedbackLoading() {
  return (
    <div>
      <SkeletonPageHeader actions={2} />
      <SkeletonFilterBar filters={3} />
      <SkeletonTable rows={8} columns={6} />
    </div>
  );
}
