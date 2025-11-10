import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarPlus } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { logger } from "@/lib/logger";

import { useMachines } from "../../hooks/use-machines";
import { useMembers } from "@/features/members/hooks/use-members";
import { useTrainers } from "@/features/trainers/hooks/use-trainers";
import { useCreateTrainingSession } from "../../hooks/use-training-sessions";
import {
  createSessionSchema,
  type CreateSessionData,
} from "../../lib/validation";
import { useStudioSessionLimit } from "../../hooks/use-session-alerts";
import { QuickCollaborationMemberDialog } from "./QuickCollaborationMemberDialog";
import { requiresMember, requiresTrialMember } from "../../lib/type-guards";
import { SessionTypeStep, SessionDetailsStep } from "../session-booking";
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
        // Trial member fields (must be initialized to prevent uncontrolled → controlled warning)
        new_member_first_name: "",
        new_member_last_name: "",
        new_member_phone: "",
        new_member_email: "", // Initialize as empty string, not undefined
        new_member_gender: undefined,
        new_member_referral_source: undefined,
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
          // Trial member fields
          new_member_first_name: defaultValues.new_member_first_name || "",
          new_member_last_name: defaultValues.new_member_last_name || "",
          new_member_phone: defaultValues.new_member_phone || "",
          new_member_email: defaultValues.new_member_email || "", // Empty string, not undefined
          new_member_gender: defaultValues.new_member_gender,
          new_member_referral_source: defaultValues.new_member_referral_source,
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
                  <SessionTypeStep
                    form={form}
                    selectedDate={selectedDate}
                    sessionType={sessionType}
                    onNext={handleNext}
                    onCancel={handleClose}
                  />
                )}

                {currentStep === 2 && (
                  <SessionDetailsStep
                    form={form}
                    sessionType={sessionType}
                    machines={machines}
                    filteredMembers={filteredMembers}
                    trainers={trainers}
                    machinesLoading={machinesLoading}
                    membersLoading={membersLoading}
                    trainersLoading={trainersLoading}
                    isSubmitting={createSessionMutation.isPending}
                    canBook={!sessionLimit || sessionLimit.can_book}
                    onBack={handleBack}
                    onCancel={handleClose}
                    onShowQuickMemberDialog={() =>
                      setShowQuickMemberDialog(true)
                    }
                    formatTrainerName={formatTrainerName}
                  />
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
