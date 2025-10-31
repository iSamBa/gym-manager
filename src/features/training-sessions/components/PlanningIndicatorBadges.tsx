/**
 * Planning Indicator Badges
 * Displays planning indicator icons in colored badges (subscription, checkup, payment) with tooltips
 */

import { memo } from "react";
import { Hourglass, Scale, Coins } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { IndicatorFlags } from "../lib/planning-indicators";

interface PlanningIndicatorBadgesProps {
  indicators: IndicatorFlags;
}

export const PlanningIndicatorBadges = memo(function PlanningIndicatorBadges({
  indicators,
}: PlanningIndicatorBadgesProps) {
  const {
    showSubscriptionWarning,
    showBodyCheckupReminder,
    showPaymentReminder,
    subscriptionExpiryDate,
    subscriptionDaysRemaining,
    sessionsSinceCheckup,
    lastPaymentDate,
    daysSincePayment,
  } = indicators;

  // Don't render anything if no indicators
  if (
    !showSubscriptionWarning &&
    !showBodyCheckupReminder &&
    !showPaymentReminder
  ) {
    return null;
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex items-center gap-1">
        {/* Subscription Warning - Red badge with white icon */}
        {showSubscriptionWarning && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex h-5 w-5 items-center justify-center rounded-md bg-red-500 transition-transform hover:scale-110">
                <Hourglass className="h-3 w-3 text-white" />
              </div>
            </TooltipTrigger>
            <TooltipContent className="bg-slate-900 text-white dark:bg-slate-800">
              <p className="font-medium">
                Subscription expires on {subscriptionExpiryDate}
              </p>
              <p className="text-xs opacity-90">
                ({subscriptionDaysRemaining} day
                {subscriptionDaysRemaining !== 1 ? "s" : ""} remaining)
              </p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Body Checkup Reminder - Yellow badge with white icon */}
        {showBodyCheckupReminder && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex h-5 w-5 items-center justify-center rounded-md bg-yellow-500 transition-transform hover:scale-110">
                <Scale className="h-3 w-3 text-white" />
              </div>
            </TooltipTrigger>
            <TooltipContent className="bg-slate-900 text-white dark:bg-slate-800">
              <p className="font-medium">Body checkup due</p>
              <p className="text-xs opacity-90">
                ({sessionsSinceCheckup} session
                {sessionsSinceCheckup !== 1 ? "s" : ""} since last checkup)
              </p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Payment Reminder - Green badge with white icon */}
        {showPaymentReminder && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex h-5 w-5 items-center justify-center rounded-md bg-green-500 transition-transform hover:scale-110">
                <Coins className="h-3 w-3 text-white" />
              </div>
            </TooltipTrigger>
            <TooltipContent className="bg-slate-900 text-white dark:bg-slate-800">
              <p className="font-medium">Payment due</p>
              <p className="text-xs opacity-90">
                Last payment: {lastPaymentDate} ({daysSincePayment} day
                {daysSincePayment !== 1 ? "s" : ""} ago)
              </p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
});
