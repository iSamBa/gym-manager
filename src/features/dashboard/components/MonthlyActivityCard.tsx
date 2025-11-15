import { memo } from "react";
import { Users, UserPlus, UserX, RefreshCw, UserMinus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsCard } from "./stats-card";
import type { MonthlyActivityStats } from "../lib/types";

interface MonthlyActivityCardProps {
  data: MonthlyActivityStats;
  month: string;
}

export const MonthlyActivityCard = memo(function MonthlyActivityCard({
  data,
  month,
}: MonthlyActivityCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Activity - {month}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
          <StatsCard
            title="Trial Sessions"
            value={data.trial_sessions.toString()}
            description="New trial members this month"
            icon={Users}
          />
          <StatsCard
            title="Trial Conversions"
            value={data.trial_conversions.toString()}
            description="Trial members who subscribed"
            icon={UserPlus}
          />
          <StatsCard
            title="Subscriptions Expired"
            value={data.subscriptions_expired.toString()}
            description="Subscriptions that ended"
            icon={UserX}
          />
          <StatsCard
            title="Subscriptions Renewed"
            value={data.subscriptions_renewed.toString()}
            description="Members who renewed"
            icon={RefreshCw}
          />
          <StatsCard
            title="Subscriptions Cancelled"
            value={data.subscriptions_cancelled.toString()}
            description="Early cancellations"
            icon={UserMinus}
          />
        </div>
      </CardContent>
    </Card>
  );
});
