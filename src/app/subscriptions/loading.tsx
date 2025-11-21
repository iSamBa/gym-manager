import { TableSkeleton } from "@/components/feedback/skeletons";

export default function SubscriptionsLoading() {
  return <TableSkeleton hasStats hasFilters rowCount={10} />;
}
