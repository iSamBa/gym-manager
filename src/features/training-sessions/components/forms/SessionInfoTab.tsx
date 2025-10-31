import { memo, useState, useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Edit,
  Save,
  X,
  Trash2,
  Loader2,
  Clock,
  User,
  Dumbbell,
  ExternalLink,
} from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { logger } from "@/lib/logger";
import { SessionAlertsSection } from "../SessionAlertsSection";
import type { TrainingSession } from "../../lib/types";
import type {
  MemberComment,
  TrainerWithProfile,
} from "@/features/database/lib/types";
import {
  updateSessionSchema,
  type UpdateSessionData,
} from "../../lib/validation";
import {
  useUpdateTrainingSession,
  useUpdateTrainingSessionStatus,
  useDeleteTrainingSession,
} from "../../hooks/use-training-sessions";
import { useTrainers } from "@/features/trainers/hooks";

/**
 * Props for SessionInfoTab component
 */
export interface SessionInfoTabProps {
  /** Current session data */
  session: TrainingSession;
  /** Active alerts for the session */
  alerts: MemberComment[];
  /** Callback when session is updated */
  onSessionUpdated?: (sessionId: string) => void;
  /** Callback when session is deleted */
  onSessionDeleted?: (sessionId: string) => void;
}

/**
 * Session Information tab with Edit/Save/Cancel pattern
 *
 * Features:
 * - Independent edit mode state
 * - Read mode: Display data with Edit button
 * - Edit mode: Form controls with Save/Cancel buttons
 * - Delete button (visible only in edit mode)
 * - Session alerts display
 * - Member name display (always read-only)
 *
 * @param props - Session data and callbacks
 */
export const SessionInfoTab = memo(function SessionInfoTab({
  session,
  alerts,
  onSessionUpdated,
  onSessionDeleted,
}: SessionInfoTabProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Fetch data for selects (trainers includes user_profile data)
  const { data: trainers = [] } = useTrainers() as {
    data: TrainerWithProfile[];
  };

  // Mutations
  const updateSessionMutation = useUpdateTrainingSession();
  const updateStatusMutation = useUpdateTrainingSessionStatus();
  const deleteSessionMutation = useDeleteTrainingSession();

  // Form setup
  const form = useForm<UpdateSessionData>({
    resolver: zodResolver(updateSessionSchema),
    defaultValues: {
      machine_id: session.machine_id,
      trainer_id: session.trainer_id || null,
      scheduled_start: session.scheduled_start,
      scheduled_end: session.scheduled_end,
      session_type: session.session_type || "member",
      member_id: session.participants?.[0]?.id || "",
      notes: session.notes || "",
      status: session.status,
    },
  });

  const { handleSubmit, reset } = form;

  // Update form when session changes
  useEffect(() => {
    if (session) {
      const sessionMemberId = session.participants?.[0]?.id || "";

      reset({
        machine_id: session.machine_id,
        trainer_id: session.trainer_id || null,
        scheduled_start: session.scheduled_start,
        scheduled_end: session.scheduled_end,
        session_type: session.session_type || "member",
        notes: session.notes || "",
        status: session.status,
        member_id: sessionMemberId,
      });
    }
  }, [session, reset]);

  // Handle edit button click
  const handleEdit = useCallback(() => {
    setIsEditMode(true);
  }, []);

  // Handle cancel button click
  const handleCancel = useCallback(() => {
    // Reset form to original session data
    reset({
      machine_id: session.machine_id,
      trainer_id: session.trainer_id || null,
      scheduled_start: session.scheduled_start,
      scheduled_end: session.scheduled_end,
      session_type: session.session_type || "member",
      notes: session.notes || "",
      status: session.status,
      member_id: session.participants?.[0]?.id || "",
    });
    setIsEditMode(false);
    setShowDeleteConfirm(false);
  }, [session, reset]);

  // Handle form submission
  const onSubmit = useCallback(
    async (data: UpdateSessionData) => {
      if (!session.id) return;

      try {
        // Determine if this is a status-only update
        const changedFields = Object.keys(data).filter((key) => {
          if (key === "member_ids" || key === "member_id") return false;
          const originalValue = session[key as keyof typeof session];
          const newValue = data[key as keyof typeof data];
          return originalValue !== newValue;
        });

        const isStatusOnlyUpdate =
          changedFields.length === 1 && changedFields[0] === "status";

        if (
          isStatusOnlyUpdate &&
          data.status &&
          data.status !== session.status
        ) {
          await updateStatusMutation.mutateAsync({
            id: session.id,
            status: data.status,
          });
        } else {
          // Member is read-only, don't include in updates
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { member_id, ...sessionOnlyData } = data;

          // Ensure machine_id is always included from the original session
          const updateData = {
            ...sessionOnlyData,
            machine_id: session.machine_id || data.machine_id,
          };

          await updateSessionMutation.mutateAsync({
            id: session.id,
            data: updateData,
          });
        }

        // Exit edit mode
        setIsEditMode(false);
        if (onSessionUpdated) {
          onSessionUpdated(session.id);
        }
      } catch (error) {
        logger.error("Failed to update training session", { error });
      }
    },
    [session, updateSessionMutation, updateStatusMutation, onSessionUpdated]
  );

  // Handle delete
  const handleDelete = useCallback(async () => {
    if (!session.id || !showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }

    try {
      await deleteSessionMutation.mutateAsync(session.id);
      if (onSessionDeleted) {
        onSessionDeleted(session.id);
      }
    } catch (error) {
      logger.error("Failed to delete training session", { error });
    }
  }, [session.id, showDeleteConfirm, deleteSessionMutation, onSessionDeleted]);

  const isLoading =
    updateSessionMutation.isPending ||
    updateStatusMutation.isPending ||
    deleteSessionMutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Header with Edit or Save/Cancel buttons */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Session Information</h3>
          {!isEditMode ? (
            <Button
              onClick={handleEdit}
              variant="outline"
              size="sm"
              type="button"
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save
              </Button>
              <Button
                onClick={handleCancel}
                variant="outline"
                size="sm"
                type="button"
                disabled={isLoading}
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            </div>
          )}
        </div>

        <Separator />

        {/* Alerts Section */}
        <SessionAlertsSection alerts={alerts} />

        {/* Member - Always Read-Only */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <User className="text-muted-foreground h-4 w-4" />
            <span className="text-sm font-medium">Member</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-sm">
              {session.participants?.[0]?.name || "No member assigned"}
            </Badge>
            {session.participants?.[0]?.id && (
              <Link
                href={`/members/${session.participants[0].id}`}
                className="text-muted-foreground hover:text-primary flex items-center gap-1 text-xs"
              >
                Go to Profile
                <ExternalLink className="h-3 w-3" />
              </Link>
            )}
          </div>
        </div>

        <Separator />

        {/* Session Details */}
        <div className="space-y-4">
          <h4 className="text-muted-foreground text-sm font-medium">
            Session Details
          </h4>

          {/* Status */}
          {isEditMode ? (
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Session Status *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-sm">Status</span>
              <Badge variant="outline" className="capitalize">
                {session.status.replace("_", " ")}
              </Badge>
            </div>
          )}

          {/* Trainer */}
          {isEditMode ? (
            <FormField
              control={form.control}
              name="trainer_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Trainer
                  </FormLabel>
                  <Select
                    onValueChange={(value) =>
                      field.onChange(value === "none" ? null : value)
                    }
                    value={field.value || "none"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select trainer" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">No trainer</SelectItem>
                      {trainers.map((trainer) => (
                        <SelectItem key={trainer.id} value={trainer.id}>
                          {trainer.user_profile?.first_name &&
                          trainer.user_profile?.last_name
                            ? `${trainer.user_profile.first_name} ${trainer.user_profile.last_name}`
                            : trainer.id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="text-muted-foreground h-4 w-4" />
                <span className="text-sm">Trainer</span>
              </div>
              <span className="text-sm">
                {session.trainer_name || "No trainer assigned"}
              </span>
            </div>
          )}

          {/* Machine */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Dumbbell className="text-muted-foreground h-4 w-4" />
              <span className="text-sm">Machine</span>
            </div>
            <span className="text-sm">
              {session.machine_name || "No machine assigned"}
            </span>
          </div>

          {/* Scheduled Times */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="text-muted-foreground h-4 w-4" />
              <span className="text-sm font-medium">Scheduled Time</span>
            </div>
            <div className="space-y-1 text-sm">
              <div>
                <span className="text-muted-foreground">Start: </span>
                {format(new Date(session.scheduled_start), "PPP p")}
              </div>
              <div>
                <span className="text-muted-foreground">End: </span>
                {format(new Date(session.scheduled_end), "PPP p")}
              </div>
            </div>
          </div>

          {/* Notes */}
          {isEditMode ? (
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value || ""}
                      placeholder="Add session notes..."
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : (
            session.notes && (
              <div className="space-y-2">
                <span className="text-sm font-medium">Notes</span>
                <p className="text-muted-foreground text-sm whitespace-pre-wrap">
                  {session.notes}
                </p>
              </div>
            )
          )}
        </div>

        {/* Delete Button - Only in Edit Mode */}
        {isEditMode && (
          <>
            <Separator />
            <div className="space-y-2">
              {showDeleteConfirm ? (
                <div className="space-y-2">
                  <p className="text-destructive text-sm font-medium">
                    Are you sure you want to delete this session?
                  </p>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleDelete}
                      variant="destructive"
                      size="sm"
                      disabled={isLoading}
                      type="button"
                    >
                      {isLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="mr-2 h-4 w-4" />
                      )}
                      Confirm Delete
                    </Button>
                    <Button
                      onClick={() => setShowDeleteConfirm(false)}
                      variant="outline"
                      size="sm"
                      disabled={isLoading}
                      type="button"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  onClick={handleDelete}
                  variant="destructive"
                  size="sm"
                  type="button"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Session
                </Button>
              )}
            </div>
          </>
        )}
      </form>
    </Form>
  );
});
