/**
 * Planning Indicator Icons
 * Displays planning indicator icons (subscription, body checkup, payment) with tooltips
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

interface PlanningIndicatorIconsProps {
  indicators: IndicatorFlags;
}

export const PlanningIndicatorIcons = memo(function PlanningIndicatorIcons({
  indicators,
}: PlanningIndicatorIconsProps) {
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
        {/* Subscription Warning */}
        {showSubscriptionWarning && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="cursor-help transition-transform hover:scale-110">
                <Hourglass className="h-4 w-4 text-red-500" />
              </div>
            </TooltipTrigger>
            <TooltipContent>
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

        {/* Body Checkup Reminder */}
        {showBodyCheckupReminder && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="cursor-help transition-transform hover:scale-110">
                <Scale className="h-4 w-4 text-yellow-500" />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-medium">Body checkup due</p>
              <p className="text-xs opacity-90">
                ({sessionsSinceCheckup} session
                {sessionsSinceCheckup !== 1 ? "s" : ""} since last checkup)
              </p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Payment Reminder */}
        {showPaymentReminder && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="cursor-help transition-transform hover:scale-110">
                <Coins className="h-4 w-4 text-green-500" />
              </div>
            </TooltipTrigger>
            <TooltipContent>
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
