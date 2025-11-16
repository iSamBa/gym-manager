import React, { useCallback } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQueryClient } from "@tanstack/react-query";
import {
  useTrainingSession,
  useMemberDialogData,
} from "../../hooks/use-training-sessions";
import { useSessionAlerts } from "../../hooks/use-session-alerts";
import { SessionInfoTab } from "./SessionInfoTab";
import { MemberDetailsTab } from "./MemberDetailsTab";
import { TRAINING_SESSIONS_KEYS } from "../../hooks/use-training-sessions";
import { memberKeys } from "@/features/members/hooks/use-members";

/**
 * Props for SessionDialog component
 */
interface SessionDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback to change open state */
  onOpenChange: (open: boolean) => void;
  /** ID of the session to display */
  sessionId?: string;
  /** Callback when session is updated */
  onSessionUpdated?: (sessionId: string) => void;
  /** Callback when session is deleted */
  onSessionDeleted?: (sessionId: string) => void;
}

/**
 * Training Session Dialog with two-tab interface
 *
 * Tab 1: Session Info - Session details with Edit/Save/Cancel pattern
 * Tab 2: Member Details - Member information with Edit/Save/Cancel pattern
 *
 * Features:
 * - Independent edit modes for each tab
 * - Session alerts displayed in both tabs
 * - Session statistics and financial info (read-only)
 * - Responsive width: 95vw mobile, 900px desktop
 *
 * @param props - Dialog state and callbacks
 */
export const SessionDialog: React.FC<SessionDialogProps> = ({
  open,
  onOpenChange,
  sessionId,
  onSessionUpdated,
  onSessionDeleted,
}) => {
  const queryClient = useQueryClient();

  // Fetch session data
  const {
    data: session,
    isLoading: sessionLoading,
    error: sessionError,
  } = useTrainingSession(sessionId || "");

  // Extract member ID from session
  // Use member_id from planning indicators (RPC), fallback to participant id
  const memberId = session?.member_id || session?.participants?.[0]?.id;

  // Fetch session alerts
  const { data: alerts = [] } = useSessionAlerts(
    session?.id,
    memberId,
    session?.scheduled_start
  );

  // Fetch member dialog data (for Member Details tab)
  const memberDialogData = useMemberDialogData(memberId);

  // Handle session updated
  const handleSessionUpdated = useCallback(
    (id: string) => {
      if (onSessionUpdated) {
        onSessionUpdated(id);
      }
      // Invalidate session queries to refresh data
      queryClient.invalidateQueries({
        queryKey: TRAINING_SESSIONS_KEYS.all,
      });
    },
    [onSessionUpdated, queryClient]
  );

  // Handle session deleted
  const handleSessionDeleted = useCallback(
    (id: string) => {
      onOpenChange(false);
      if (onSessionDeleted) {
        onSessionDeleted(id);
      }
    },
    [onOpenChange, onSessionDeleted]
  );

  // Handle member updated
  const handleMemberUpdated = useCallback(() => {
    if (memberId) {
      queryClient.invalidateQueries({
        queryKey: memberKeys.detail(memberId),
      });
      queryClient.invalidateQueries({
        queryKey: ["member-dialog-data", memberId],
      });
    }
  }, [memberId, queryClient]);

  // Loading state
  if (sessionLoading || memberDialogData.isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[95vw] sm:max-w-[900px]">
          <DialogHeader>
            <DialogTitle>Loading Session...</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Error state
  if (sessionError || memberDialogData.error) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[95vw] sm:max-w-[900px]">
          <DialogHeader>
            <DialogTitle>Error</DialogTitle>
          </DialogHeader>
          <div className="py-6">
            <p className="text-destructive text-sm">
              {sessionError?.message ||
                memberDialogData.error?.message ||
                "Failed to load session data"}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // No session data
  if (!session) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-[95vw] overflow-y-auto sm:max-w-[900px]">
        <DialogHeader>
          <DialogTitle>Training Session</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="session" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="session">Session Info</TabsTrigger>
            <TabsTrigger value="member">Member Details</TabsTrigger>
          </TabsList>

          <TabsContent value="session" className="space-y-0">
            <SessionInfoTab
              session={session}
              alerts={alerts}
              onSessionUpdated={handleSessionUpdated}
              onSessionDeleted={handleSessionDeleted}
            />
          </TabsContent>

          <TabsContent value="member" className="space-y-0">
            <MemberDetailsTab
              session={session}
              memberData={memberDialogData}
              alerts={alerts}
              onMemberUpdated={handleMemberUpdated}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
