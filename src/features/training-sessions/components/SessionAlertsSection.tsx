import { memo } from "react";
import { AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { MemberComment } from "@/features/database/lib/types";

/**
 * Props for the SessionAlertsSection component
 */
export interface SessionAlertsSectionProps {
  /** Array of member comment alerts to display */
  alerts: MemberComment[];
}

/**
 * Displays member alerts/comments with due dates
 *
 * Shows a list of active alerts with:
 * - Alert count in header
 * - Author and due date for each alert
 * - Alert body text
 * - Scrollable if many alerts
 *
 * Returns null if no alerts are present
 *
 * @param props - Alert data
 * @returns Alert section or null
 */
export const SessionAlertsSection = memo(function SessionAlertsSection({
  alerts,
}: SessionAlertsSectionProps) {
  if (!alerts || alerts.length === 0) {
    return null;
  }

  return (
    <>
      <Separator />
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-orange-500" />
          <span className="text-muted-foreground text-sm font-medium">
            Active Alerts ({alerts.length})
          </span>
        </div>
        <div className="max-h-40 space-y-2 overflow-y-auto">
          {alerts.map((alert) => (
            <Alert key={alert.id} className="border-orange-200 bg-orange-50">
              <div className="col-start-2 space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-orange-900">
                    {alert.author}
                  </p>
                  {alert.due_date && (
                    <Badge
                      variant="outline"
                      className="shrink-0 text-xs text-orange-700"
                    >
                      Due: {format(new Date(alert.due_date), "PPP")}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-orange-800">{alert.body}</p>
              </div>
            </Alert>
          ))}
        </div>
      </div>
    </>
  );
});
