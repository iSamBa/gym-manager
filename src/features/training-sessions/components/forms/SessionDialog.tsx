import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Edit,
  Loader2,
  Clock,
  User,
  Dumbbell,
  AlertTriangle,
  AlertCircle,
  Star,
  Save,
  X,
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import {
  useTrainingSession,
  useUpdateTrainingSession,
  useUpdateTrainingSessionStatus,
  useDeleteTrainingSession,
} from "../../hooks/use-training-sessions";
import { useSessionAlerts } from "../../hooks/use-session-alerts";
import { useTrainers } from "@/features/trainers/hooks";
import {
  updateSessionSchema,
  type UpdateSessionData,
} from "../../lib/validation";
import type { TrainingSession } from "../../lib/types";

interface SessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId?: string;
  onSessionUpdated?: (sessionId: string) => void;
  onSessionDeleted?: (sessionId: string) => void;
}

export const SessionDialog: React.FC<SessionDialogProps> = ({
  open,
  onOpenChange,
  sessionId,
  onSessionUpdated,
  onSessionDeleted,
}) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [sessionDate, setSessionDate] = useState<Date | undefined>(undefined);

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

  // Fetch trainers for selection
  const { data: trainers = [] } = useTrainers();

  // Mutations
  const updateSessionMutation = useUpdateTrainingSession();
  const updateStatusMutation = useUpdateTrainingSessionStatus();
  const deleteSessionMutation = useDeleteTrainingSession();

  // Form setup
  const form = useForm<UpdateSessionData>({
    resolver: zodResolver(updateSessionSchema),
    defaultValues: {
      machine_id: "",
      trainer_id: null,
      scheduled_start: "",
      scheduled_end: "",
      session_type: "standard",
      member_id: "",
      notes: "",
      status: "scheduled",
    },
  });

  const { handleSubmit, watch, reset, formState } = form;
  const { isSubmitting, isDirty } = formState;

  // Watch form fields for real-time validation
  const watchedFields = watch();
  const { scheduled_start, scheduled_end } = watchedFields;

  // Populate form when session data loads
  useEffect(() => {
    if (session && open) {
      const sessionWithParticipants = session as TrainingSession & {
        participants?: Array<{ id: string; name: string; email: string }>;
      };
      const sessionMemberId =
        sessionWithParticipants.participants?.[0]?.id || "";

      // Set session date from scheduled_start
      const startDate = new Date(session.scheduled_start);
      setSessionDate(startDate);

      reset({
        machine_id: session.machine_id,
        trainer_id: session.trainer_id || null,
        scheduled_start: session.scheduled_start,
        scheduled_end: session.scheduled_end,
        session_type: session.session_type || "standard",
        notes: session.notes || "",
        status: session.status,
        member_id: sessionMemberId,
      });
    }
  }, [session, open, reset]);

  // Reset edit mode when dialog closes
  useEffect(() => {
    if (!open) {
      setIsEditMode(false);
      setShowDeleteConfirm(false);
      setSessionDate(undefined);
      setTimeout(() => {
        reset();
      }, 200);
    }
  }, [open, reset]);

  // Handle form submission
  const onSubmit = async (data: UpdateSessionData) => {
    if (!sessionId) return;

    try {
      // Determine if this is a status-only update
      const changedFields = Object.keys(data).filter((key) => {
        if (key === "member_ids" || key === "member_id") return false;
        const originalValue = session?.[key as keyof typeof session];
        const newValue = data[key as keyof typeof data];
        return originalValue !== newValue;
      });

      const isStatusOnlyUpdate =
        changedFields.length === 1 && changedFields[0] === "status";

      if (
        isStatusOnlyUpdate &&
        data.status &&
        data.status !== session?.status
      ) {
        await updateStatusMutation.mutateAsync({
          id: sessionId,
          status: data.status,
        });
      } else {
        // Member is read-only, don't include in updates
        // Machine_id should be preserved from session data
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { member_id, ...sessionOnlyData } = data;

        // Ensure machine_id is always included from the original session
        const updateData = {
          ...sessionOnlyData,
          machine_id: session?.machine_id || data.machine_id, // Preserve machine_id
        };

        await updateSessionMutation.mutateAsync({
          id: sessionId,
          data: updateData,
        });
      }

      // Exit edit mode but keep dialog open to show updated data with alerts
      setIsEditMode(false);
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
      onOpenChange(false);
    }
  };

  // Handle edit mode toggle
  const handleEditToggle = () => {
    if (isEditMode && isDirty) {
      // If there are unsaved changes, show confirmation
      if (
        confirm(
          "You have unsaved changes. Are you sure you want to cancel editing?"
        )
      ) {
        reset();
        setIsEditMode(false);
      }
    } else {
      setIsEditMode(!isEditMode);
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
        <DialogContent className="w-[90vw] sm:max-w-[700px]">
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
        <DialogContent className="w-[90vw] sm:max-w-[700px]">
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
                Machine: {session.machine_name || "Not specified"}
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

  const memberName = session.participants?.[0]?.name || "Unknown Member";
  const hasAlerts = alerts.length > 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] w-[90vw] overflow-y-auto sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between pr-8">
            <span>{isEditMode ? "Edit Session" : "Session Information"}</span>
            {!isEditMode && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditMode(true)}
                  className="gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="gap-2"
                >
                  <AlertTriangle className="h-4 w-4" />
                  Delete
                </Button>
              </div>
            )}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Member Information - Always Visible */}
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

            {/* Active Alerts Section - Always Visible */}
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
                  <div className="max-h-40 space-y-2 overflow-y-auto">
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
                          <p className="text-sm text-orange-800">
                            {alert.body}
                          </p>
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
              {isEditMode ? (
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Session Status *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="scheduled">Scheduled</SelectItem>
                          <SelectItem value="in_progress">
                            In Progress
                          </SelectItem>
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
                            <SelectValue placeholder="Select trainer (optional)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">
                            No trainer assigned
                          </SelectItem>
                          {trainers.map((trainer) => (
                            <SelectItem key={trainer.id} value={trainer.id}>
                              {formatTrainerName(trainer)}
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
                  <span className="text-sm font-medium">
                    {session.trainer_name || "No trainer assigned"}
                  </span>
                </div>
              )}

              {/* Machine - Always read-only */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Dumbbell className="text-muted-foreground h-4 w-4" />
                  <span className="text-sm">Machine</span>
                </div>
                <span className="text-sm font-medium">
                  {session.machine_name || "Not specified"}
                </span>
              </div>

              {/* Session Type */}
              {isEditMode ? (
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
                            htmlFor="trail-session"
                            className={`hover:border-primary/50 min-w-0 cursor-pointer rounded-lg border-2 p-4 transition-all duration-200 ${
                              field.value === "trail"
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-muted-foreground"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <RadioGroupItem
                                value="trail"
                                id="trail-session"
                                className="mt-1"
                              />
                              <div className="flex flex-col space-y-1">
                                <span className="font-semibold">
                                  Trail Session
                                </span>
                                <p className="text-muted-foreground text-sm">
                                  Try-out session for new members
                                </p>
                              </div>
                            </div>
                          </label>
                          <label
                            htmlFor="standard-session"
                            className={`hover:border-primary/50 min-w-0 cursor-pointer rounded-lg border-2 p-4 transition-all duration-200 ${
                              field.value === "standard"
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-muted-foreground"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <RadioGroupItem
                                value="standard"
                                id="standard-session"
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
                    </FormItem>
                  )}
                />
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-sm">Session Type</span>
                  <Badge variant="secondary" className="capitalize">
                    {session.session_type === "trail"
                      ? "Trail Session"
                      : "Standard Session"}
                  </Badge>
                </div>
              )}

              {/* Date and Time Selection */}
              {isEditMode ? (
                <div className="space-y-4">
                  {/* Session Date - Calendar Only */}
                  <FormItem className="flex flex-col">
                    <FormLabel className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Session Date *
                    </FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !sessionDate && "text-muted-foreground"
                            )}
                          >
                            {sessionDate ? (
                              format(sessionDate, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <Clock className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={sessionDate}
                          onSelect={(date) => {
                            if (date) {
                              setSessionDate(date);

                              // Update scheduled_start with new date, preserving time
                              const currentStart = scheduled_start
                                ? new Date(scheduled_start)
                                : new Date();
                              const newStart = new Date(date);
                              newStart.setHours(
                                currentStart.getHours(),
                                currentStart.getMinutes(),
                                0,
                                0
                              );
                              form.setValue(
                                "scheduled_start",
                                newStart.toISOString()
                              );

                              // Update scheduled_end with new date, preserving time
                              const currentEnd = scheduled_end
                                ? new Date(scheduled_end)
                                : new Date();
                              const newEnd = new Date(date);
                              newEnd.setHours(
                                currentEnd.getHours(),
                                currentEnd.getMinutes(),
                                0,
                                0
                              );
                              form.setValue(
                                "scheduled_end",
                                newEnd.toISOString()
                              );
                            }
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </FormItem>

                  {/* Start and End Times - Time Only */}
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="scheduled_start"
                      render={({ field }) => {
                        const currentTime = field.value
                          ? format(new Date(field.value), "HH:mm")
                          : "";

                        return (
                          <FormItem>
                            <FormLabel>Start Time *</FormLabel>
                            <Select
                              value={currentTime}
                              onValueChange={(time) => {
                                if (sessionDate && time) {
                                  const [hours, minutes] = time.split(":");
                                  const newDateTime = new Date(sessionDate);
                                  newDateTime.setHours(
                                    parseInt(hours),
                                    parseInt(minutes),
                                    0,
                                    0
                                  );
                                  field.onChange(newDateTime.toISOString());
                                }
                              }}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select start time" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {Array.from({ length: 24 }, (_, i) => i).map(
                                  (hour) => {
                                    const hourStr = hour
                                      .toString()
                                      .padStart(2, "0");
                                    return (
                                      <React.Fragment key={hour}>
                                        <SelectItem value={`${hourStr}:00`}>
                                          {hourStr}:00
                                        </SelectItem>
                                        <SelectItem value={`${hourStr}:30`}>
                                          {hourStr}:30
                                        </SelectItem>
                                      </React.Fragment>
                                    );
                                  }
                                )}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        );
                      }}
                    />

                    <FormField
                      control={form.control}
                      name="scheduled_end"
                      render={({ field }) => {
                        const currentTime = field.value
                          ? format(new Date(field.value), "HH:mm")
                          : "";

                        return (
                          <FormItem>
                            <FormLabel>End Time *</FormLabel>
                            <Select
                              value={currentTime}
                              onValueChange={(time) => {
                                if (sessionDate && time) {
                                  const [hours, minutes] = time.split(":");
                                  const newDateTime = new Date(sessionDate);
                                  newDateTime.setHours(
                                    parseInt(hours),
                                    parseInt(minutes),
                                    0,
                                    0
                                  );
                                  field.onChange(newDateTime.toISOString());
                                }
                              }}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select end time" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {Array.from({ length: 24 }, (_, i) => i).map(
                                  (hour) => {
                                    const hourStr = hour
                                      .toString()
                                      .padStart(2, "0");
                                    return (
                                      <React.Fragment key={hour}>
                                        <SelectItem value={`${hourStr}:00`}>
                                          {hourStr}:00
                                        </SelectItem>
                                        <SelectItem value={`${hourStr}:30`}>
                                          {hourStr}:30
                                        </SelectItem>
                                      </React.Fragment>
                                    );
                                  }
                                )}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        );
                      }}
                    />
                  </div>
                </div>
              ) : (
                <>
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
                </>
              )}

              {/* Duration Display */}
              {duration && isEditMode && (
                <div className="text-muted-foreground flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4" />
                  Duration: <Badge variant="outline">{duration}</Badge>
                </div>
              )}

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
              ) : (
                session.notes && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <span className="text-sm font-medium">Notes</span>
                      <p className="text-muted-foreground text-sm whitespace-pre-wrap">
                        {session.notes}
                      </p>
                    </div>
                  </>
                )
              )}
            </div>

            {/* Footer Actions */}
            <div className="flex justify-between pt-4">
              {isEditMode ? (
                <>
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
                      onClick={handleEditToggle}
                      disabled={isSubmitting}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={
                        isSubmitting ||
                        updateStatusMutation.isPending ||
                        !isDirty
                      }
                    >
                      {(isSubmitting || updateStatusMutation.isPending) && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </Button>
                  </div>
                </>
              ) : (
                <Button
                  variant="outline"
                  onClick={handleClose}
                  className="ml-auto"
                >
                  Close
                </Button>
              )}
            </div>

            {/* Error Display */}
            {updateSessionMutation.error && (
              <div className="text-destructive bg-destructive/10 border-destructive/20 mt-4 rounded border p-3 text-sm">
                {updateSessionMutation.error.message}
              </div>
            )}
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default SessionDialog;
