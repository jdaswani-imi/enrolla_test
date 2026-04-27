import {
  SkeletonPageHeader,
  SkeletonFilterBar,
  SkeletonTable,
} from "@/components/ui/skeleton-loader";

export default function GuardiansLoading() {
  return (
    <div>
      <SkeletonPageHeader actions={2} />
      <SkeletonFilterBar filters={3} />
      <SkeletonTable rows={10} columns={6} />
    </div>
  );
}
