import {
  SkeletonPageHeader,
  SkeletonTabsForm,
} from "@/components/ui/skeleton-loader";

export default function SettingsLoading() {
  return (
    <div>
      <SkeletonPageHeader actions={0} />
      <SkeletonTabsForm />
    </div>
  );
}
