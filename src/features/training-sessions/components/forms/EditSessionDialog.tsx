import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Edit,
  Loader2,
  Users,
  MapPin,
  Clock,
  User,
  AlertTriangle,
  Star,
} from "lucide-react";
import { format } from "date-fns";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DateTimePicker } from "@/components/ui/datetime-picker";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";

import {
  updateSessionSchema,
  type UpdateSessionData,
} from "../../lib/validation";
import {
  useUpdateTrainingSession,
  useUpdateTrainingSessionStatus,
  useTrainingSession,
  useDeleteTrainingSession,
} from "../../hooks/use-training-sessions";
import { useTrainers } from "../../hooks/use-trainers";
import { TrainerAvailabilityCheck } from "./TrainerAvailabilityCheck";
import MemberMultiSelect from "./MemberMultiSelect";

interface EditSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId?: string;
  onSessionUpdated?: (sessionId: string) => void;
  onSessionDeleted?: (sessionId: string) => void;
}

export const EditSessionDialog: React.FC<EditSessionDialogProps> = ({
  open,
  onOpenChange,
  sessionId,
  onSessionUpdated,
  onSessionDeleted,
}) => {
  const [showAvailabilityCheck, setShowAvailabilityCheck] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Fetch session data
  const {
    data: session,
    isLoading: sessionLoading,
    error: sessionError,
  } = useTrainingSession(sessionId || "");

  // Fetch trainers for selection
  const { data: trainers = [] } = useTrainers();

  // Mutations
  const updateSessionMutation = useUpdateTrainingSession();
  const updateStatusMutation = useUpdateTrainingSessionStatus();
  const deleteSessionMutation = useDeleteTrainingSession();

  // Form setup with validation
  const form = useForm<UpdateSessionData>({
    resolver: zodResolver(updateSessionSchema),
    defaultValues: {
      scheduled_start: "",
      scheduled_end: "",
      location: "",
      session_type: "standard",
      max_participants: 1,
      member_ids: [],
      notes: "",
      status: "scheduled",
    },
  });

  const { handleSubmit, watch, setValue, reset, formState } = form;
  const { isSubmitting, isDirty } = formState;

  // Watch form fields for real-time validation and availability checking
  const watchedFields = watch();
  const { scheduled_start, scheduled_end } = watchedFields;

  // Populate form when session data loads
  useEffect(() => {
    if (session && open) {
      setValue("scheduled_start", session.scheduled_start);
      setValue("scheduled_end", session.scheduled_end);
      setValue("location", session.location || "");
      setValue("session_type", session.session_type || "standard");
      setValue("max_participants", session.max_participants);
      setValue("notes", session.notes || "");
      setValue("status", session.status);

      // Extract member IDs from participants array
      const sessionWithParticipants = session as TrainingSession & {
        participants?: Array<{ id: string; name: string; email: string }>;
      };
      const memberIds = sessionWithParticipants.participants
        ? sessionWithParticipants.participants.map((p) => p.id)
        : [];
      setValue("member_ids", memberIds);
    }
  }, [session, open, setValue]);

  // Show availability check when all required fields are present
  useEffect(() => {
    const shouldShowCheck = !!(
      session?.trainer_id &&
      scheduled_start &&
      scheduled_end
    );
    setShowAvailabilityCheck(shouldShowCheck);
  }, [session?.trainer_id, scheduled_start, scheduled_end]);

  // Handle form submission
  const onSubmit = async (data: UpdateSessionData) => {
    if (!sessionId) {
      return;
    }

    try {
      // Determine if this is a status-only update
      const changedFields = Object.keys(data).filter((key) => {
        if (key === "member_ids") return false; // Always exclude member_ids for now
        const originalValue = session?.[key as keyof typeof session];
        const newValue = data[key as keyof typeof data];
        return originalValue !== newValue;
      });

      const isStatusOnlyUpdate =
        changedFields.length === 1 && changedFields[0] === "status";

      if (isStatusOnlyUpdate && data.status !== session?.status) {
        // Use dedicated status update
        await updateStatusMutation.mutateAsync({
          id: sessionId,
          status: data.status,
        });
      } else {
        // For status-only updates, don't send member_ids to avoid unnecessary member processing
        const { member_ids, ...sessionOnlyData } = data;
        const updateData = sessionOnlyData;

        await updateSessionMutation.mutateAsync({
          id: sessionId,
          data: updateData,
        });
      }

      // Close dialog and notify parent
      onOpenChange(false);
      if (onSessionUpdated) {
        onSessionUpdated(sessionId);
      }
    } catch (error) {
      console.error("Failed to update training session:", error);
    }
  };

  // Handle session deletion
  const handleDelete = async () => {
    if (!sessionId) return;

    try {
      await deleteSessionMutation.mutateAsync(sessionId);
      onOpenChange(false);
      if (onSessionDeleted) {
        onSessionDeleted(sessionId);
      }
    } catch (error) {
      console.error("Failed to delete training session:", error);
    }
  };

  // Handle dialog close
  const handleClose = () => {
    if (
      !isSubmitting &&
      !deleteSessionMutation.isPending &&
      !updateStatusMutation.isPending
    ) {
      reset();
      setShowDeleteConfirm(false);
      onOpenChange(false);
    }
  };

  // Format trainer display name
  const formatTrainerName = (trainer: {
    id: string;
    user_profile?: { first_name?: string; last_name?: string };
  }) => {
    const profile = trainer.user_profile;
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name} ${profile.last_name}`;
    }
    return trainer.id;
  };

  // Calculate session duration
  const calculateDuration = () => {
    if (!scheduled_start || !scheduled_end) return null;

    try {
      const start = new Date(scheduled_start);
      const end = new Date(scheduled_end);
      const durationMs = end.getTime() - start.getTime();
      const durationMinutes = Math.floor(durationMs / (1000 * 60));

      if (durationMinutes < 60) {
        return `${durationMinutes} minutes`;
      } else {
        const hours = Math.floor(durationMinutes / 60);
        const minutes = durationMinutes % 60;
        return `${hours}h ${minutes > 0 ? `${minutes}m` : ""}`;
      }
    } catch {
      return null;
    }
  };

  const duration = calculateDuration();

  // Loading state
  if (sessionLoading) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="w-[90vw] sm:max-w-[800px]">
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
        <DialogContent className="w-[90vw] sm:max-w-[800px]">
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

  // Delete confirmation dialog
  if (showDeleteConfirm) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="w-[90vw] sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Delete Training Session</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this training session? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This will permanently delete the session and remove all
                participant bookings.
              </AlertDescription>
            </Alert>

            <div className="bg-muted space-y-1 rounded p-3">
              <p className="font-medium">Session Details:</p>
              <p className="text-muted-foreground text-sm">
                {format(new Date(session.scheduled_start), "PPpp")} -{" "}
                {format(new Date(session.scheduled_end), "p")}
              </p>
              <p className="text-muted-foreground text-sm">
                Location: {session.location || "Not specified"}
              </p>
              <p className="text-muted-foreground text-sm">
                Participants: {session.current_participants}/
                {session.max_participants}
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={deleteSessionMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteSessionMutation.isPending}
            >
              {deleteSessionMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete Session
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] w-[90vw] overflow-y-auto sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Edit Training Session
          </DialogTitle>
          <DialogDescription>
            Modify the training session details. Changes will be saved
            immediately.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Session Status Info */}
            <div className="bg-muted flex items-center justify-between rounded p-3">
              <div className="space-y-1">
                <p className="text-sm font-medium">Current Status</p>
                <Badge variant="outline" className="capitalize">
                  {session.status.replace("_", " ")}
                </Badge>
              </div>
              <div className="space-y-1 text-right">
                <p className="text-sm font-medium">Participants</p>
                <Badge variant="outline">
                  {session.current_participants}/{session.max_participants}
                </Badge>
              </div>
            </div>

            {/* Status Change */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Badge className="h-4 w-4" />
                    Session Status *
                  </FormLabel>
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
                  <p className="text-muted-foreground text-xs">
                    Change the session status to reflect its current state
                  </p>
                </FormItem>
              )}
            />

            {/* Trainer Information - Display only */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium">
                <User className="h-4 w-4" />
                Trainer
              </label>
              <div className="bg-muted flex items-center justify-between rounded p-3">
                <div className="flex items-center gap-2">
                  <User className="text-muted-foreground h-4 w-4" />
                  <span className="font-medium">
                    {session.trainer_name ||
                      formatTrainerName(
                        trainers.find((t) => t.id === session.trainer_id) || {
                          id: session.trainer_id,
                        }
                      )}
                  </span>
                </div>
                <Badge variant="outline">Assigned</Badge>
              </div>
              <p className="text-muted-foreground text-xs">
                Trainer cannot be changed after session creation
              </p>
            </div>

            {/* Session Type Selection */}
            <FormField
              control={form.control}
              name="session_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    Session Type *
                  </FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="flex max-w-2xl gap-3"
                    >
                      <label
                        htmlFor="trail-edit"
                        className={`hover:border-primary/50 min-w-0 cursor-pointer rounded-lg border-2 p-4 transition-all duration-200 ${
                          field.value === "trail"
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-muted-foreground"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <RadioGroupItem
                            value="trail"
                            id="trail-edit"
                            className="mt-1"
                          />
                          <div className="flex flex-col space-y-1">
                            <span className="font-semibold">Trail Session</span>
                            <p className="text-muted-foreground text-sm">
                              Try-out session for new members
                            </p>
                          </div>
                        </div>
                      </label>
                      <label
                        htmlFor="standard-edit"
                        className={`hover:border-primary/50 min-w-0 cursor-pointer rounded-lg border-2 p-4 transition-all duration-200 ${
                          field.value === "standard"
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-muted-foreground"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <RadioGroupItem
                            value="standard"
                            id="standard-edit"
                            className="mt-1"
                          />
                          <div className="flex flex-col space-y-1">
                            <span className="font-semibold">
                              Standard Session
                            </span>
                            <p className="text-muted-foreground text-sm">
                              Regular training session
                            </p>
                          </div>
                        </div>
                      </label>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                  <p className="text-muted-foreground text-xs">
                    Change the session type (Trail for prospective members,
                    Standard for regular members)
                  </p>
                </FormItem>
              )}
            />

            {/* Time Selection */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="scheduled_start"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Start Time *
                    </FormLabel>
                    <FormControl>
                      <DateTimePicker
                        value={field.value ? new Date(field.value) : undefined}
                        onChange={(date) =>
                          field.onChange(date ? date.toISOString() : "")
                        }
                        placeholder="Pick start date & time"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="scheduled_end"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Time *</FormLabel>
                    <FormControl>
                      <DateTimePicker
                        value={field.value ? new Date(field.value) : undefined}
                        onChange={(date) =>
                          field.onChange(date ? date.toISOString() : "")
                        }
                        placeholder="Pick end date & time"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Duration Display */}
            {duration && (
              <div className="text-muted-foreground flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4" />
                Duration: <Badge variant="outline">{duration}</Badge>
              </div>
            )}

            {/* Trainer Availability Check */}
            {showAvailabilityCheck && isDirty && session && (
              <TrainerAvailabilityCheck
                trainerId={session.trainer_id}
                startTime={scheduled_start}
                endTime={scheduled_end}
                excludeSessionId={sessionId}
              />
            )}

            <Separator />

            {/* Location and Capacity */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Location *
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Studio 1, Gym Floor, etc."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="max_participants"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Max Participants *
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={session.current_participants} // Can't be less than current participants
                        max={50}
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value) || 1)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                    <p className="text-muted-foreground text-xs">
                      Must be at least {session.current_participants} (current
                      participants)
                    </p>
                  </FormItem>
                )}
              />
            </div>

            {/* Member Selection */}
            <FormField
              control={form.control}
              name="member_ids"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Current Members
                  </FormLabel>
                  <FormControl>
                    <MemberMultiSelect
                      selectedMemberIds={field.value || []}
                      onMemberIdsChange={field.onChange}
                      maxMembers={watchedFields.max_participants}
                      error={formState.errors.member_ids?.message}
                    />
                  </FormControl>
                  <FormMessage />
                  <p className="text-muted-foreground text-xs">
                    Add or remove members from this training session
                  </p>
                </FormItem>
              )}
            />

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any additional notes for this session..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Form Actions */}
            <div className="flex justify-between pt-4">
              <Button
                type="button"
                variant="destructive"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isSubmitting}
              >
                Delete Session
              </Button>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    isSubmitting || updateStatusMutation.isPending || !isDirty
                  }
                >
                  {(isSubmitting || updateStatusMutation.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Save Changes
                </Button>
              </div>
            </div>
          </form>
        </Form>

        {/* Error Display */}
        {updateSessionMutation.error && (
          <div className="text-destructive bg-destructive/10 border-destructive/20 mt-4 rounded border p-3 text-sm">
            {updateSessionMutation.error.message}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EditSessionDialog;
