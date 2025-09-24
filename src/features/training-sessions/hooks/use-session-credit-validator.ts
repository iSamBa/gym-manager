import { useQuery } from "@tanstack/react-query";
import { subscriptionUtils } from "@/features/memberships/lib/subscription-utils";
import type { MemberSubscriptionWithSnapshot } from "@/features/database/lib/types";

interface SessionCreditValidation {
  canBook: boolean;
  subscription: MemberSubscriptionWithSnapshot | null;
  warnings: string[];
  errors: string[];
  remainingSessions: number;
  hasOutstandingBalance: boolean;
  balanceAmount: number;
}

/**
 * Validates if a member can book a session based on their subscription credits
 */
export function useSessionCreditValidator(memberId: string) {
  return useQuery({
    queryKey: ["session-credit-validation", memberId],
    queryFn: async (): Promise<SessionCreditValidation> => {
      if (!memberId) {
        return {
          canBook: false,
          subscription: null,
          warnings: [],
          errors: ["No member selected"],
          remainingSessions: 0,
          hasOutstandingBalance: false,
          balanceAmount: 0,
        };
      }

      try {
        // Get active subscription
        const activeSubscription =
          await subscriptionUtils.getMemberActiveSubscription(memberId);

        if (!activeSubscription) {
          return {
            canBook: false,
            subscription: null,
            warnings: [],
            errors: ["No active subscription found"],
            remainingSessions: 0,
            hasOutstandingBalance: false,
            balanceAmount: 0,
          };
        }

        // Get subscription with computed details
        const subscription = await subscriptionUtils.getSubscriptionWithDetails(
          activeSubscription.id
        );

        const warnings: string[] = [];
        const errors: string[] = [];

        // Check subscription status
        if (subscription.status !== "active") {
          errors.push(`Subscription is ${subscription.status}`);
        }

        // Check remaining sessions
        const remainingSessions = subscription.remaining_sessions || 0;
        if (remainingSessions <= 0) {
          errors.push("No sessions remaining in subscription");
        } else if (remainingSessions <= 2) {
          warnings.push(
            `Only ${remainingSessions} session(s) remaining. Consider renewing soon.`
          );
        }

        // Check outstanding balance
        const balanceAmount = subscription.balance_due || 0;
        const hasOutstandingBalance = balanceAmount > 0;
        if (hasOutstandingBalance) {
          warnings.push(
            `Outstanding balance: $${balanceAmount.toFixed(2)}. Admin/trainer will be notified.`
          );
        }

        // Check expiry date
        if (
          subscription.days_remaining !== undefined &&
          subscription.days_remaining <= 7
        ) {
          if (subscription.days_remaining <= 0) {
            errors.push("Subscription has expired");
          } else {
            warnings.push(
              `Subscription expires in ${subscription.days_remaining} day(s)`
            );
          }
        }

        const canBook = errors.length === 0;

        return {
          canBook,
          subscription,
          warnings,
          errors,
          remainingSessions,
          hasOutstandingBalance,
          balanceAmount,
        };
      } catch (error) {
        return {
          canBook: false,
          subscription: null,
          warnings: [],
          errors: [
            error instanceof Error
              ? error.message
              : "Failed to validate session credits",
          ],
          remainingSessions: 0,
          hasOutstandingBalance: false,
          balanceAmount: 0,
        };
      }
    },
    enabled: !!memberId,
    staleTime: 30 * 1000, // 30 seconds - real-time validation
  });
}
