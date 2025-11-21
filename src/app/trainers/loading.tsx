import { TableSkeleton } from "@/components/feedback/skeletons";

export default function TrainersLoading() {
  return <TableSkeleton hasStats hasFilters rowCount={10} />;
}
