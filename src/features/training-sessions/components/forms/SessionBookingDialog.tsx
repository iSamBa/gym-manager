import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
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
import { Calendar } from "@/components/ui/calendar";
import { TimePicker } from "@/components/ui/time-picker";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";

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
import { useStudioSessionLimit } from "../../hooks/use-session-alerts";
import { SessionTypeSelector } from "./SessionTypeSelector";
import { TrialMemberRegistration } from "./TrialMemberRegistration";
import { GuestSessionInfo } from "./GuestSessionInfo";
import { QuickCollaborationMemberDialog } from "./QuickCollaborationMemberDialog";
import {
  requiresMember,
  requiresTrialMember,
  isGuestSession,
  createsNewMember,
} from "../../lib/type-guards";
import type { MemberType } from "@/features/database/lib/types";

type BookingFormData = CreateSessionData;

// Session type labels for success messages
const SESSION_TYPE_LABELS: Record<
  NonNullable<BookingFormData["session_type"]>,
  string
> = {
  trial: "Trial session",
  member: "Member session",
  contractual: "Contractual session",
  multi_site: "Multi-site session",
  collaboration: "Collaboration session",
  makeup: "Make-up session",
  non_bookable: "Non-bookable session",
};

/**
 * Validation: Check if a member type is allowed to book a session type
 * Business Rules:
 * - Collaboration members can ONLY book collaboration sessions
 * - Trial members can book trial and contractual sessions
 * - Full members can book member and makeup sessions (not collaboration)
 */
function canMemberTypeBookSessionType(
  memberType: MemberType,
  sessionType: NonNullable<BookingFormData["session_type"]>
): boolean {
  // Collaboration members can ONLY book collaboration sessions
  if (memberType === "collaboration") {
    return sessionType === "collaboration";
  }

  // Trial members can book trial and contractual sessions
  if (memberType === "trial") {
    return sessionType === "trial" || sessionType === "contractual";
  }

  // Full members can book member, makeup sessions (not collaboration)
  if (memberType === "full") {
    return (
      sessionType === "member" ||
      sessionType === "makeup" ||
      sessionType === "trial"
    );
  }

  return false;
}

/**
 * Get user-friendly error message for invalid booking attempt
 */
function getBookingErrorMessage(
  memberType: MemberType,
  sessionType: NonNullable<BookingFormData["session_type"]>
): string {
  if (memberType === "collaboration" && sessionType !== "collaboration") {
    return "Collaboration members can only book collaboration sessions.";
  }

  if (memberType !== "collaboration" && sessionType === "collaboration") {
    return "Collaboration sessions are reserved for collaboration members only.";
  }

  if (memberType === "trial" && sessionType === "member") {
    return "Trial members cannot book regular member sessions. Complete a contractual session first.";
  }

  return "This member cannot book this session type.";
}

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
    // Step state management
    const [currentStep, setCurrentStep] = useState<1 | 2>(1);

    // Quick member creation dialog state
    const [showQuickMemberDialog, setShowQuickMemberDialog] = useState(false);

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
      mode: "onSubmit", // Only validate when submitting (prevents validation errors on Step 1)
      reValidateMode: "onChange", // Re-validate after first submit
      defaultValues: {
        machine_id: "",
        member_id: "",
        trainer_id: null,
        scheduled_start: "",
        scheduled_end: "",
        notes: "",
        guest_first_name: "",
        guest_last_name: "",
        guest_gym_name: "",
        ...defaultValues,
      },
    });

    const { handleSubmit, reset, watch, setValue } = form;

    // Watch session type to drive dynamic form sections
    const sessionType = watch("session_type");

    // Reset form when dialog opens with new defaultValues
    useEffect(() => {
      if (open && defaultValues) {
        setCurrentStep(1); // Always start at step 1 when opening with new data
        reset({
          machine_id: defaultValues.machine_id || "",
          member_id: defaultValues.member_id || "",
          trainer_id: defaultValues.trainer_id || null,
          scheduled_start: defaultValues.scheduled_start || "",
          scheduled_end: defaultValues.scheduled_end || "",
          session_type: defaultValues.session_type,
          notes: defaultValues.notes || "",
          guest_first_name: defaultValues.guest_first_name || "",
          guest_last_name: defaultValues.guest_last_name || "",
          guest_gym_name: defaultValues.guest_gym_name || "",
        });
      }
    }, [open, defaultValues, reset]);

    // Watch scheduled_start to auto-calculate scheduled_end (30-min duration)
    const scheduledStart = watch("scheduled_start");
    const selectedDate = useMemo(
      () => (scheduledStart ? new Date(scheduledStart) : new Date()),
      [scheduledStart]
    );

    // Filter members based on session type requirements
    const filteredMembers = useMemo(() => {
      // Collaboration sessions require collaboration members ONLY
      if (sessionType === "collaboration") {
        return members.filter((m) => m.member_type === "collaboration");
      }

      // Contractual sessions require trial members ONLY
      if (requiresTrialMember(sessionType)) {
        return members.filter((m) => m.member_type === "trial");
      }

      // Member/makeup sessions: exclude collaboration members
      // (collaboration members can ONLY book collaboration sessions)
      if (sessionType === "member" || sessionType === "makeup") {
        return members.filter((m) => m.member_type !== "collaboration");
      }

      return members;
    }, [members, sessionType]);

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
        logger.debug("Form submission initiated", {
          sessionType: data.session_type,
          machineId: data.machine_id,
          memberId: data.member_id,
        });

        // Validate booking restrictions for member-based sessions
        if (requiresMember(data.session_type) && data.member_id) {
          const selectedMember = members.find((m) => m.id === data.member_id);
          if (selectedMember) {
            const canBook = canMemberTypeBookSessionType(
              selectedMember.member_type,
              data.session_type
            );

            if (!canBook) {
              const errorMessage = getBookingErrorMessage(
                selectedMember.member_type,
                data.session_type
              );

              logger.warn("Booking validation failed", {
                memberType: selectedMember.member_type,
                sessionType: data.session_type,
                reason: errorMessage,
              });

              toast.error("Cannot book session", {
                description: errorMessage,
              });

              return; // Prevent submission
            }
          }
        }

        try {
          await createSessionMutation.mutateAsync(data);

          logger.info("Session created successfully", {
            sessionType: data.session_type,
            sessionId: data.machine_id, // Machine ID as identifier
          });

          const sessionTypeLabel =
            SESSION_TYPE_LABELS[data.session_type] || "Session";
          toast.success("Session booked successfully", {
            description: `${sessionTypeLabel} has been added to the schedule.`,
          });

          onOpenChange(false);
          reset();
        } catch (error) {
          logger.error("Session creation failed", {
            error: error instanceof Error ? error.message : String(error),
            sessionType: data.session_type,
            machineId: data.machine_id,
          });

          const message =
            error instanceof Error
              ? error.message
              : "An unexpected error occurred.";

          toast.error("Failed to book session", {
            description: message,
          });
        }
      },
      [createSessionMutation, onOpenChange, reset, members]
    );

    // Step navigation
    const handleNext = useCallback(() => {
      if (!sessionType) return; // Validation
      setCurrentStep(2);
    }, [sessionType]);

    const handleBack = useCallback(() => {
      setCurrentStep(1);
    }, []);

    // Handle dialog close
    const handleClose = useCallback(() => {
      if (!createSessionMutation.isPending) {
        setCurrentStep(1); // Reset to step 1
        reset();
        onOpenChange(false);
      }
    }, [createSessionMutation.isPending, reset, onOpenChange]);

    // Handle new member creation
    const handleMemberCreated = useCallback(
      (memberId: string, memberName: string) => {
        // Set the newly created member as selected
        setValue("member_id", memberId);

        logger.info("New collaboration member created and selected", {
          memberId,
          memberName,
        });

        toast.success("Member Selected", {
          description: `${memberName} has been added and selected for this session.`,
        });
      },
      [setValue]
    );

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
      <>
        <Dialog open={open} onOpenChange={handleClose}>
          <DialogContent className="max-h-[90vh] w-[90vw] overflow-y-auto sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CalendarPlus className="h-5 w-5" />
                Book Training Session {currentStep === 2 && "(Step 2 of 2)"}
              </DialogTitle>
              <DialogDescription>
                {currentStep === 1
                  ? "Select the type of training session"
                  : "Provide session details"}
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Display form-level errors */}
                {Object.keys(form.formState.errors).length > 0 && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/20">
                    <p className="text-sm font-semibold text-red-900 dark:text-red-100">
                      Please fix the following errors:
                    </p>
                    <ul className="mt-2 list-inside list-disc text-sm text-red-800 dark:text-red-200">
                      {Object.entries(form.formState.errors).map(
                        ([key, error]) => (
                          <li key={key}>
                            <span className="font-medium">{key}:</span>{" "}
                            {error?.message as string}
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                )}

                {currentStep === 1 && (
                  <>
                    {/* Studio capacity warning */}
                    {scheduledStart && (
                      <SessionLimitWarning date={selectedDate} />
                    )}

                    {/* Session Type Selector - REPLACES RadioGroup */}
                    <FormField
                      control={form.control}
                      name="session_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Session Type *</FormLabel>
                          <FormControl>
                            <SessionTypeSelector
                              value={field.value}
                              onChange={field.onChange}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Step 1 Navigation */}
                    <div className="flex justify-end gap-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleClose}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        onClick={handleNext}
                        disabled={!sessionType}
                      >
                        Next →
                      </Button>
                    </div>
                  </>
                )}

                {currentStep === 2 && (
                  <>
                    {/* Selected Type Badge */}
                    <div className="bg-muted flex items-center gap-2 rounded-lg border p-3">
                      <span className="text-sm font-medium">
                        Selected: {SESSION_TYPE_LABELS[sessionType]}
                      </span>
                    </div>

                    {/* Machine Selection (all types) */}
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

                    {/* DYNAMIC SECTIONS - Based on session type */}

                    {/* Trial: Quick Registration */}
                    {createsNewMember(sessionType) && (
                      <TrialMemberRegistration form={form} />
                    )}

                    {/* Member/Contractual/Makeup: Member Selection */}
                    {requiresMember(sessionType) && (
                      <FormField
                        control={form.control}
                        name="member_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              {requiresTrialMember(sessionType)
                                ? "Trial Member *"
                                : sessionType === "collaboration"
                                  ? "Collaboration Member *"
                                  : "Member *"}
                            </FormLabel>
                            <FormControl>
                              <MemberCombobox
                                members={filteredMembers}
                                value={field.value || ""}
                                onValueChange={field.onChange}
                                disabled={membersLoading}
                                placeholder={
                                  requiresTrialMember(sessionType)
                                    ? "Select a trial member"
                                    : sessionType === "collaboration"
                                      ? "Select a collaboration member"
                                      : "Select a member"
                                }
                                showAddNew={sessionType === "collaboration"}
                                onAddNew={
                                  sessionType === "collaboration"
                                    ? () => setShowQuickMemberDialog(true)
                                    : undefined
                                }
                              />
                            </FormControl>
                            {/* Show helpful message when no members match the filter */}
                            {filteredMembers.length === 0 && (
                              <p className="text-sm text-amber-600 dark:text-amber-500">
                                {sessionType === "collaboration"
                                  ? "No collaboration members available. Click 'Create New Member' to add one."
                                  : requiresTrialMember(sessionType)
                                    ? "No trial members available. Create a trial member first or book a trial session."
                                    : "No members available for this session type."}
                              </p>
                            )}
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {/* Multi-Site/Collaboration: Guest Info */}
                    {isGuestSession(sessionType) &&
                      sessionType !== "non_bookable" && (
                        <GuestSessionInfo
                          form={form}
                          sessionType={sessionType}
                        />
                      )}

                    {/* Non-Bookable: Just a note */}
                    {sessionType === "non_bookable" && (
                      <div className="rounded-lg border bg-red-50 p-4 dark:bg-red-950/20">
                        <p className="text-sm text-red-900 dark:text-red-100">
                          This is a time blocker. No member information is
                          needed. You can add optional notes below.
                        </p>
                      </div>
                    )}

                    {/* Trainer Selection (all types - optional) */}
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
                              <PopoverContent
                                className="w-auto p-0"
                                align="start"
                              >
                                <Calendar
                                  mode="single"
                                  selected={sessionDate}
                                  onSelect={(date) => {
                                    if (date) {
                                      // Preserve time when changing date
                                      const newDateTime = new Date(date);
                                      if (sessionDate) {
                                        newDateTime.setHours(
                                          sessionDate.getHours()
                                        );
                                        newDateTime.setMinutes(
                                          sessionDate.getMinutes()
                                        );
                                      }
                                      field.onChange(newDateTime.toISOString());

                                      // Also update end date to match
                                      const endDateTime =
                                        watch("scheduled_end");
                                      if (endDateTime) {
                                        const endDate = new Date(endDateTime);
                                        const updatedEnd = new Date(date);
                                        updatedEnd.setHours(endDate.getHours());
                                        updatedEnd.setMinutes(
                                          endDate.getMinutes()
                                        );
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
                          const endTime = endDate
                            ? format(endDate, "HH:mm")
                            : "";

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

                    {/* Step 2 Navigation */}
                    <div className="flex justify-between pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleBack}
                      >
                        ← Back
                      </Button>
                      <div className="flex gap-2">
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
                    </div>
                  </>
                )}
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Quick Collaboration Member Creation Dialog */}
        <QuickCollaborationMemberDialog
          open={showQuickMemberDialog}
          onOpenChange={setShowQuickMemberDialog}
          onMemberCreated={handleMemberCreated}
        />
      </>
    );
  }
);

export default SessionBookingDialog;
