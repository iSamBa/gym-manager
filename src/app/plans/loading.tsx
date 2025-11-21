import { CardSkeleton } from "@/components/feedback/skeletons";

export default function PlansLoading() {
  return <CardSkeleton count={6} columns={3} />;
}
