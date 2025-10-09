"use client";

import { memo, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity } from "lucide-react";
import { useMemberActivityMetrics } from "@/features/members/hooks";
import type { Member } from "@/features/database/lib/types";

interface EnhancedActivityCardProps {
  member: Member;
}

export const EnhancedActivityCard = memo(function EnhancedActivityCard({
  member,
}: EnhancedActivityCardProps) {
  const { data: metrics } = useMemberActivityMetrics(member.id);

  const formatDate = useMemo(
    () =>
      (date: Date): string => {
        return date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
      },
    []
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="h-4 w-4" />
          Activity Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Member Since */}
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Member Since</span>
          <span>{formatDate(new Date(member.join_date))}</span>
        </div>

        {/* Account Created */}
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Account Created</span>
          <span>{formatDate(new Date(member.created_at))}</span>
        </div>

        {/* Sessions This Month */}
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Sessions This Month</span>
          <span className="font-medium">
            {metrics?.sessionsThisMonth ?? "—"}
          </span>
        </div>

        {/* Last Session */}
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Last Session</span>
          <span>
            {metrics?.lastSessionDate
              ? formatDate(metrics.lastSessionDate)
              : "No sessions yet"}
          </span>
        </div>
      </CardContent>
    </Card>
  );
});
