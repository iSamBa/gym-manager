import { TableSkeleton } from "@/components/feedback/skeletons";

export default function EquipmentLoading() {
  return <TableSkeleton hasStats hasFilters rowCount={10} />;
}
