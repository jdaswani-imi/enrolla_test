import {
  SkeletonPageHeader,
  SkeletonFilterBar,
  SkeletonTable,
} from "@/components/ui/skeleton-loader";

export default function CommunicationsLoading() {
  return (
    <div>
      <SkeletonPageHeader actions={2} />
      <SkeletonFilterBar filters={4} />
      <SkeletonTable rows={8} columns={6} />
    </div>
  );
}
