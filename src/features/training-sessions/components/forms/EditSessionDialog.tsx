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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DateTimePicker } from "@/components/ui/datetime-picker";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";

import {
  createSessionSchema,
  type CreateSessionData,
} from "../../lib/validation";
import {
  useUpdateTrainingSession,
  useTrainingSession,
  useDeleteTrainingSession,
} from "../../hooks/use-training-sessions";
import { useTrainers } from "../../hooks/use-trainers";
import { TrainerAvailabilityCheck } from "./TrainerAvailabilityCheck";

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
  const deleteSessionMutation = useDeleteTrainingSession();

  // Form setup with validation
  const form = useForm<CreateSessionData>({
    resolver: zodResolver(createSessionSchema),
    defaultValues: {
      trainer_id: "",
      scheduled_start: "",
      scheduled_end: "",
      location: "",
      session_type: "standard",
      max_participants: 1,
      member_ids: [],
      notes: "",
    },
  });

  const { handleSubmit, watch, setValue, reset, formState } = form;
  const { isSubmitting, isDirty } = formState;

  // Watch form fields for real-time validation and availability checking
  const watchedFields = watch();
  const { trainer_id, scheduled_start, scheduled_end } = watchedFields;

  // Populate form when session data loads
  useEffect(() => {
    if (session && open) {
      setValue("trainer_id", session.trainer_id);
      setValue("scheduled_start", session.scheduled_start);
      setValue("scheduled_end", session.scheduled_end);
      setValue("location", session.location || "");
      setValue("session_type", session.session_type || "standard");
      setValue("max_participants", session.max_participants);
      setValue("notes", session.notes || "");

      // TODO: Load existing member IDs from session members
      // This would require fetching session members from the database
      setValue("member_ids", []);
    }
  }, [session, open, setValue]);

  // Show availability check when all required fields are present
  useEffect(() => {
    const shouldShowCheck = !!(trainer_id && scheduled_start && scheduled_end);
    setShowAvailabilityCheck(shouldShowCheck);
  }, [trainer_id, scheduled_start, scheduled_end]);

  // Handle form submission
  const onSubmit = async (data: CreateSessionData) => {
    if (!sessionId) return;

    try {
      // Extract only the fields that can be updated
      const updateData = {
        scheduled_start: data.scheduled_start,
        scheduled_end: data.scheduled_end,
        location: data.location,
        session_type: data.session_type,
        max_participants: data.max_participants,
        notes: data.notes,
      };

      await updateSessionMutation.mutateAsync({
        id: sessionId,
        data: updateData,
      });

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
    if (!isSubmitting && !deleteSessionMutation.isPending) {
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

            {/* Trainer Selection - Read-only for existing sessions */}
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
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={true} // Trainer cannot be changed after creation
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a trainer" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {trainers.map((trainer) => (
                        <SelectItem key={trainer.id} value={trainer.id}>
                          {formatTrainerName(trainer)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-muted-foreground text-xs">
                    Trainer cannot be changed after session creation
                  </p>
                </FormItem>
              )}
            />

            {/* Session Type Selection */}
            <FormField
              control={form.control}
              name="session_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Badge className="h-4 w-4" />
                    Session Type *
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select session type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="standard">Standard Session</SelectItem>
                      <SelectItem value="trail">Trail Session</SelectItem>
                    </SelectContent>
                  </Select>
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
            {showAvailabilityCheck && isDirty && (
              <TrainerAvailabilityCheck
                trainerId={trainer_id}
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

            {/* Member Management - Simplified for edit mode */}
            <div className="space-y-2">
              <FormLabel className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Current Members
              </FormLabel>
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Member management for existing sessions is not yet
                  implemented. Use the session management interface to
                  add/remove participants.
                </AlertDescription>
              </Alert>
            </div>

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
                <Button type="submit" disabled={isSubmitting || !isDirty}>
                  {isSubmitting && (
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
