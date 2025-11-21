import { TableSkeleton } from "@/components/feedback/skeletons";

export default function PaymentsLoading() {
  return <TableSkeleton hasStats hasFilters rowCount={10} />;
}
