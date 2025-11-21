import { TableSkeleton } from "@/components/feedback/skeletons";

export default function TrainingSessionsLoading() {
  return <TableSkeleton hasStats hasFilters rowCount={10} />;
}
