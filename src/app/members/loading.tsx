import { TableSkeleton } from "@/components/feedback/skeletons";

export default function MembersLoading() {
  return <TableSkeleton hasStats hasFilters rowCount={10} />;
}
