/**
 * Planning Indicators Calculation Utility
 * Determines which planning indicator icons to show for a training session
 */

import { daysBetween } from "@/lib/date-utils";
import type { PlanningSettings } from "@/features/settings/lib/types";

export interface PlanningIndicatorData {
  subscriptionEndDate?: string | null;
  latestPaymentDate?: string | null;
  latestCheckupDate?: string | null;
  sessionsSinceCheckup?: number | null;
}

export interface IndicatorFlags {
  showSubscriptionWarning: boolean;
  showBodyCheckupReminder: boolean;
  showPaymentReminder: boolean;
  subscriptionExpiryDate?: string;
  subscriptionDaysRemaining?: number;
  sessionsSinceCheckup?: number;
  lastPaymentDate?: string;
  daysSincePayment?: number;
}

/**
 * Calculate which planning indicators should be shown for a session
 */
export function calculatePlanningIndicators(
  planningData: PlanningIndicatorData,
  sessionDate: string,
  settings: PlanningSettings
): IndicatorFlags {
  const flags: IndicatorFlags = {
    showSubscriptionWarning: false,
    showBodyCheckupReminder: false,
    showPaymentReminder: false,
  };

  // 1. Subscription Warning
  if (planningData.subscriptionEndDate) {
    const daysUntilExpiry = daysBetween(
      sessionDate,
      planningData.subscriptionEndDate
    );

    if (
      daysUntilExpiry >= 0 &&
      daysUntilExpiry <= settings.subscription_warning_days
    ) {
      flags.showSubscriptionWarning = true;
      flags.subscriptionDaysRemaining = daysUntilExpiry;
      flags.subscriptionExpiryDate = planningData.subscriptionEndDate;
    }
  }

  // 2. Body Checkup Reminder
  const sessions = planningData.sessionsSinceCheckup ?? 0;
  if (sessions >= settings.body_checkup_sessions) {
    flags.showBodyCheckupReminder = true;
    flags.sessionsSinceCheckup = sessions;
  }

  // 3. Payment Reminder
  if (planningData.latestPaymentDate) {
    const daysSince = daysBetween(planningData.latestPaymentDate, sessionDate);

    if (daysSince >= settings.payment_reminder_days) {
      flags.showPaymentReminder = true;
      flags.daysSincePayment = daysSince;
      flags.lastPaymentDate = planningData.latestPaymentDate;
    }
  }

  return flags;
}
