import { useMutation, useQueryClient } from "@tanstack/react-query";
import { subscriptionUtils } from "@/features/memberships/lib/subscription-utils";
import { notificationUtils } from "@/features/memberships/lib/notification-utils";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { TRAINING_SESSIONS_KEYS } from "./use-training-sessions";

interface SessionBookingInput {
  memberId: string;
  trainerId: string;
  sessionDate: string;
  sessionTime: string;
  sessionType:
    | "personal_training"
    | "small_group"
    | "consultation"
    | "assessment"
    | "trail"
    | "standard";
  notes?: string;
}

/**
 * Enhanced session booking that validates subscription credits
 */
export function useSessionBookingWithCredits() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SessionBookingInput) => {
      // Step 1: Check for active subscription
      const activeSubscription =
        await subscriptionUtils.getMemberActiveSubscription(input.memberId);

      if (!activeSubscription) {
        throw new Error(
          "No active subscription found. Please create a subscription first."
        );
      }

      // Step 2: Get subscription with details
      const subscription = await subscriptionUtils.getSubscriptionWithDetails(
        activeSubscription.id
      );

      // Step 3: Validate subscription status
      if (subscription.status !== "active") {
        throw new Error(
          `Cannot book session. Subscription is ${subscription.status}.`
        );
      }

      // Step 4: Check remaining sessions
      if ((subscription.remaining_sessions || 0) <= 0) {
        throw new Error(
          "No sessions remaining in current subscription. Please renew or upgrade."
        );
      }

      // Step 5: Check for outstanding payments
      const hasOutstandingBalance = (subscription.balance_due || 0) > 0;

      if (hasOutstandingBalance) {
        // Send notification but allow booking (as per requirements)
        await notificationUtils.sendPaymentAlert({
          memberId: input.memberId,
          trainerId: input.trainerId,
          subscriptionId: subscription.id,
          balance: subscription.balance_due || 0,
          sessionDate: input.sessionDate,
        });

        // Show warning toast
        toast.warning("Outstanding Balance", {
          description: `Member has outstanding balance of $${(subscription.balance_due || 0).toFixed(2)}. Admin/trainer notified.`,
          duration: 8000,
        });
      }

      // Step 6: Create the training session booking
      const booking = await createTrainingSessionBooking({
        member_id: input.memberId,
        trainer_id: input.trainerId,
        session_date: input.sessionDate,
        session_time: input.sessionTime,
        session_type: input.sessionType,
        subscription_id: subscription.id,
        notes: input.notes,
      });

      // Step 7: Consume session credit
      await subscriptionUtils.consumeSession(subscription.id);

      // Step 8: Check for low sessions warning
      const remainingAfterBooking = (subscription.remaining_sessions || 0) - 1;
      if (remainingAfterBooking <= 2 && remainingAfterBooking > 0) {
        toast.warning("Low Sessions Remaining", {
          description: `Only ${remainingAfterBooking} session(s) remaining. Consider renewing soon.`,
          action: {
            label: "Renew",
            onClick: () => {
              // Navigate to renewal flow
              window.location.href = `/members/${input.memberId}/subscriptions/new`;
            },
          },
        });
      }

      // Step 9: Handle subscription completion
      if (remainingAfterBooking === 0) {
        toast.info("Subscription Completed", {
          description:
            "All sessions have been used. Please create a new subscription.",
          action: {
            label: "New Subscription",
            onClick: () => {
              window.location.href = `/members/${input.memberId}/subscriptions/new`;
            },
          },
        });
      }

      return booking;
    },

    onSuccess: (data, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({
        queryKey: TRAINING_SESSIONS_KEYS.all,
      });
      queryClient.invalidateQueries({
        queryKey: ["subscriptions", "member", variables.memberId],
      });

      toast.success("Session Booked", {
        description:
          "Training session has been successfully booked and session credit consumed.",
      });
    },

    onError: (error) => {
      toast.error("Booking Failed", {
        description:
          error instanceof Error ? error.message : "Failed to book session",
        duration: 8000,
      });
    },
  });
}

// Helper function to create training session booking
async function createTrainingSessionBooking(data: {
  member_id: string;
  trainer_id: string;
  session_date: string;
  session_time: string;
  session_type: string;
  subscription_id: string;
  notes?: string;
}) {
  // Create the session using the existing RPC function
  const { data: result, error } = await supabase.rpc(
    "create_training_session_with_members",
    {
      p_trainer_id: data.trainer_id,
      p_scheduled_start: `${data.session_date}T${data.session_time}:00`,
      p_scheduled_end: `${data.session_date}T${data.session_time}:00`, // This should be calculated properly
      p_location: "TBD", // This should be passed in
      p_max_participants: 1,
      p_member_ids: [data.member_id],
      p_notes: data.notes || null,
      p_session_type: data.session_type,
    }
  );

  if (error) {
    console.error("Failed to create training session:", error);
    throw new Error(`Failed to create training session: ${error.message}`);
  }

  return result;
}
