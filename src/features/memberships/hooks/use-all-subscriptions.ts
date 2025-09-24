import { useQuery } from "@tanstack/react-query";
import { getAllSubscriptions } from "@/features/database/lib/subscription-db-utils";
import type {
  MemberSubscriptionWithSnapshot,
  SubscriptionStatus,
} from "@/features/database/lib/types";

interface UseAllSubscriptionsParams {
  search?: string;
  status?: SubscriptionStatus;
  page?: number;
  limit?: number;
}

interface AllSubscriptionsResponse {
  subscriptions: MemberSubscriptionWithSnapshot[];
  totalCount: number;
}

export function useAllSubscriptions(params: UseAllSubscriptionsParams = {}) {
  return useQuery({
    queryKey: ["all-subscriptions", params],
    queryFn: (): Promise<AllSubscriptionsResponse> =>
      getAllSubscriptions(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}
