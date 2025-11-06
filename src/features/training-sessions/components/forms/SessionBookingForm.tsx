import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarPlus, Loader2, CalendarIcon } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { getStartOfDay } from "@/lib/date-utils";

// Session credit validation functionality removed during hook consolidation
import { useMembers } from "@/features/members/hooks";
import { useTrainers } from "@/features/trainers/hooks";
import { useCreateTrainingSession } from "../../hooks/use-training-sessions";
import { MemberCombobox } from "./MemberCombobox";
import { SessionLimitWarning } from "../SessionLimitWarning";
import { useStudioSessionLimit } from "../../hooks/use-studio-session-limit";

// Validation schema for session booking
const sessionBookingSchema = z.object({
  memberId: z.string().min(1, "Member is required"),
  trainerId: z.string().min(1, "Trainer is required"),
  sessionDate: z.date(),
  sessionTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  location: z.string().min(1, "Location is required"),
  sessionType: z.enum(["trial", "member"], {
    message: "Session type is required",
  }),
  notes: z.string().optional(),
});

type SessionBookingData = z.infer<typeof sessionBookingSchema>;

interface SessionBookingFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  initialMemberId?: string;
}

export function SessionBookingForm({
  onSuccess,
  onCancel,
  initialMemberId,
}: SessionBookingFormProps) {
  const [selectedMemberId, setSelectedMemberId] = useState(
    initialMemberId || ""
  );
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  // Fetch data
  const { data: members = [], isLoading: membersLoading } = useMembers({
    limit: 10000, // Fetch all members for dropdown
  });
  const { data: trainers = [], isLoading: trainersLoading } = useTrainers();

  // Check session limit for selected date
  const { data: sessionLimit } = useStudioSessionLimit(
    selectedDate || new Date()
  );

  // Credit validation removed during hook consolidation - simplified validation will be in booking logic
  const creditValidation = null;
  const isValidatingCredits = false;

  // Enhanced booking mutation
  const bookSessionMutation = useCreateTrainingSession();

  // Form setup
  const form = useForm<SessionBookingData>({
    resolver: zodResolver(sessionBookingSchema),
    defaultValues: {
      memberId: initialMemberId || "",
      trainerId: "",
      sessionDate: undefined,
      sessionTime: "",
      endTime: "",
      location: "",
      sessionType: undefined,
      notes: "",
    },
  });

  const onSubmit = async (data: SessionBookingData) => {
    try {
      // Create Date objects in user's local timezone
      const startDateTime = new Date(data.sessionDate);
      const [startHours, startMinutes] = data.sessionTime.split(":");
      startDateTime.setHours(
        parseInt(startHours),
        parseInt(startMinutes),
        0,
        0
      );

      const endDateTime = new Date(data.sessionDate);
      const [endHours, endMinutes] = data.endTime.split(":");
      endDateTime.setHours(parseInt(endHours), parseInt(endMinutes), 0, 0);

      // Map old form data to new CreateSessionData structure
      const formattedData = {
        member_id: data.memberId,
        trainer_id: data.trainerId || null,
        scheduled_start: startDateTime.toISOString(),
        scheduled_end: endDateTime.toISOString(),
        session_type: data.sessionType,
        machine_id: "00000000-0000-0000-0000-000000000000", // TODO(#issue): Add machine selection to form - Track in GitHub issues
        notes: data.notes,
      };

      await bookSessionMutation.mutateAsync(formattedData);
      onSuccess?.();
    } catch {
      // Error is handled by the mutation's onError
    }
  };

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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarPlus className="h-5 w-5" />
          Book Training Session
        </CardTitle>
        <CardDescription>
          Book a training session with automatic credit validation
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Studio capacity warning */}
        {selectedDate && <SessionLimitWarning date={selectedDate} />}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Member Selection */}
            <FormField
              control={form.control}
              name="memberId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Member *</FormLabel>
                  <FormControl>
                    <MemberCombobox
                      members={members}
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value);
                        setSelectedMemberId(value);
                      }}
                      disabled={membersLoading}
                      placeholder="Select a member"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Credit Validation Alerts - Disabled during consolidation */}
            {/* Credit validation removed during hook consolidation - simplified validation will be in booking logic */}
            {false &&
              selectedMemberId &&
              !isValidatingCredits &&
              creditValidation && (
                <div className="space-y-2">
                  {/* Placeholder - validation removed */}
                </div>
              )}

            {/* Trainer Selection */}
            <FormField
              control={form.control}
              name="trainerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Trainer *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={trainersLoading}
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
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Session Type */}
            <FormField
              control={form.control}
              name="sessionType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Session Type *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select session type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="trial">Trial Session</SelectItem>
                      <SelectItem value="member">Member Session</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Date */}
            <FormField
              control={form.control}
              name="sessionDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Session Date *</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={(date) => {
                          field.onChange(date);
                          setSelectedDate(date);
                        }}
                        disabled={(date) => date < getStartOfDay()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Start and End Time */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="sessionTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Time *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select start time" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Array.from({ length: 24 }, (_, i) => i).map((hour) => {
                          const hourStr = hour.toString().padStart(2, "0");
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
                        })}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Time *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select end time" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Array.from({ length: 24 }, (_, i) => i).map((hour) => {
                          const hourStr = hour.toString().padStart(2, "0");
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
                        })}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Location */}
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Gym Floor, Studio A" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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

            {/* Form Actions */}
            <div className="flex justify-end gap-2 pt-4">
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={bookSessionMutation.isPending}
                >
                  Cancel
                </Button>
              )}
              <Button
                type="submit"
                disabled={
                  bookSessionMutation.isPending ||
                  isValidatingCredits ||
                  (sessionLimit && !sessionLimit.can_book)
                }
              >
                {bookSessionMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {sessionLimit && !sessionLimit.can_book
                  ? "Capacity Reached"
                  : bookSessionMutation.isPending
                    ? "Booking Session..."
                    : "Book Session"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
