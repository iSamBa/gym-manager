import React from "react";
import Link from "next/link";
import {
  Edit,
  Loader2,
  Clock,
  User,
  Dumbbell,
  AlertTriangle,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { useTrainingSession } from "../../hooks/use-training-sessions";
import { useSessionAlerts } from "../../hooks/use-session-alerts";

interface SessionInfoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId?: string;
  onEditClick?: () => void;
}

export const SessionInfoDialog: React.FC<SessionInfoDialogProps> = ({
  open,
  onOpenChange,
  sessionId,
  onEditClick,
}) => {
  // Fetch session data
  const {
    data: session,
    isLoading: sessionLoading,
    error: sessionError,
  } = useTrainingSession(sessionId || "");

  // Fetch active alerts for this session
  const memberId = session?.participants?.[0]?.id;
  const { data: alerts = [] } = useSessionAlerts(
    session?.id,
    memberId,
    session?.scheduled_start
  );

  // Handle dialog close
  const handleClose = () => {
    onOpenChange(false);
  };

  // Loading state
  if (sessionLoading) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="w-[90vw] sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Loading Session</DialogTitle>
            <DialogDescription>
              Please wait while we load the session details.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="mr-2 h-6 w-6 animate-spin" />
            Loading session data...
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Error state
  if (sessionError || !session) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="w-[90vw] sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Error</DialogTitle>
          </DialogHeader>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Failed to load session data. Please try again.
            </AlertDescription>
          </Alert>
          <div className="mt-4 flex justify-end">
            <Button onClick={handleClose} variant="outline">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const memberName = session.participants?.[0]?.name || "Unknown Member";
  const hasAlerts = alerts.length > 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] w-[90vw] overflow-y-auto sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Session Information</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                handleClose();
                if (onEditClick) onEditClick();
              }}
              className="gap-2"
            >
              <Edit className="h-4 w-4" />
              Edit
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Member Information */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <User className="text-muted-foreground h-5 w-5" />
              <p className="font-semibold">{memberName}</p>
            </div>
            <Link href={`/members/${memberId}`}>
              <Badge
                variant="outline"
                className="hover:bg-accent cursor-pointer"
              >
                View Profile
              </Badge>
            </Link>
          </div>

          {/* Active Alerts Section */}
          {hasAlerts && (
            <>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                  <span className="text-muted-foreground text-sm font-medium">
                    Active Alerts ({alerts.length})
                  </span>
                </div>
                <div className="space-y-2">
                  {alerts.map((alert) => (
                    <Alert
                      key={alert.id}
                      className="border-orange-200 bg-orange-50"
                    >
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
          )}

          {/* Session Details */}
          <Separator />
          <div className="space-y-4">
            <h3 className="text-muted-foreground text-sm font-medium">
              Session Details
            </h3>

            {/* Session Status */}
            <div className="flex items-center justify-between">
              <span className="text-sm">Status</span>
              <Badge variant="outline" className="capitalize">
                {session.status.replace("_", " ")}
              </Badge>
            </div>

            {/* Machine */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Dumbbell className="text-muted-foreground h-4 w-4" />
                <span className="text-sm">Machine</span>
              </div>
              <span className="text-sm font-medium">
                {session.machine_name || "Not specified"}
              </span>
            </div>

            {/* Trainer */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="text-muted-foreground h-4 w-4" />
                <span className="text-sm">Trainer</span>
              </div>
              <span className="text-sm font-medium">
                {session.trainer_name || "No trainer assigned"}
              </span>
            </div>

            {/* Session Type */}
            <div className="flex items-center justify-between">
              <span className="text-sm">Session Type</span>
              <Badge variant="secondary" className="capitalize">
                {session.session_type === "trail"
                  ? "Trail Session"
                  : "Standard Session"}
              </Badge>
            </div>

            {/* Date */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="text-muted-foreground h-4 w-4" />
                <span className="text-sm">Date</span>
              </div>
              <span className="text-sm font-medium">
                {format(new Date(session.scheduled_start), "PPP")}
              </span>
            </div>

            {/* Start Time */}
            <div className="flex items-center justify-between">
              <span className="text-sm">Start Time</span>
              <span className="text-sm font-medium">
                {format(new Date(session.scheduled_start), "p")}
              </span>
            </div>

            {/* End Time */}
            <div className="flex items-center justify-between">
              <span className="text-sm">End Time</span>
              <span className="text-sm font-medium">
                {format(new Date(session.scheduled_end), "p")}
              </span>
            </div>

            {/* Notes */}
            {session.notes && (
              <>
                <Separator />
                <div className="space-y-2">
                  <span className="text-sm font-medium">Notes</span>
                  <p className="text-muted-foreground text-sm whitespace-pre-wrap">
                    {session.notes}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={handleClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SessionInfoDialog;
