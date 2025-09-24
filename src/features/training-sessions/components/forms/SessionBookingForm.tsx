import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  AlertTriangle,
  CheckCircle,
  CalendarPlus,
  Loader2,
} from "lucide-react";

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
import { Alert, AlertDescription } from "@/components/ui/alert";

import { useSessionCreditValidator } from "../../hooks/use-session-credit-validator";
import { useSessionBookingWithCredits } from "../../hooks/use-session-booking-with-credits";
import { useMembers } from "../../hooks/use-members";
import { useTrainers } from "../../hooks/use-trainers";

// Validation schema for session booking
const sessionBookingSchema = z.object({
  memberId: z.string().min(1, "Member is required"),
  trainerId: z.string().min(1, "Trainer is required"),
  sessionDate: z.string().min(1, "Session date is required"),
  sessionTime: z.string().min(1, "Session time is required"),
  sessionType: z.enum(["trail", "standard"], {
    message: "Session type is required",
  }),
  notes: z.string().optional(),
});

type SessionBookingData = z.infer<typeof sessionBookingSchema>;

interface SessionBookingFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function SessionBookingForm({
  onSuccess,
  onCancel,
}: SessionBookingFormProps) {
  const [selectedMemberId, setSelectedMemberId] = useState("");

  // Fetch data
  const { data: members = [], isLoading: membersLoading } = useMembers();
  const { data: trainers = [], isLoading: trainersLoading } = useTrainers();

  // Credit validation for selected member
  const { data: creditValidation, isLoading: isValidatingCredits } =
    useSessionCreditValidator(selectedMemberId);

  // Enhanced booking mutation
  const bookSessionMutation = useSessionBookingWithCredits();

  // Form setup
  const form = useForm<SessionBookingData>({
    resolver: zodResolver(sessionBookingSchema),
    defaultValues: {
      memberId: "",
      trainerId: "",
      sessionDate: "",
      sessionTime: "",
      sessionType: undefined,
      notes: "",
    },
  });

  const onSubmit = async (data: SessionBookingData) => {
    try {
      await bookSessionMutation.mutateAsync(data);
      onSuccess?.();
    } catch {
      // Error is handled by the mutation's onError
    }
  };

  const formatMemberName = (member: {
    first_name: string;
    last_name: string;
  }) => {
    return `${member.first_name} ${member.last_name}`;
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
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Member Selection */}
            <FormField
              control={form.control}
              name="memberId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Member *</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      setSelectedMemberId(value);
                    }}
                    value={field.value}
                    disabled={membersLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a member" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {members.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {formatMemberName(member)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Credit Validation Alerts */}
            {selectedMemberId && !isValidatingCredits && creditValidation && (
              <div className="space-y-2">
                {/* Error alerts */}
                {creditValidation.errors.map((error, index) => (
                  <Alert key={`error-${index}`} variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                ))}

                {/* Warning alerts */}
                {creditValidation.warnings.map((warning, index) => (
                  <Alert key={`warning-${index}`}>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{warning}</AlertDescription>
                  </Alert>
                ))}

                {/* Success state */}
                {creditValidation.canBook &&
                  creditValidation.warnings.length === 0 && (
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        ✓ {creditValidation.remainingSessions} session(s)
                        available
                      </AlertDescription>
                    </Alert>
                  )}
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
                      <SelectItem value="trail">Trail Session</SelectItem>
                      <SelectItem value="standard">Standard Session</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Date and Time */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="sessionDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Session Date *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sessionTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Session Time *</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
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
                  (creditValidation && !creditValidation.canBook)
                }
              >
                {bookSessionMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {bookSessionMutation.isPending
                  ? "Booking Session..."
                  : creditValidation && !creditValidation.canBook
                    ? "Cannot Book Session"
                    : "Book Session"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
