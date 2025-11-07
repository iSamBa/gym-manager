import { memo, useCallback, useMemo } from "react";
import { format } from "date-fns";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
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
import {
  Dumbbell,
  User,
  Users,
  Calendar as CalendarIcon,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { UseFormReturn } from "react-hook-form";
import type { CreateSessionData } from "../../lib/validation";
import { MemberCombobox } from "../forms/MemberCombobox";
import { TrialMemberRegistration } from "../forms/TrialMemberRegistration";
import { GuestSessionInfo } from "../forms/GuestSessionInfo";
import {
  requiresMember,
  requiresTrialMember,
  isGuestSession,
  createsNewMember,
} from "../../lib/type-guards";
import type { MemberWithEnhancedDetails } from "@/features/database/lib/types";

const SESSION_TYPE_LABELS: Record<
  NonNullable<CreateSessionData["session_type"]>,
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

interface SessionDetailsStepProps {
  form: UseFormReturn<CreateSessionData>;
  sessionType: NonNullable<CreateSessionData["session_type"]>;
  machines: Array<{ id: string; name: string; is_available: boolean }>;
  filteredMembers: MemberWithEnhancedDetails[];
  trainers: Array<{
    id: string;
    user_profile?: { first_name?: string; last_name?: string };
  }>;
  machinesLoading: boolean;
  membersLoading: boolean;
  trainersLoading: boolean;
  isSubmitting: boolean;
  canBook: boolean;
  onBack: () => void;
  onCancel: () => void;
  onShowQuickMemberDialog: () => void;
  formatTrainerName: (trainer: {
    id: string;
    user_profile?: { first_name?: string; last_name?: string };
  }) => string;
}

export const SessionDetailsStep = memo(function SessionDetailsStep({
  form,
  sessionType,
  machines,
  filteredMembers,
  trainers,
  machinesLoading,
  membersLoading,
  trainersLoading,
  isSubmitting,
  canBook,
  onBack,
  onCancel,
  onShowQuickMemberDialog,
  formatTrainerName,
}: SessionDetailsStepProps) {
  const handleDateSelect = useCallback(
    (date: Date | undefined) => {
      if (!date) return;

      const sessionDate = form.watch("scheduled_start")
        ? new Date(form.watch("scheduled_start"))
        : undefined;

      const newDateTime = new Date(date);
      if (sessionDate) {
        newDateTime.setHours(sessionDate.getHours());
        newDateTime.setMinutes(sessionDate.getMinutes());
      }
      form.setValue("scheduled_start", newDateTime.toISOString());

      const endDateTime = form.watch("scheduled_end");
      if (endDateTime) {
        const endDate = new Date(endDateTime);
        const updatedEnd = new Date(date);
        updatedEnd.setHours(endDate.getHours());
        updatedEnd.setMinutes(endDate.getMinutes());
        form.setValue("scheduled_end", updatedEnd.toISOString());
      }
    },
    [form]
  );

  const handleStartTimeChange = useCallback(
    (time: string) => {
      const [hours, minutes] = time.split(":");
      const startDate = form.watch("scheduled_start");
      const newDateTime = startDate ? new Date(startDate) : new Date();
      newDateTime.setHours(parseInt(hours));
      newDateTime.setMinutes(parseInt(minutes));
      form.setValue("scheduled_start", newDateTime.toISOString());
    },
    [form]
  );

  const handleEndTimeChange = useCallback(
    (time: string) => {
      const [hours, minutes] = time.split(":");
      const startDate = form.watch("scheduled_start");
      const newDateTime = startDate ? new Date(startDate) : new Date();
      newDateTime.setHours(parseInt(hours));
      newDateTime.setMinutes(parseInt(minutes));
      form.setValue("scheduled_end", newDateTime.toISOString());
    },
    [form]
  );

  const sessionDate = useMemo(() => {
    const scheduled = form.watch("scheduled_start");
    return scheduled ? new Date(scheduled) : undefined;
  }, [form]);

  const startTime = useMemo(() => {
    const scheduled = form.watch("scheduled_start");
    return scheduled ? format(new Date(scheduled), "HH:mm") : "";
  }, [form]);

  const endTime = useMemo(() => {
    const scheduled = form.watch("scheduled_end");
    return scheduled ? format(new Date(scheduled), "HH:mm") : "";
  }, [form]);

  return (
    <>
      {/* Selected Type Badge */}
      <div className="bg-muted flex items-center gap-2 rounded-lg border p-3">
        <span className="text-sm font-medium">
          Selected: {SESSION_TYPE_LABELS[sessionType]}
        </span>
      </div>

      {/* Machine Selection */}
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
      {createsNewMember(sessionType) && <TrialMemberRegistration form={form} />}

      {/* Member/Contractual/Makeup/Collaboration: Member Selection */}
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
                      ? onShowQuickMemberDialog
                      : undefined
                  }
                />
              </FormControl>
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

      {/* Multi-Site: Guest Info */}
      {isGuestSession(sessionType) && sessionType !== "non_bookable" && (
        <GuestSessionInfo form={form} sessionType={sessionType} />
      )}

      {/* Non-Bookable: Note */}
      {sessionType === "non_bookable" && (
        <div className="rounded-lg border bg-red-50 p-4 dark:bg-red-950/20">
          <p className="text-sm text-red-900 dark:text-red-100">
            This is a time blocker. No member information is needed. You can add
            optional notes below.
          </p>
        </div>
      )}

      {/* Trainer Selection */}
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
        render={() => (
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
                    {sessionDate ? format(sessionDate, "PPP") : "Pick a date"}
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={sessionDate}
                  onSelect={handleDateSelect}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Time Fields */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Start Time */}
        <FormField
          control={form.control}
          name="scheduled_start"
          render={() => (
            <FormItem className="flex flex-col">
              <FormLabel>Start Time *</FormLabel>
              <TimePicker value={startTime} onChange={handleStartTimeChange} />
              <FormMessage />
            </FormItem>
          )}
        />

        {/* End Time */}
        <FormField
          control={form.control}
          name="scheduled_end"
          render={() => (
            <FormItem className="flex flex-col">
              <FormLabel>End Time *</FormLabel>
              <TimePicker value={endTime} onChange={handleEndTimeChange} />
              <FormMessage />
              <p className="text-muted-foreground text-xs">
                Default duration: 30 minutes
              </p>
            </FormItem>
          )}
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

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onBack}>
          ← Back
        </Button>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || !canBook}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {!canBook
              ? "Capacity Reached"
              : isSubmitting
                ? "Booking..."
                : "Book Session"}
          </Button>
        </div>
      </div>
    </>
  );
});
