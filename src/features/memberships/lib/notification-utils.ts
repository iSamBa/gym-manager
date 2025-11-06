import { supabase } from "@/lib/supabase";
import type { MemberSubscriptionWithSnapshot } from "@/features/database/lib/types";
import {
  formatForDatabase,
  formatTimestampForDatabase,
} from "@/lib/date-utils";
import { logger } from "@/lib/logger";

export interface PaymentAlertInput {
  memberId: string;
  trainerId: string;
  subscriptionId: string;
  balance: number;
  sessionDate: string;
}

export interface RenewalReminderInput {
  memberId: string;
  subscriptionId: string;
  remainingSessions: number;
  daysUntilExpiry: number;
}

export interface ExpiryAlertInput {
  memberId: string;
  subscriptionId: string;
  expiryDate: string;
}

export const notificationUtils = {
  /**
   * Send payment alert to admin/trainer when member books with outstanding balance
   */
  async sendPaymentAlert(input: PaymentAlertInput) {
    // Create notification record
    const notification = {
      type: "payment_alert",
      member_id: input.memberId,
      trainer_id: input.trainerId,
      subscription_id: input.subscriptionId,
      title: "Outstanding Balance Alert",
      message: `Member has an outstanding balance of $${input.balance.toFixed(2)} for session on ${input.sessionDate}`,
      metadata: {
        balance: input.balance,
        sessionDate: input.sessionDate,
        severity: "warning",
      },
      created_at: formatTimestampForDatabase(new Date()),
    };

    const { error } = await supabase.from("notifications").insert(notification);

    if (error) {
      logger.error("Failed to create payment alert:", { error });
    }

    // Send real-time notification to trainer
    await this.sendRealtimeNotification(input.trainerId, {
      type: "payment_alert",
      title: "Outstanding Balance",
      message: `Member booking session has outstanding balance: $${input.balance.toFixed(2)}`,
      priority: "medium",
    });
  },

  /**
   * Check for low sessions and send renewal reminders
   */
  async checkLowSessions(subscription: MemberSubscriptionWithSnapshot) {
    const remainingSessions = subscription.remaining_sessions || 0;

    // Server-side notification for tracking
    if (remainingSessions <= 2) {
      await this.createRenewalReminder({
        memberId: subscription.member_id,
        subscriptionId: subscription.id,
        remainingSessions,
        daysUntilExpiry: subscription.days_remaining || 0,
      });
    }
  },

  /**
   * Create renewal reminder notification
   */
  async createRenewalReminder(input: RenewalReminderInput) {
    const { error } = await supabase.from("notifications").insert({
      type: "renewal_reminder",
      member_id: input.memberId,
      subscription_id: input.subscriptionId,
      title: "Subscription Renewal Reminder",
      message: `${input.remainingSessions} session(s) remaining. Consider renewing soon.`,
      metadata: {
        remainingSessions: input.remainingSessions,
        daysUntilExpiry: input.daysUntilExpiry,
        severity: input.remainingSessions === 0 ? "high" : "medium",
      },
      created_at: formatTimestampForDatabase(new Date()),
    });

    if (error) {
      logger.error("Failed to create renewal reminder:", { error });
    }
  },

  /**
   * Check for expiring subscriptions and send alerts
   */
  async checkExpiryDates() {
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const { data: expiringSubscriptions, error } = await supabase
      .from("member_subscriptions")
      .select(
        `
        *,
        members!inner(first_name, last_name, email)
      `
      )
      .eq("status", "active")
      .lte("end_date", formatForDatabase(sevenDaysFromNow))
      .gt("end_date", formatForDatabase(new Date()));

    if (error) {
      logger.error("Failed to fetch expiring subscriptions:", { error });
      return;
    }

    for (const subscription of expiringSubscriptions) {
      await this.createExpiryAlert({
        memberId: subscription.member_id,
        subscriptionId: subscription.id,
        expiryDate: subscription.end_date,
      });
    }
  },

  /**
   * Create expiry alert notification
   */
  async createExpiryAlert(input: ExpiryAlertInput) {
    const daysRemaining = Math.ceil(
      (new Date(input.expiryDate).getTime() - Date.now()) /
        (1000 * 60 * 60 * 24)
    );

    const { error } = await supabase.from("notifications").insert({
      type: "expiry_alert",
      member_id: input.memberId,
      subscription_id: input.subscriptionId,
      title: "Subscription Expiring Soon",
      message: `Subscription expires in ${daysRemaining} day(s) on ${new Date(input.expiryDate).toLocaleDateString()}`,
      metadata: {
        expiryDate: input.expiryDate,
        daysRemaining,
        severity: daysRemaining <= 3 ? "high" : "medium",
      },
      created_at: formatTimestampForDatabase(new Date()),
    });

    if (error) {
      logger.error("Failed to create expiry alert:", { error });
    }
  },

  /**
   * Send real-time notification via Supabase realtime
   */
  async sendRealtimeNotification(
    userId: string,
    notification: {
      type: string;
      title: string;
      message: string;
      priority: "low" | "medium" | "high";
    }
  ) {
    const { error } = await supabase.from("realtime_notifications").insert({
      user_id: userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      priority: notification.priority,
      read: false,
      created_at: formatTimestampForDatabase(new Date()),
    });

    if (error) {
      logger.error("Failed to send realtime notification:", { error });
    }
  },

  /**
   * Get payment statistics for notifications
   */
  async getPaymentStatistics() {
    const { data: outstandingBalances, error } = await supabase
      .from("member_subscriptions")
      .select(
        `
        id,
        member_id,
        total_amount_snapshot,
        paid_amount,
        members!inner(first_name, last_name)
      `
      )
      .eq("status", "active")
      .gt("total_amount_snapshot", "paid_amount");

    if (error) {
      logger.error("Failed to fetch payment statistics:", { error });
      return null;
    }

    const totalOutstanding = outstandingBalances.reduce(
      (sum, sub) => sum + (sub.total_amount_snapshot - sub.paid_amount),
      0
    );

    return {
      membersWithOutstandingBalance: outstandingBalances.length,
      totalOutstandingAmount: totalOutstanding,
      outstandingBalances: outstandingBalances.map((sub) => ({
        memberId: sub.member_id,
        memberName: `${sub.members[0]?.first_name || ""} ${sub.members[0]?.last_name || ""}`,
        balance: sub.total_amount_snapshot - sub.paid_amount,
      })),
    };
  },

  /**
   * Get session usage statistics
   */
  async getSessionStatistics() {
    const { data: subscriptions, error } = await supabase
      .from("member_subscriptions")
      .select("total_sessions_snapshot, used_sessions")
      .eq("status", "active");

    if (error) {
      logger.error("Failed to fetch session statistics:", { error });
      return null;
    }

    const totalSessions = subscriptions.reduce(
      (sum, sub) => sum + sub.total_sessions_snapshot,
      0
    );
    const usedSessions = subscriptions.reduce(
      (sum, sub) => sum + sub.used_sessions,
      0
    );
    const utilizationRate =
      totalSessions > 0 ? (usedSessions / totalSessions) * 100 : 0;

    const lowSessionSubscriptions = subscriptions.filter(
      (sub) => sub.total_sessions_snapshot - sub.used_sessions <= 2
    );

    return {
      totalSessions,
      usedSessions,
      remainingSessions: totalSessions - usedSessions,
      utilizationRate,
      subscriptionsWithLowSessions: lowSessionSubscriptions.length,
    };
  },
};
