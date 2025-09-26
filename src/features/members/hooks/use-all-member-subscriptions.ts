import { useQuery } from "@tanstack/react-query";
import { subscriptionKeys } from "@/features/memberships/hooks/use-subscriptions";
import { subscriptionUtils } from "@/features/memberships/lib/subscription-utils";
import type { MemberSubscriptionWithSnapshot } from "@/features/database/lib/types";

/**
 * Get all subscriptions for a member (active + history) combined
 */
export function useAllMemberSubscriptions(memberId: string) {
  return useQuery({
    queryKey: [...subscriptionKeys.memberSubscriptions(memberId), "all"],
    queryFn: async (): Promise<MemberSubscriptionWithSnapshot[]> => {
      if (!memberId) return [];

      const [activeSubscription, subscriptionHistory] = await Promise.all([
        subscriptionUtils.getMemberActiveSubscription(memberId),
        subscriptionUtils.getMemberSubscriptionHistory(memberId),
      ]);

      // Combine active and history, removing duplicates if active is also in history
      const allSubscriptions = [...(subscriptionHistory || [])];

      if (activeSubscription) {
        // Check if active subscription is already in history
        const activeInHistory = allSubscriptions.some(
          (sub) => sub.id === activeSubscription.id
        );

        if (!activeInHistory) {
          allSubscriptions.unshift(activeSubscription);
        }
      }

      // Sort by start_date (newest first) and then by status (active first)
      return allSubscriptions.sort((a, b) => {
        // First priority: status (active subscriptions first)
        if (a.status === "active" && b.status !== "active") return -1;
        if (b.status === "active" && a.status !== "active") return 1;

        // Second priority: start date (newest first)
        const dateA = new Date(a.start_date).getTime();
        const dateB = new Date(b.start_date).getTime();
        return dateB - dateA;
      });
    },
    enabled: !!memberId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}
