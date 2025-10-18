import React, { memo, useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CalendarPlus,
  Loader2,
  User,
  Users,
  Dumbbell,
  Calendar as CalendarIcon,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import { TimePicker } from "@/components/ui/time-picker";
import { cn } from "@/lib/utils";

import { useMachines } from "../../hooks/use-machines";
import { useMembers } from "@/features/members/hooks/use-members";
import { useTrainers } from "@/features/trainers/hooks/use-trainers";
import { useCreateTrainingSession } from "../../hooks/use-training-sessions";
import {
  createSessionSchema,
  type CreateSessionData,
} from "../../lib/validation";
import { MemberCombobox } from "./MemberCombobox";
import { SessionLimitWarning } from "../SessionLimitWarning";
import { useStudioSessionLimit } from "../../hooks/use-studio-session-limit";

type BookingFormData = CreateSessionData;

export interface SessionBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultValues?: Partial<BookingFormData>;
}

/**
 * SessionBookingDialog - Updated booking form for machine-slot system
 *
 * Features:
 * - Machine selection (pre-filled from slot click, shows availability)
 * - Single member selection (searchable dropdown)
 * - Optional trainer selection (can be null, "Assign Later" placeholder)
 * - Time slot fields (pre-filled from slot, 30-min default duration)
 * - Form validation (machine + member required, trainer optional)
 *
 * @see US-009: Session Booking Form Update
 */
export const SessionBookingDialog = memo<SessionBookingDialogProps>(
  function SessionBookingDialog({ open, onOpenChange, defaultValues }) {
    // Fetch data
    const { data: machines = [], isLoading: machinesLoading } = useMachines();
    const { data: members = [], isLoading: membersLoading } = useMembers({
      limit: 10000, // Fetch all members for dropdown
    });
    const { data: trainers = [], isLoading: trainersLoading } = useTrainers({
      status: "active",
    });

    // Mutation
    const createSessionMutation = useCreateTrainingSession();

    // Form setup
    const form = useForm<BookingFormData>({
      resolver: zodResolver(createSessionSchema),
      defaultValues: {
        machine_id: "",
        member_id: "",
        trainer_id: null,
        scheduled_start: "",
        scheduled_end: "",
        session_type: "standard",
        notes: "",
        ...defaultValues,
      },
    });

    const { handleSubmit, reset, watch, setValue } = form;

    // Reset form when dialog opens with new defaultValues
    useEffect(() => {
      if (open && defaultValues) {
        reset({
          machine_id: defaultValues.machine_id || "",
          member_id: defaultValues.member_id || "",
          trainer_id: defaultValues.trainer_id || null,
          scheduled_start: defaultValues.scheduled_start || "",
          scheduled_end: defaultValues.scheduled_end || "",
          session_type: defaultValues.session_type || "standard",
          notes: defaultValues.notes || "",
        });
      }
    }, [open, defaultValues, reset]);

    // Watch scheduled_start to auto-calculate scheduled_end (30-min duration)
    const scheduledStart = watch("scheduled_start");
    const selectedDate = scheduledStart ? new Date(scheduledStart) : new Date();

    // Check studio session limit for the selected date
    const { data: sessionLimit } = useStudioSessionLimit(selectedDate);

    useEffect(() => {
      if (scheduledStart && !defaultValues?.scheduled_end) {
        const start = new Date(scheduledStart);
        const end = new Date(start.getTime() + 30 * 60 * 1000); // Add 30 minutes
        setValue("scheduled_end", end.toISOString());
      }
    }, [scheduledStart, defaultValues?.scheduled_end, setValue]);

    // Handle form submission
    const onSubmit = useCallback(
      async (data: BookingFormData) => {
        try {
          await createSessionMutation.mutateAsync({
            machine_id: data.machine_id,
            trainer_id: data.trainer_id || null,
            scheduled_start: data.scheduled_start,
            scheduled_end: data.scheduled_end,
            session_type: data.session_type,
            member_id: data.member_id,
            notes: data.notes || undefined,
          });

          toast.success("Session booked successfully", {
            description: "The training session has been added to the schedule.",
          });

          onOpenChange(false);
          reset();
        } catch (error) {
          toast.error("Failed to book session", {
            description:
              error instanceof Error
                ? error.message
                : "An unexpected error occurred.",
          });
        }
      },
      [createSessionMutation, onOpenChange, reset]
    );

    // Handle dialog close
    const handleClose = useCallback(() => {
      if (!createSessionMutation.isPending) {
        reset();
        onOpenChange(false);
      }
    }, [createSessionMutation.isPending, reset, onOpenChange]);

    // Format trainer display name
    const formatTrainerName = useCallback(
      (trainer: {
        id: string;
        user_profile?: { first_name?: string; last_name?: string };
      }) => {
        const profile = trainer.user_profile;
        if (profile?.first_name && profile?.last_name) {
          return `${profile.first_name} ${profile.last_name}`;
        }
        return trainer.id;
      },
      []
    );

    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-h-[90vh] w-[90vw] overflow-y-auto sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarPlus className="h-5 w-5" />
              Book Training Session
            </DialogTitle>
            <DialogDescription>
              Book a training session with machine selection and single member
              assignment.
            </DialogDescription>
          </DialogHeader>

          {/* Studio capacity warning */}
          {scheduledStart && <SessionLimitWarning date={selectedDate} />}

          <Form {...form}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Machine Selection (AC-1) */}
              <FormField
                control={form.control}
                name="machine_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Dumbbell className="h-4 w-4" />
                      Machine *
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={machinesLoading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a machine" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {machines.map((machine) => (
                          <SelectItem
                            key={machine.id}
                            value={machine.id}
                            disabled={!machine.is_available}
                          >
                            {machine.name}
                            {!machine.is_available && (
                              <span className="text-muted-foreground ml-2">
                                (Unavailable)
                              </span>
                            )}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Member Selection (AC-2) - Single member, not multi-select */}
              <FormField
                control={form.control}
                name="member_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Member *
                    </FormLabel>
                    <FormControl>
                      <MemberCombobox
                        members={members}
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={membersLoading}
                        placeholder="Select a member"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Trainer Selection (AC-3) - Optional */}
              <FormField
                control={form.control}
                name="trainer_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Trainer{" "}
                      <span className="text-muted-foreground text-sm font-normal">
                        (Optional - assign later)
                      </span>
                    </FormLabel>
                    <Select
                      onValueChange={(value) =>
                        field.onChange(value === "none" ? null : value)
                      }
                      value={field.value || "none"}
                      disabled={trainersLoading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Assign later" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Assign later</SelectItem>
                        {trainers.map((trainer) => (
                          <SelectItem key={trainer.id} value={trainer.id}>
                            {formatTrainerName(trainer)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                    <p className="text-muted-foreground text-xs">
                      You can assign a trainer when completing the session
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
                    <FormLabel>Session Type *</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="flex gap-3"
                      >
                        <label
                          htmlFor="trail"
                          className={`hover:border-primary/50 min-w-0 flex-1 cursor-pointer rounded-lg border-2 p-4 transition-all duration-200 ${
                            field.value === "trail"
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-muted-foreground"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <RadioGroupItem
                              value="trail"
                              id="trail"
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
                          htmlFor="standard"
                          className={`hover:border-primary/50 min-w-0 flex-1 cursor-pointer rounded-lg border-2 p-4 transition-all duration-200 ${
                            field.value === "standard"
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-muted-foreground"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <RadioGroupItem
                              value="standard"
                              id="standard"
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

              {/* Session Date */}
              <FormField
                control={form.control}
                name="scheduled_start"
                render={({ field }) => {
                  const sessionDate = field.value
                    ? new Date(field.value)
                    : undefined;

                  return (
                    <FormItem className="flex flex-col">
                      <FormLabel>Session Date *</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !sessionDate && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {sessionDate
                                ? format(sessionDate, "PPP")
                                : "Pick a date"}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={sessionDate}
                            onSelect={(date) => {
                              if (date) {
                                // Preserve time when changing date
                                const newDateTime = new Date(date);
                                if (sessionDate) {
                                  newDateTime.setHours(sessionDate.getHours());
                                  newDateTime.setMinutes(
                                    sessionDate.getMinutes()
                                  );
                                }
                                field.onChange(newDateTime.toISOString());

                                // Also update end date to match
                                const endDateTime = watch("scheduled_end");
                                if (endDateTime) {
                                  const endDate = new Date(endDateTime);
                                  const updatedEnd = new Date(date);
                                  updatedEnd.setHours(endDate.getHours());
                                  updatedEnd.setMinutes(endDate.getMinutes());
                                  setValue(
                                    "scheduled_end",
                                    updatedEnd.toISOString()
                                  );
                                }
                              }
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />

              {/* Time Fields */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Start Time */}
                <FormField
                  control={form.control}
                  name="scheduled_start"
                  render={({ field }) => {
                    const startDate = field.value
                      ? new Date(field.value)
                      : undefined;
                    const startTime = startDate
                      ? format(startDate, "HH:mm")
                      : "";

                    return (
                      <FormItem className="flex flex-col">
                        <FormLabel>Start Time *</FormLabel>
                        <TimePicker
                          value={startTime}
                          onChange={(time) => {
                            const [hours, minutes] = time.split(":");
                            const newDateTime = startDate
                              ? new Date(startDate)
                              : new Date();
                            newDateTime.setHours(parseInt(hours));
                            newDateTime.setMinutes(parseInt(minutes));
                            field.onChange(newDateTime.toISOString());
                          }}
                        />
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />

                {/* End Time */}
                <FormField
                  control={form.control}
                  name="scheduled_end"
                  render={({ field }) => {
                    const startDate = watch("scheduled_start")
                      ? new Date(watch("scheduled_start"))
                      : undefined;
                    const endDate = field.value
                      ? new Date(field.value)
                      : undefined;
                    const endTime = endDate ? format(endDate, "HH:mm") : "";

                    return (
                      <FormItem className="flex flex-col">
                        <FormLabel>End Time *</FormLabel>
                        <TimePicker
                          value={endTime}
                          onChange={(time) => {
                            const [hours, minutes] = time.split(":");
                            // Use the session date from scheduled_start
                            const newDateTime = startDate
                              ? new Date(startDate)
                              : new Date();
                            newDateTime.setHours(parseInt(hours));
                            newDateTime.setMinutes(parseInt(minutes));
                            field.onChange(newDateTime.toISOString());
                          }}
                        />
                        <FormMessage />
                        <p className="text-muted-foreground text-xs">
                          Default duration: 30 minutes
                        </p>
                      </FormItem>
                    );
                  }}
                />
              </div>

              {/* Notes */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
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

              {/* Form Actions (AC-5) */}
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={createSessionMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    createSessionMutation.isPending ||
                    (sessionLimit && !sessionLimit.can_book)
                  }
                >
                  {createSessionMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {sessionLimit && !sessionLimit.can_book
                    ? "Capacity Reached"
                    : createSessionMutation.isPending
                      ? "Booking..."
                      : "Book Session"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    );
  }
);

export default SessionBookingDialog;
