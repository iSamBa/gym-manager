"use client";

import { memo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard } from "lucide-react";
import type { MemberWithSubscription } from "@/features/database/lib/types";

interface SubscriptionStatusCardProps {
  member: MemberWithSubscription;
}

export const SubscriptionStatusCard = memo(function SubscriptionStatusCard({
  member,
}: SubscriptionStatusCardProps) {
  const formatDate = useCallback((date: Date): string => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <CreditCard className="h-4 w-4" />
          Subscription Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        {member.subscription ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Plan</span>
              <span className="text-sm">
                {member.subscription.plan?.name || "Unknown Plan"}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status</span>
              <span
                className={
                  member.subscription.status === "active"
                    ? "text-green-600"
                    : "text-gray-600"
                }
              >
                {member.subscription.status}
              </span>
            </div>

            <div className="border-t pt-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Start Date</span>
                  <span>
                    {formatDate(new Date(member.subscription.start_date))}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">End Date</span>
                  <span>
                    {member.subscription.end_date
                      ? formatDate(new Date(member.subscription.end_date))
                      : "No end date"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">
            No active subscription
          </p>
        )}
      </CardContent>
    </Card>
  );
});
