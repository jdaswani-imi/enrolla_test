import {
  SkeletonProfileCard,
  SkeletonTabsForm,
} from "@/components/ui/skeleton-loader";

export default function ProfileLoading() {
  return (
    <div>
      <SkeletonProfileCard />
      <SkeletonTabsForm tabs={4} fields={6} />
    </div>
  );
}
